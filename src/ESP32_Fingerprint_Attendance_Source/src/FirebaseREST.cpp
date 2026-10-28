#include "FirebaseREST.h"

#include "Log.h"
#include "Settings.h"

namespace {
constexpr char TAG[] = "Firebase";
}

FirebaseREST::FirebaseREST(const char* host, const char* authToken)
    : _host(host), _auth(authToken) {}

void FirebaseREST::begin() {
  _client.setInsecure();  // không kiểm tra chứng chỉ TLS (đủ dùng cho đồ án)
  _http.setReuse(true);   // giữ kết nối để mỗi lần poll không phải bắt tay TLS lại
}

String FirebaseREST::buildUrl(const String& path, const String& query) const {
  String url = String(_host) + path + ".json";

  String q = query;
  if (_auth != nullptr && _auth[0] != '\0') {
    if (q.length() > 0) q += '&';
    q += "auth=";
    q += _auth;
  }
  if (q.length() > 0) {
    url += '?';
    url += q;
  }
  return url;
}

HttpResult FirebaseREST::get(const String& path, const String& query) {
  return request("GET", path, query, "");
}

HttpResult FirebaseREST::patch(const String& path, const String& jsonBody) {
  return request("PATCH", path, "", jsonBody);
}

HttpResult FirebaseREST::request(const char* method, const String& path, const String& query,
                                 const String& body) {
  const String url = buildUrl(path, query);
  HttpResult result;

  // Thử tối đa 2 lần: kết nối keep-alive cũ có thể đã bị server đóng
  for (uint8_t attempt = 0; attempt < 2; attempt++) {
    _http.begin(_client, url);
    _http.setTimeout(Settings::HTTP_TIMEOUT_MS);
    _http.addHeader("Content-Type", "application/json");

    if (strcmp(method, "GET") == 0) {
      result.code = _http.GET();
    } else {
      result.code = _http.sendRequest(method, body);
    }

    if (result.code > 0) {
      result.body = _http.getString();
      _http.end();
      return result;
    }

    LOG_W(TAG, "%s failed: %s", method, HTTPClient::errorToString(result.code).c_str());
    _http.end();
    _client.stop();
  }
  return result;
}
