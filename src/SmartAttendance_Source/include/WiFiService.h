#pragma once
#include <Arduino.h>
#include <WiFi.h>

// Quản lý kết nối WiFi (kết nối lần đầu + tự nối lại khi rớt mạng)
class WiFiService {
 public:
  // Lưu SSID/password và thử kết nối (chặn tối đa timeoutMs)
  bool connect(const char* ssid, const char* password, uint32_t timeoutMs);

  // Nếu đang mất mạng thì thử nối lại (chặn tối đa timeoutMs)
  bool ensureConnected(uint32_t timeoutMs);

  bool isConnected() const { return WiFi.status() == WL_CONNECTED; }

 private:
  const char* _ssid = nullptr;
  const char* _password = nullptr;
};
