#pragma once
#include <Arduino.h>

// ================= WiFi =================
constexpr char WIFI_SSID[]     = "TEN_WIFI_CUA_BAN";
constexpr char WIFI_PASSWORD[] = "MAT_KHAU_WIFI";

// ================= Firebase =================
// CHỈ chứa host, KHÔNG chứa path. Các module tự nối path + ".json".
// Ví dụ FirebaseREST sẽ tự tạo:
//   FIREBASE_HOST + "/enrollment_requests.json"
//   FIREBASE_HOST + "/enrollment_requests/{id}.json"
//   FIREBASE_HOST + "/attendance_test.json"
constexpr char FIREBASE_HOST[] =
    "https://hihihaha-6f707-default-rtdb.asia-southeast1.firebasedatabase.app";

// Định danh thiết bị này. PHẢI khớp với trường "deviceId" mà app mobile
// gán trong /enrollment_requests/{requestId}/deviceId
constexpr char DEVICE_ID[] = "esp32_001";

// ================= Chân phần cứng =================
constexpr int PIN_FINGERPRINT_RX = 16; // ESP32 RX2 <- TX của cảm biến
constexpr int PIN_FINGERPRINT_TX = 17; // ESP32 TX2 -> RX của cảm biến
constexpr int PIN_BUZZER    = 4;
constexpr int PIN_LED_GREEN = 18;
constexpr int PIN_LED_RED   = 19;

constexpr uint32_t FINGERPRINT_BAUD = 57600;

// ================= Thời gian / giới hạn =================
// Chu kỳ ESP32 kiểm tra /enrollment_requests một lần (ms)
constexpr uint32_t ENROLLMENT_POLL_INTERVAL_MS = 3000;

// Timeout cho mỗi bước chờ đặt tay / bỏ tay khi enroll (ms)
constexpr uint32_t FINGERPRINT_STEP_TIMEOUT_MS = 15000;

// Số slot tối đa của cảm biến (tuỳ model, ví dụ R307/AS608 thường là 127 hoặc 1000).
// CẦN xác nhận lại theo datasheet cảm biến thực tế đang dùng.
constexpr uint8_t FINGERPRINT_CAPACITY = 127;
