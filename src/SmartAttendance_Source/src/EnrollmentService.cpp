#include "EnrollmentService.h"

#include "Config.h"
#include "Log.h"
#include "Settings.h"

namespace {
constexpr char TAG[] = "Enroll";
}

EnrollmentService::EnrollmentService(EnrollmentRepository& repository, FingerprintSensor& sensor,
                                     Indicator& indicator, WiFiService& wifi)
    : _repository(repository), _sensor(sensor), _indicator(indicator), _wifi(wifi) {}

void EnrollmentService::recoverStaleRequests() {
  EnrollmentRequest request;
  for (uint8_t i = 0; i < 10; i++) {
    if (!_repository.findFirst(EnrollmentStatus::Processing, request)) break;

    LOG_W(TAG, "Stale PROCESSING request %s -> FAILED", request.id.c_str());
    if (!_repository.markFailed(request.id, "Device restarted during enrollment")) break;
  }
}

void EnrollmentService::poll() {
  EnrollmentRequest request;
  if (_repository.findFirst(EnrollmentStatus::Pending, request)) {
    process(request);
  }
}

void EnrollmentService::onStep(EnrollStep step) {
  switch (step) {
    case EnrollStep::PlaceFinger:      LOG_I(TAG, ">>> Place finger on the sensor..."); break;
    case EnrollStep::RemoveFinger:     LOG_I(TAG, ">>> Remove finger"); break;
    case EnrollStep::PlaceFingerAgain: LOG_I(TAG, ">>> Place the SAME finger again..."); break;
    case EnrollStep::FingerCaptured:   _indicator.showFingerRead(); break;
  }
}

// Thử lại thao tác ghi lên Firebase khi mạng chập chờn
bool EnrollmentService::withRetry(const std::function<bool()>& operation) {
  for (uint8_t i = 0; i < Settings::RESULT_WRITE_RETRIES; i++) {
    _wifi.ensureConnected(Settings::WIFI_CONNECT_TIMEOUT_MS);
    if (operation()) return true;
    delay(Settings::RESULT_RETRY_DELAY_MS);
  }
  return false;
}

void EnrollmentService::process(const EnrollmentRequest& request) {
  LOG_I(TAG, "Request %s (employeeId=%s)", request.id.c_str(), request.employeeId.c_str());

  // Request thiếu employeeId -> không hợp lệ
  if (request.employeeId.isEmpty()) {
    LOG_W(TAG, "Missing employeeId -> FAILED");
    withRetry([&] { return _repository.markFailed(request.id, "Missing employeeId"); });
    _indicator.showFailure();
    return;
  }

  // PENDING -> PROCESSING
  if (!_repository.markProcessing(request.id)) return;
  LOG_I(TAG, "-> PROCESSING");

  // Đăng ký vân tay thật trên cảm biến
  _indicator.showBusy();
  const EnrollOutcome outcome =
      _sensor.enroll(FINGERPRINT_STEP_TIMEOUT_MS, [this](EnrollStep step) { onStep(step); });
  _indicator.off();

  // App đã hủy trong lúc đang đăng ký -> không ghi đè CANCELLED, xóa vân tay vừa lưu
  if (_repository.readStatus(request.id) == EnrollmentStatus::Cancelled) {
    LOG_W(TAG, "Request was CANCELLED while processing");
    if (outcome.ok()) _sensor.deleteTemplate(outcome.id);
    _indicator.showFailure();
    return;
  }

  bool reported = false;
  if (outcome.ok()) {
    LOG_I(TAG, "Enrolled OK, fingerprintId=%u", (unsigned)outcome.id);
    reported = withRetry([&] { return _repository.markSuccess(request.id, outcome.id); });
    if (!reported) {
      // Không báo được kết quả -> xóa vân tay để cảm biến không giữ ID "mồ côi"
      LOG_E(TAG, "Could not report SUCCESS, removing template #%u", (unsigned)outcome.id);
      _sensor.deleteTemplate(outcome.id);
    }
  } else {
    LOG_W(TAG, "Enroll failed: %s", toString(outcome.error));
    reported = withRetry([&] { return _repository.markFailed(request.id, toString(outcome.error)); });
  }

  if (outcome.ok() && reported) _indicator.showSuccess();
  else                          _indicator.showFailure();
}
