#include "HrRepository.h"

#include <ArduinoJson.h>

#include "AttendanceCalculator.h"
#include "AttendanceRules.h"
#include "Log.h"

namespace {

constexpr char TAG[] = "HR";

String dailyPath(const String& date, const String& employeeId) {
  return "/attendance/" + date + "/" + employeeId;
}

bool patchJson(FirebaseREST& firebase, const String& path, JsonDocument& doc) {
  String body;
  serializeJson(doc, body);
  const HttpResult res = firebase.patch(path, body);
  if (!res.ok()) LOG_W(TAG, "PATCH %s failed: HTTP %d", path.c_str(), res.code);
  return res.ok();
}

}  // namespace

HrRepository::HrRepository(FirebaseREST& firebase) : _firebase(firebase) {}

FetchResult HrRepository::findEmployeeByFingerprint(uint16_t fingerprintId, Employee& out) {
  // Truy vấn theo fingerprintId (cần ".indexOn": ["fingerprintId"] trong Rules của node employees)
  HttpResult res = _firebase.get(
      "/employees", "orderBy=%22fingerprintId%22&equalTo=" + String(fingerprintId));

  if (res.code == 400) {
    // Chưa khai báo .indexOn -> tải cả danh sách rồi lọc tại chỗ (chậm hơn nhưng vẫn chạy)
    LOG_W(TAG, "employees has no .indexOn fingerprintId -> full scan. Add the index in Rules.");
    res = _firebase.get("/employees");
  }

  if (!res.ok()) {
    LOG_W(TAG, "Employee lookup failed: HTTP %d", res.code);
    return FetchResult::Error;
  }
  if (res.body == "null") return FetchResult::NotFound;

  JsonDocument doc;
  if (deserializeJson(doc, res.body)) {
    LOG_E(TAG, "Employee JSON parse error");
    return FetchResult::Error;
  }

  for (JsonPair kv : doc.as<JsonObject>()) {
    JsonObject e = kv.value().as<JsonObject>();
    if (e.isNull()) continue;
    if (!e["fingerprintId"].is<int>()) continue;
    if (e["fingerprintId"].as<int>() != (int)fingerprintId) continue;

    out.id = kv.key().c_str();
    out.name = e["name"] | "";
    out.active = e["active"] | true;
    out.shiftId = e["defaultShiftId"] | "";
    return FetchResult::Found;
  }
  return FetchResult::NotFound;
}

FetchResult HrRepository::getShift(const String& shiftId, Shift& out) {
  const HttpResult res = _firebase.get("/shifts/" + shiftId);
  if (!res.ok()) {
    LOG_W(TAG, "Shift lookup failed: HTTP %d", res.code);
    return FetchResult::Error;
  }
  if (res.body == "null") return FetchResult::NotFound;

  JsonDocument doc;
  if (deserializeJson(doc, res.body)) return FetchResult::Error;
  JsonObject s = doc.as<JsonObject>();
  if (s.isNull()) return FetchResult::NotFound;

  if (!AttendanceCalc::parseHm(s["startTime"] | "", out.startMinutes) ||
      !AttendanceCalc::parseHm(s["endTime"] | "", out.endMinutes)) {
    LOG_W(TAG, "Shift %s has invalid startTime/endTime", shiftId.c_str());
    return FetchResult::NotFound;
  }

  out.id = shiftId;
  out.name = s["name"] | "";
  out.graceMinutes = s["gracePeriodMinutes"] | (int)AttendanceRules::DEFAULT_GRACE_MINUTES;
  out.active = s["active"] | true;
  return FetchResult::Found;
}

FetchResult HrRepository::getDailyRecord(const String& date, const String& employeeId,
                                         DailyRecord& out) {
  const HttpResult res = _firebase.get(dailyPath(date, employeeId));
  if (!res.ok()) {
    LOG_W(TAG, "Daily record lookup failed: HTTP %d", res.code);
    return FetchResult::Error;
  }
  if (res.body == "null") return FetchResult::NotFound;

  JsonDocument doc;
  if (deserializeJson(doc, res.body)) return FetchResult::Error;
  JsonObject r = doc.as<JsonObject>();
  if (r.isNull()) return FetchResult::NotFound;

  out.checkIn = r["checkIn"] | "";
  out.checkOut = r["checkOut"] | "";
  return FetchResult::Found;
}

bool HrRepository::saveCheckIn(const String& date, const Employee& employee, const Shift& shift,
                               const String& checkInTime, const String& isoTimestamp,
                               uint32_t lateMinutes, const char* status) {
  JsonDocument doc;
  doc["checkIn"] = checkInTime;
  doc["timestamp"] = isoTimestamp;
  doc["lateMinutes"] = lateMinutes;
  doc["status"] = status;
  doc["shiftId"] = shift.id;
  doc["shiftName"] = shift.name;
  return patchJson(_firebase, dailyPath(date, employee.id), doc);
}

bool HrRepository::saveCheckOut(const String& date, const String& employeeId,
                                const String& checkOutTime, uint32_t earlyMinutes,
                                double overtimeHours, double workingHours) {
  JsonDocument doc;
  doc["checkOut"] = checkOutTime;
  doc["earlyMinutes"] = earlyMinutes;
  doc["overtimeHours"] = overtimeHours;
  doc["workingHours"] = workingHours;
  return patchJson(_firebase, dailyPath(date, employeeId), doc);
}
