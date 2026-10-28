#include "AttendanceRepository.h"
#include "Log.h"

namespace {
constexpr char TAG[] = "AttRepo";
constexpr char COLLECTION[] = "/attendance_logs";
}

AttendanceRepository::AttendanceRepository(FirebaseREST& firebase, const char* deviceId)
    : _firebase(firebase), _deviceId(deviceId) {}

bool AttendanceRepository::logAttendance(uint16_t fingerprintId) {
  JsonDocument doc;
  doc["fingerprintId"] = fingerprintId;
  doc["deviceId"] = _deviceId;
  doc["timestamp"][".sv"] = "timestamp"; // Nhờ Firebase tự điền thời gian thực

  String body;
  serializeJson(doc, body);

  // Dùng request("POST", ...) để push data mới thay vì patch
  const HttpResult res = _firebase.request("POST", COLLECTION, "", body);
  
  if (!res.ok()) {
    LOG_W(TAG, "Failed to log attendance: HTTP %d", res.code);
  }
  return res.ok();
}