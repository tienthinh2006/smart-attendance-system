#include "WiFiService.h"

#include "Log.h"

namespace {
constexpr char TAG[] = "WiFi";
}

bool WiFiService::connect(const char* ssid, const char* password, uint32_t timeoutMs) {
  _ssid = ssid;
  _password = password;
  return ensureConnected(timeoutMs);
}

bool WiFiService::ensureConnected(uint32_t timeoutMs) {
  if (isConnected()) return true;
  if (_ssid == nullptr) return false;

  LOG_I(TAG, "Connecting to %s ...", _ssid);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(_ssid, _password);

  const uint32_t start = millis();
  while (!isConnected() && millis() - start < timeoutMs) {
    delay(250);
  }

  if (isConnected()) {
    LOG_I(TAG, "Connected, IP = %s", WiFi.localIP().toString().c_str());
    return true;
  }
  LOG_W(TAG, "Connection failed");
  return false;
}
