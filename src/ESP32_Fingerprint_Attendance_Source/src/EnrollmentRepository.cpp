#include "EnrollmentRepository.h"

#include <ArduinoJson.h>

#include "Log.h"
#include "Settings.h"

namespace {

constexpr char TAG[] = "Repo";
constexpr char COLLECTION[] = "/enrollment_requests";

String requestPath(const String& id) { return String(COLLECTION) + "/" + id; }

// updatedAt dùng server timestamp của Firebase (số mili-giây) -> ESP32 không cần NTP
void stampUpdatedAt(JsonDocument& doc) { doc["updatedAt"][".sv"] = "timestamp"; }

bool patchRequest(FirebaseREST& firebase, const String& id, JsonDocument& doc) {
  String body;
  serializeJson(doc, body);
  const HttpResult res = firebase.patch(requestPath(id), body);
  if (!res.ok()) LOG_W(TAG, "PATCH %s failed: HTTP %d", id.c_str(), res.code);
  return res.ok();
}

}  // namespace

EnrollmentRepository::EnrollmentRepository(FirebaseREST& firebase, const char* deviceId)
    : _firebase(firebase), _deviceId(deviceId) {}

bool EnrollmentRepository::findFirst(EnrollmentStatus wanted, EnrollmentRequest& out) {
  // orderBy="$key" luôn dùng được mà không cần .indexOn; push ID sắp theo thời gian nên
  // lấy N phần tử cuối là N request mới nhất, duyệt từ cũ -> mới.
  const String query = "orderBy=%22%24key%22&limitToLast=" + String(Settings::REQUEST_SCAN_LIMIT);
  const HttpResult res = _firebase.get(COLLECTION, query);

  if (!res.ok()) {
    LOG_W(TAG, "List failed: HTTP %d %s", res.code, res.body.c_str());
    return false;
  }
  if (res.body == "null") return false;  // chưa có request nào

  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, res.body);
  if (err) {
    LOG_E(TAG, "JSON parse error: %s", err.c_str());
    return false;
  }

  for (JsonPair kv : doc.as<JsonObject>()) {
    JsonObject req = kv.value().as<JsonObject>();
    if (req.isNull()) continue;

    if (parseStatus(req["status"] | "") != wanted) continue;
    if (strcmp(req["deviceId"] | "", _deviceId) != 0) continue;  // request của thiết bị khác

    out.id = kv.key().c_str();
    out.employeeId = req["employeeId"] | "";
    return true;
  }
  return false;
}

EnrollmentStatus EnrollmentRepository::readStatus(const String& requestId) {
  const HttpResult res = _firebase.get(requestPath(requestId) + "/status");
  if (!res.ok()) return EnrollmentStatus::Unknown;

  JsonDocument doc;
  if (deserializeJson(doc, res.body)) return EnrollmentStatus::Unknown;
  return parseStatus(doc.as<const char*>());
}

bool EnrollmentRepository::markProcessing(const String& requestId) {
  if (readStatus(requestId) != EnrollmentStatus::Pending) {
    LOG_W(TAG, "Request %s is no longer PENDING, skip", requestId.c_str());
    return false;
  }

  JsonDocument doc;
  doc["status"] = toString(EnrollmentStatus::Processing);
  stampUpdatedAt(doc);
  return patchRequest(_firebase, requestId, doc);
}

bool EnrollmentRepository::markSuccess(const String& requestId, uint16_t fingerprintId) {
  JsonDocument doc;
  doc["status"] = toString(EnrollmentStatus::Success);
  doc["fingerprintId"] = fingerprintId;  // number
  stampUpdatedAt(doc);
  return patchRequest(_firebase, requestId, doc);
}

bool EnrollmentRepository::markFailed(const String& requestId, const char* errorMessage) {
  JsonDocument doc;
  doc["status"] = toString(EnrollmentStatus::Failed);
  doc["fingerprintId"] = nullptr;  // null (Firebase sẽ xóa field này, app đọc ra là null)
  if (Settings::INCLUDE_ERROR_MESSAGE && errorMessage != nullptr) {
    doc["errorMessage"] = errorMessage;
  }
  stampUpdatedAt(doc);
  return patchRequest(_firebase, requestId, doc);
}
