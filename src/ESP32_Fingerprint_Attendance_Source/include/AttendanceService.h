#pragma once
#include "AttendanceProcessor.h"
#include "AttendanceRepository.h"
#include "FingerprintSensor.h"
#include "Indicator.h"
#include "WiFiService.h"

// Vòng quét chấm công: đọc vân tay -> gọi AttendanceProcessor -> báo kết quả bằng LED / còi.
class AttendanceService {
 public:
  AttendanceService(AttendanceRepository& rawLog, AttendanceProcessor& processor,
                    FingerprintSensor& sensor, Indicator& indicator, WiFiService& wifi);

  // Gọi liên tục trong loop()
  void poll();

 private:
  void handleRecognized(uint16_t fingerprintId);
  void showResult(const ScanResult& result);

  AttendanceRepository& _rawLog;  // nhật ký thô /attendance_logs
  AttendanceProcessor& _processor;
  FingerprintSensor& _sensor;
  Indicator& _indicator;
  WiFiService& _wifi;

  uint32_t _lastScanMs = 0;
  bool _armed = true;  // chỉ xử lý một lần cho mỗi lần chạm (chờ nhấc tay mới nhận lần sau)
};
