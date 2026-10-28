#pragma once
#include <Arduino.h>
#include <time.h>

// Đồng hồ thật lấy từ internet (NTP). ESP32 không có RTC nên mất điện là mất giờ.
class NtpClock {
 public:
  // Bật đồng bộ NTP theo múi giờ trong AttendanceRules. Gọi sau khi có WiFi.
  void begin();

  // Chờ tới khi có giờ hợp lệ hoặc hết thời gian
  bool waitForSync(uint32_t timeoutMs);

  bool isValid() const;
  time_t nowEpoch() const { return time(nullptr); }

  // Định dạng giờ địa phương, khớp với dữ liệu trên Firebase
  static String formatDate(time_t t);  // "2026-09-07"
  static String formatTime(time_t t);  // "08:02:15"
  static String formatIso(time_t t);   // "2026-09-07T08:02:15"
};
