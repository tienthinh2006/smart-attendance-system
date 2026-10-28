#pragma once
#include <Arduino.h>

// Log gọn theo mức: [thời gian ms][I/W/E][TAG] nội dung
// Ví dụ: LOG_I("Enroll", "Slot #%d", slot);
#define LOG_I(tag, fmt, ...) \
  Serial.printf("[%9lu][I][%s] " fmt "\n", (unsigned long)millis(), tag, ##__VA_ARGS__)
#define LOG_W(tag, fmt, ...) \
  Serial.printf("[%9lu][W][%s] " fmt "\n", (unsigned long)millis(), tag, ##__VA_ARGS__)
#define LOG_E(tag, fmt, ...) \
  Serial.printf("[%9lu][E][%s] " fmt "\n", (unsigned long)millis(), tag, ##__VA_ARGS__)
