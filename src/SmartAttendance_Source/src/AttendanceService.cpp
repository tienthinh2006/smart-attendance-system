#include "AttendanceService.h"

#include "AttendanceRules.h"
#include "Log.h"
#include "Settings.h"

namespace {
constexpr char TAG[] = "Attend";
constexpr uint32_t kScanIntervalMs = 150;  // quét thường xuyên để phản hồi nhanh
constexpr uint32_t kRemovalWaitMs = 3000;  // thời gian tối đa chờ nhấc tay sau mỗi lần xử lý

// Chờ tới khi cảm biến báo trống (đã nhấc tay). Trả về true nếu đã thấy nhấc tay.
bool waitForRemoval(FingerprintSensor& sensor, uint32_t timeoutMs) {
  const uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    if (sensor.search() == -1) return true;
    delay(50);
  }
  return false;
}
}  // namespace

AttendanceService::AttendanceService(AttendanceRepository& rawLog, AttendanceProcessor& processor,
                                     FingerprintSensor& sensor, Indicator& indicator,
                                     WiFiService& wifi)
    : _rawLog(rawLog), _processor(processor), _sensor(sensor), _indicator(indicator), _wifi(wifi) {}

// Mã trả về của _sensor.search():
//   >0 khớp (fingerprintId) | -1 không có tay | -2 ảnh mờ | -3 chưa đăng ký | -4 lỗi giao tiếp
//
// Quy tắc: cảm biến đã xác nhận có ngón tay thật thì LUÔN có phản hồi.
void AttendanceService::poll() {
  const uint32_t now = millis();
  if (now - _lastScanMs < kScanIntervalMs) return;
  _lastScanMs = now;

  const int id = _sensor.search();

  // Cảm biến trống -> sẵn sàng cho lần chạm tiếp theo
  if (id == -1) {
    _armed = true;
    return;
  }

  if (id == -4) {
    LOG_E(TAG, "Sensor communication error during search");
    return;
  }

  // Vẫn là lần chạm trước (chưa nhấc tay) -> không xử lý lại
  if (!_armed) return;

  if (id == -2) {
    LOG_W(TAG, "Image quality too low, try again");
    _indicator.showFailure();
    waitForRemoval(_sensor, kRemovalWaitMs);
    return;
  }

  if (id == -3) {
    LOG_W(TAG, "Unknown fingerprint scanned (not enrolled on sensor)");
    _indicator.showFailure();
    waitForRemoval(_sensor, kRemovalWaitMs);
    return;
  }

  // id > 0: cảm biến nhận diện được vân tay
  _armed = false;
  handleRecognized((uint16_t)id);

  // Chủ động chờ nhấc tay: thấy trống thì mở khóa ngay cho lần chạm sau
  if (waitForRemoval(_sensor, kRemovalWaitMs)) _armed = true;
}

void AttendanceService::handleRecognized(uint16_t fingerprintId) {
  LOG_I(TAG, "Recognized fingerprintId=%u", (unsigned)fingerprintId);
  _indicator.showFingerRead();  // bíp ngắn: đã đọc được vân tay
  _indicator.showBusy();        // xanh sáng trong lúc xử lý

  ScanResult result;
  for (uint8_t attempt = 0; attempt < AttendanceRules::NETWORK_RETRIES; attempt++) {
    _wifi.ensureConnected(Settings::WIFI_CONNECT_TIMEOUT_MS);
    result = _processor.process(fingerprintId);
    if (result.outcome != ScanOutcome::NetworkError) break;

    LOG_W(TAG, "Network error, retry %u/%u", (unsigned)(attempt + 1),
          (unsigned)AttendanceRules::NETWORK_RETRIES);
    delay(AttendanceRules::NETWORK_RETRY_DELAY_MS);
  }

  // Nhật ký thô: giữ nguyên hành vi cũ (mỗi lần quét nhận diện được ghi 1 dòng vào attendance_logs)
  if (AttendanceRules::LOG_RAW_SCANS && result.outcome != ScanOutcome::NetworkError) {
    _rawLog.logAttendance(fingerprintId);
  }

  showResult(result);
}

void AttendanceService::showResult(const ScanResult& result) {
  const char* name = result.employeeName.c_str();

  switch (result.outcome) {
    case ScanOutcome::CheckedIn:
      LOG_I(TAG, ">>> VAO CA OK: %s", name);
      _indicator.showSuccess();  // xanh + 2 bíp ngắn
      break;

    case ScanOutcome::CheckedOut:
      LOG_I(TAG, ">>> RA CA OK: %s", name);
      _indicator.showSuccess();
      break;

    case ScanOutcome::Duplicate:
      LOG_I(TAG, ">>> %s vua cham cong roi, bo qua", name);
      _indicator.off();
      _indicator.showFingerRead();  // 2 bíp ngắn, không đèn: "đã chấm công rồi"
      delay(150);
      _indicator.showFingerRead();
      break;

    case ScanOutcome::UnknownEmployee:
      LOG_W(TAG, ">>> Van tay chua gan voi nhan vien nao");
      _indicator.showFailure();
      break;

    case ScanOutcome::EmployeeInactive:
      LOG_W(TAG, ">>> Nhan vien %s da bi vo hieu hoa", name);
      _indicator.showFailure();
      break;

    case ScanOutcome::ShiftUnavailable:
      LOG_W(TAG, ">>> Nhan vien %s chua co ca lam viec hop le", name);
      _indicator.showFailure();
      break;

    case ScanOutcome::TimeUnavailable:
      LOG_E(TAG, ">>> Chua co gio thuc (NTP)");
      _indicator.showFailure();
      break;

    case ScanOutcome::NetworkError:
      LOG_E(TAG, ">>> Loi mang / Firebase, khong ghi duoc cham cong");
      _indicator.showFailure();
      break;
  }
}
