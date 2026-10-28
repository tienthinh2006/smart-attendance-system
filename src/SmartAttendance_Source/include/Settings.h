#pragma once
#include <Arduino.h>

// Các tham số nội bộ ít khi phải đổi (Config.h giữ cấu hình phần cứng / mạng).
namespace Settings {

// Rules Firebase đang public nên để rỗng.
// Nếu sau này khóa rules bằng Database Secret thì điền vào đây (gửi kèm ?auth=...).
constexpr char FIREBASE_AUTH[] = "";

// Ghi thêm field "errorMessage" khi FAILED?
// Chỉ bật (true) nếu Data Contract / app của bạn có field này.
constexpr bool INCLUDE_ERROR_MESSAGE = false;

// Khi khởi động, request của thiết bị này còn kẹt ở PROCESSING (mất điện giữa chừng)
// sẽ được chuyển thành FAILED để app không phải chờ mãi.
constexpr bool FAIL_STALE_PROCESSING_ON_BOOT = true;

constexpr uint16_t HTTP_TIMEOUT_MS = 8000;
constexpr uint32_t WIFI_CONNECT_TIMEOUT_MS = 15000;

// Số lần thử ghi kết quả lên Firebase (mất mạng thoáng qua) và thời gian chờ giữa các lần
constexpr uint8_t RESULT_WRITE_RETRIES = 10;
constexpr uint32_t RESULT_RETRY_DELAY_MS = 1500;

// Mỗi lần poll chỉ đọc N request mới nhất (theo $key) - không cần .indexOn trên Firebase
constexpr uint8_t REQUEST_SCAN_LIMIT = 20;

}  // namespace Settings
