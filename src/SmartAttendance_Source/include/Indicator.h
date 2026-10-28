#pragma once
#include <Arduino.h>

// Phản hồi cho người dùng bằng LED xanh / LED đỏ / còi.
// Giả định: LED sáng khi chân ở mức HIGH, còi là loại chủ động (active).
class Indicator {
 public:
  void begin();
  void off();

  void showReady();        // 1 tiếng bíp ngắn: hệ thống sẵn sàng
  void showBusy();         // xanh sáng liên tục: đang chờ đặt ngón tay
  void showFingerRead();   // bíp ngắn: cảm biến đã đọc được ngón tay
  void showSuccess();      // xanh sáng ~1s + 2 bíp ngắn
  void showFailure();      // đỏ sáng ~1s + 1 bíp dài
  void showSensorError();  // đỏ sáng liên tục: lỗi cảm biến

 private:
  void setLeds(bool green, bool red);
  void beep(uint16_t durationMs);
};
