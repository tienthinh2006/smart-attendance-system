#pragma once
#include <Arduino.h>

#include <functional>

#include "EnrollmentRepository.h"
#include "FingerprintSensor.h"
#include "Indicator.h"
#include "WiFiService.h"

// Logic nghiệp vụ: điều phối Firebase (repository) <-> cảm biến vân tay <-> LED/còi.
//
//   PENDING (đúng deviceId) -> PROCESSING -> đăng ký vân tay
//      -> SUCCESS + fingerprintId thật   |   FAILED + fingerprintId = null
//   CANCELLED: không bao giờ được chuyển thành PROCESSING.
class EnrollmentService {
 public:
  EnrollmentService(EnrollmentRepository& repository, FingerprintSensor& sensor,
                    Indicator& indicator, WiFiService& wifi);

  // Gọi 1 lần lúc khởi động: request của thiết bị này còn kẹt PROCESSING -> FAILED
  void recoverStaleRequests();

  // Gọi định kỳ: nếu có request PENDING của thiết bị này thì xử lý luôn
  void poll();

 private:
  void process(const EnrollmentRequest& request);
  void onStep(EnrollStep step);
  bool withRetry(const std::function<bool()>& operation);

  EnrollmentRepository& _repository;
  FingerprintSensor& _sensor;
  Indicator& _indicator;
  WiFiService& _wifi;
};
