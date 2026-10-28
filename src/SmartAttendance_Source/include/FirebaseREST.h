#pragma once
#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

struct HttpResult {
  int code = -1;  // HTTP status code, <0 nếu lỗi kết nối
  String body;
  bool ok() const { return code >= 200 && code < 300; }
};

// Client mỏng cho Firebase Realtime Database REST API.
// `path` truyền vào KHÔNG có ".json" (class tự nối). Ví dụ: "/enrollment_requests/abc".
class FirebaseREST {
 public:
  FirebaseREST(const char* host, const char* authToken);

  void begin();

  HttpResult get(const String& path, const String& query = "");
  HttpResult patch(const String& path, const String& jsonBody);
  HttpResult request(const char* method, const String& path, const String& query, const String& body);

 private:
  String buildUrl(const String& path, const String& query) const;

  const char* _host;
  const char* _auth;
  WiFiClientSecure _client;
  HTTPClient _http;
};
