#include "DeletionService.h"
#include <ArduinoJson.h>
#include "Log.h"

namespace {
constexpr char TAG[] = "Delete";
constexpr char COLLECTION[] = "/deletion_requests";
}

DeletionService::DeletionService(FirebaseREST& firebase, FingerprintSensor& sensor,
                                 Indicator& indicator, const char* deviceId)
    : _firebase(firebase), _sensor(sensor), _indicator(indicator), _deviceId(deviceId) {}

void DeletionService::poll() {
  // Lấy danh sách deletion_requests gần nhất
  const String query = "orderBy=%22%24key%22&limitToLast=5";
  const HttpResult res = _firebase.get(COLLECTION, query);
  if (!res.ok() || res.body == "null") return;

  JsonDocument doc;
  if (deserializeJson(doc, res.body)) return;

  for (JsonPair kv : doc.as<JsonObject>()) {
    JsonObject req = kv.value().as<JsonObject>();
    if (req.isNull()) continue;

    const char* status = req["status"] | "";
    const char* targetDevice = req["deviceId"] | "";

    // Chỉ xử lý các request PENDING gửi riêng cho device này
    if (strcmp(status, "PENDING") == 0 && strcmp(targetDevice, _deviceId) == 0) {
      const String requestId = kv.key().c_str();
      const uint16_t fId = req["fingerprintId"] | 0;

      if (fId > 0) {
        processRequest(requestId, fId);
      }
      break; // Mỗi lần poll xử lý 1 request
    }
  }
}

bool DeletionService::processRequest(const String& requestId, uint16_t fingerprintId) {
  LOG_I(TAG, "Deleting fingerprintId=%u for request=%s", fingerprintId, requestId.c_str());

  // 1. Chuyển sang PROCESSING
  JsonDocument procDoc;
  procDoc["status"] = "PROCESSING";
  procDoc["updatedAt"][".sv"] = "timestamp";
  String body;
  serializeJson(procDoc, body);
  _firebase.patch(String(COLLECTION) + "/" + requestId, body);

  // 2. Ra lệnh cho cảm biến xóa vân tay trong ô nhớ
  const bool ok = _sensor.deleteTemplate(fingerprintId);

  // 3. Cập nhật kết quả lên Firebase
  JsonDocument resDoc;
  if (ok) {
    LOG_I(TAG, "Successfully deleted template #%u from AS608", fingerprintId);
    resDoc["status"] = "SUCCESS";
    _indicator.showSuccess();
  } else {
    LOG_E(TAG, "Failed to delete template #%u on sensor", fingerprintId);
    resDoc["status"] = "FAILED";
    resDoc["errorMessage"] = "Sensor failed to delete template";
    _indicator.showFailure();
  }
  resDoc["updatedAt"][".sv"] = "timestamp";

  String resBody;
  serializeJson(resDoc, resBody);
  return _firebase.patch(String(COLLECTION) + "/" + requestId, resBody).ok();
}