#pragma once
// Các hàm tính toán chấm công THUẦN (không phụ thuộc Arduino) -> có thể test trên máy tính.
// Mọi giờ đều theo múi giờ địa phương đã cấu hình (TZ), không có DST.

#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <time.h>

namespace AttendanceCalc {

constexpr long kSecondsPerDay = 86400;

// 00:00:00 của ngày chứa thời điểm t
inline time_t startOfDay(time_t t) {
  struct tm lt;
  localtime_r(&t, &lt);
  lt.tm_hour = 0;
  lt.tm_min = 0;
  lt.tm_sec = 0;
  return mktime(&lt);
}

inline uint16_t minuteOfDay(time_t t) {
  struct tm lt;
  localtime_r(&t, &lt);
  return (uint16_t)(lt.tm_hour * 60 + lt.tm_min);
}

// "08:00" -> 480
inline bool parseHm(const char* text, uint16_t& minutes) {
  int h = 0, m = 0;
  if (text == nullptr || sscanf(text, "%d:%d", &h, &m) != 2) return false;
  if (h < 0 || h > 23 || m < 0 || m > 59) return false;
  minutes = (uint16_t)(h * 60 + m);
  return true;
}

// Ca qua nửa đêm (vd 22:00 -> 06:00): giờ kết thúc <= giờ bắt đầu
inline bool isOvernight(uint16_t startMin, uint16_t endMin) { return endMin <= startMin; }

inline uint16_t durationMinutes(uint16_t startMin, uint16_t endMin) {
  return isOvernight(startMin, endMin) ? (uint16_t)(endMin + 1440 - startMin)
                                       : (uint16_t)(endMin - startMin);
}

// Lần quét này thuộc về ca của NGÀY nào.
// Ca thường: ngày hiện tại. Ca đêm: lần quét sau nửa đêm (tới hết giờ kết thúc + carryMinutes)
// vẫn thuộc ca bắt đầu từ hôm trước.
inline time_t shiftDayFor(time_t now, uint16_t startMin, uint16_t endMin, uint16_t carryMinutes) {
  if (isOvernight(startMin, endMin) && (int)minuteOfDay(now) < (int)endMin + (int)carryMinutes) {
    return now - kSecondsPerDay;
  }
  return now;
}

struct ShiftWindow {
  time_t start;
  time_t end;
};

inline ShiftWindow shiftWindow(time_t shiftDay, uint16_t startMin, uint16_t endMin) {
  ShiftWindow w;
  w.start = startOfDay(shiftDay) + (time_t)startMin * 60;
  w.end = w.start + (time_t)durationMinutes(startMin, endMin) * 60;
  return w;
}

// Số phút nguyên (làm tròn XUỐNG) của khoảng thời gian dương; <= 0 -> 0
inline uint32_t wholeMinutes(long seconds) { return seconds > 0 ? (uint32_t)(seconds / 60) : 0; }

// Số phút -> số giờ, làm tròn 2 chữ số (543 phút -> 9.05)
inline double toHours(uint32_t minutes) { return round(minutes / 60.0 * 100.0) / 100.0; }

// Đi trễ tính là "late" khi trễ ít nhất `graceMinutes` phút (và có trễ thật sự)
inline bool isLate(uint32_t lateMinutes, uint16_t graceMinutes) {
  return lateMinutes > 0 && lateMinutes >= graceMinutes;
}

// "HH:MM:SS" (không có ngày) -> lần xuất hiện GẦN NHẤT của giờ đó, không muộn hơn `now`
inline bool resolveRecent(const char* hms, time_t now, time_t& out) {
  int h = 0, m = 0, s = 0;
  if (hms == nullptr || sscanf(hms, "%d:%d:%d", &h, &m, &s) != 3) return false;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return false;
  time_t candidate = startOfDay(now) + h * 3600 + m * 60 + s;
  if (candidate > now) candidate -= kSecondsPerDay;
  out = candidate;
  return true;
}

}  // namespace AttendanceCalc
