#include "FingerprintSensor.h"

#include "Log.h"

namespace {
constexpr char TAG[] = "Sensor";
constexpr int kSlotCommError = -1;
constexpr int kSlotFull = -2;

// Lọc "ngón tay ảo" (ánh sáng đổi, va chạm): ngón tay thật phải còn trên kính
// sau kConfirmReads lần đọc lại, mỗi lần cách nhau kConfirmGapMs.
constexpr uint8_t kConfirmReads = 3;
constexpr uint16_t kConfirmGapMs = 80;
}  // namespace

FingerprintSensor::FingerprintSensor(HardwareSerial& serial)
    : _serial(serial), _finger(&serial) {}

void FingerprintSensor::begin(uint32_t baud, int rxPin, int txPin, uint16_t fallbackCapacity) {
  _fallbackCapacity = fallbackCapacity;
  _serial.begin(baud, SERIAL_8N1, rxPin, txPin);
  delay(1000);  // cho cảm biến khởi động
}

bool FingerprintSensor::probe() {
  if (!_finger.verifyPassword()) return false;
  _finger.getParameters();
  _finger.getTemplateCount();
  return true;
}

uint16_t FingerprintSensor::capacity() const {
  // Ưu tiên dung lượng thật do cảm biến báo, nếu không có thì dùng giá trị dự phòng
  return _finger.capacity != 0 ? _finger.capacity : _fallbackCapacity;
}

bool FingerprintSensor::deleteTemplate(uint16_t id) {
  return _finger.deleteModel(id) == FINGERPRINT_OK;
}

void FingerprintSensor::notify(const StepListener& listener, EnrollStep step) {
  if (listener) listener(step);
}

// Tìm slot trống đầu tiên (bắt đầu từ 1).
// Trả về id >= 1, hoặc kSlotCommError / kSlotFull.
int FingerprintSensor::findFreeSlot() {
  if (_finger.getParameters() != FINGERPRINT_OK) return kSlotCommError;
  const uint16_t cap = capacity();

  for (uint16_t id = 1; id < cap; id++) {
    const uint8_t p = _finger.loadModel(id);
    if (p == FINGERPRINT_OK) continue;                 // slot đã có vân tay
    if (p == FINGERPRINT_PACKETRECIEVEERR) return kSlotCommError;  // (sai chính tả là của thư viện)
    return id;                                         // slot trống
  }
  return kSlotFull;
}

// Chờ ngón tay, chụp ảnh và chuyển thành đặc trưng vào buffer 1 hoặc 2
bool FingerprintSensor::captureToBuffer(uint8_t bufferId, uint32_t timeoutMs,
                                        const StepListener& listener) {
  const uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    if (_finger.getImage() == FINGERPRINT_OK) {
      if (_finger.image2Tz(bufferId) == FINGERPRINT_OK) {
        notify(listener, EnrollStep::FingerCaptured);
        return true;
      }
      LOG_W(TAG, "Image quality too low, try again");
      delay(500);
    }
    delay(50);
  }
  return false;
}

bool FingerprintSensor::waitForRemoval(uint32_t timeoutMs) {
  const uint32_t start = millis();
  while (millis() - start < timeoutMs) {
    if (_finger.getImage() == FINGERPRINT_NOFINGER) return true;
    delay(50);
  }
  return false;
}

EnrollOutcome FingerprintSensor::enroll(uint32_t stepTimeoutMs, const StepListener& listener) {
  EnrollOutcome outcome;

  const int slot = findFreeSlot();
  if (slot == kSlotCommError) { outcome.error = EnrollError::SensorCommunication; return outcome; }
  if (slot == kSlotFull)      { outcome.error = EnrollError::StorageFull;         return outcome; }
  LOG_I(TAG, "Enrolling into slot #%d", slot);

  notify(listener, EnrollStep::PlaceFinger);
  if (!captureToBuffer(1, stepTimeoutMs, listener)) {
    outcome.error = EnrollError::TimeoutFirstScan;
    return outcome;
  }

  notify(listener, EnrollStep::RemoveFinger);
  if (!waitForRemoval(stepTimeoutMs)) {
    outcome.error = EnrollError::TimeoutRemoval;
    return outcome;
  }
  delay(500);

  notify(listener, EnrollStep::PlaceFingerAgain);
  if (!captureToBuffer(2, stepTimeoutMs, listener)) {
    outcome.error = EnrollError::TimeoutSecondScan;
    return outcome;
  }

  const uint8_t model = _finger.createModel();
  if (model != FINGERPRINT_OK) {
    outcome.error = (model == FINGERPRINT_ENROLLMISMATCH) ? EnrollError::ScanMismatch
                                                          : EnrollError::ModelCreationFailed;
    return outcome;
  }

  if (_finger.storeModel(slot) != FINGERPRINT_OK) {
    outcome.error = EnrollError::StoreFailed;
    return outcome;
  }

  outcome.id = static_cast<uint16_t>(slot);  // ID thật do cảm biến lưu
  return outcome;
}

// Trả về fingerprintId (>0) nếu tìm thấy, hoặc:
//   -1: không có ngón tay   -2: ảnh mờ   -3: có ngón tay nhưng chưa đăng ký
//   -4: lỗi giao tiếp với cảm biến
// Hàm này chỉ trả mã, không log: việc log / báo lỗi thuộc AttendanceService.
int FingerprintSensor::search() {
  if (_finger.getImage() != FINGERPRINT_OK) return -1;

  // Xác nhận ngón tay thật: ảnh thoáng qua do ánh sáng / va chạm sẽ biến mất -> coi như không có tay
  for (uint8_t i = 0; i < kConfirmReads; i++) {
    delay(kConfirmGapMs);
    if (_finger.getImage() != FINGERPRINT_OK) return -1;
  }

  if (_finger.image2Tz(1) != FINGERPRINT_OK) return -2;

  const uint8_t p = _finger.fingerSearch();
  if (p == FINGERPRINT_OK) return _finger.fingerID;  // ID lưu trong cảm biến
  if (p == FINGERPRINT_NOTFOUND) return -3;
  return -4;
}

bool FingerprintSensor::emptyDatabase() {
  // Giả sử đối tượng Adafruit_Fingerprint bên trong class của bạn tên là 'finger'
  // (Hãy kiểm tra lại trong FingerprintSensor.h xem biến gốc tên gì, có thể là _finger hoặc finger)
  return _finger.emptyDatabase() == FINGERPRINT_OK; 
}

bool FingerprintSensor::loadTemplate(uint16_t id) {
  // FINGERPRINT_OK nghĩa là có dữ liệu vân tay tại ID này
  return _finger.loadModel(id) == FINGERPRINT_OK;
}