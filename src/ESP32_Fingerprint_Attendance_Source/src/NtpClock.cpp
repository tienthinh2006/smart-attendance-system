#include "NtpClock.h"

#include "AttendanceRules.h"
#include "Log.h"

namespace {
constexpr char TAG[] = "Clock";
constexpr time_t kMinValidEpoch = 1700000000;  // ~ tháng 11/2023: nhỏ hơn nghĩa là chưa đồng bộ

String format(time_t t, const char* pattern) {
  struct tm lt;
  localtime_r(&t, &lt);
  char buf[24];
  strftime(buf, sizeof(buf), pattern, &lt);
  return String(buf);
}
}  // namespace

void NtpClock::begin() {
  configTzTime(AttendanceRules::TIME_ZONE, AttendanceRules::NTP_SERVER_1,
               AttendanceRules::NTP_SERVER_2, AttendanceRules::NTP_SERVER_3);
}

bool NtpClock::isValid() const { return time(nullptr) > kMinValidEpoch; }

bool NtpClock::waitForSync(uint32_t timeoutMs) {
  const uint32_t start = millis();
  while (!isValid() && millis() - start < timeoutMs) {
    delay(200);
  }
  if (isValid()) {
    LOG_I(TAG, "Time synced: %s", formatIso(nowEpoch()).c_str());
    return true;
  }
  LOG_W(TAG, "NTP sync timeout (will keep trying in background)");
  return false;
}

String NtpClock::formatDate(time_t t) { return format(t, "%Y-%m-%d"); }
String NtpClock::formatTime(time_t t) { return format(t, "%H:%M:%S"); }
String NtpClock::formatIso(time_t t) { return format(t, "%Y-%m-%dT%H:%M:%S"); }
