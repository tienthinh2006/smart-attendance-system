#pragma once
#include <Arduino.h>

// Quy tắc chấm công. Muốn đổi cách tính thì sửa ở đây, không phải sửa logic.
namespace AttendanceRules {

// ---- Thời gian (NTP) ----
constexpr char TIME_ZONE[] = "<+07>-7";  // UTC+7 (Việt Nam, không có giờ mùa hè)
constexpr char NTP_SERVER_1[] = "pool.ntp.org";
constexpr char NTP_SERVER_2[] = "time.google.com";
constexpr char NTP_SERVER_3[] = "time.cloudflare.com";
constexpr uint32_t NTP_SYNC_TIMEOUT_MS = 15000;

// ---- Giá trị field "status" ----
constexpr char STATUS_LATE[] = "late";
// !!! Xác nhận với app: giá trị status khi đi đúng giờ là gì? (mở employee002 trong
// /attendance để xem). Nếu app dùng chuỗi khác thì đổi ở đây.
constexpr char STATUS_ON_TIME[] = "on_time";

// ---- Quy tắc ----
// Trễ từ bao nhiêu phút thì tính "late" nếu ca không khai báo gracePeriodMinutes
constexpr uint16_t DEFAULT_GRACE_MINUTES = 10;

// Quét lại trong khoảng này sau lần quét trước -> bỏ qua ("đã chấm công rồi")
constexpr uint32_t DUPLICATE_WINDOW_SEC = 300;

// Ca đêm: lần quét sau nửa đêm, tới (giờ kết thúc ca + số phút này) vẫn thuộc ca bắt đầu hôm trước.
// 22:00-06:00 + 360 phút -> trước 12:00 trưa vẫn tính là ca hôm trước.
constexpr uint16_t OVERNIGHT_CARRY_MINUTES = 360;

// Vẫn ghi mỗi lần quét vào /attendance_logs như trước (nhật ký thô)
constexpr bool LOG_RAW_SCANS = true;

// Lỗi mạng khi xử lý một lần quét: thử lại tối đa bấy nhiêu lần
constexpr uint8_t NETWORK_RETRIES = 3;
constexpr uint32_t NETWORK_RETRY_DELAY_MS = 1000;

}  // namespace AttendanceRules
