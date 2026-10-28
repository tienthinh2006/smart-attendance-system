# ESP32 – Đăng ký vân tay qua Firebase (AS608)

Firmware PlatformIO cho hệ thống chấm công vân tay. ESP32 theo dõi
`/enrollment_requests` trên Firebase Realtime Database, điều khiển cảm biến AS608 để
đăng ký vân tay và ghi kết quả (`fingerprintId` thật) về Firebase.

## Luồng xử lý

```
App tạo request ──► /enrollment_requests/{id}  status = PENDING
                                │
                ESP32 (đúng deviceId) phát hiện
                                ▼
                        status = PROCESSING
                                ▼
                   Cảm biến đăng ký vân tay
                     ┌──────────┴──────────┐
                  thành công            thất bại
                     ▼                     ▼
      SUCCESS + fingerprintId (number)   FAILED + fingerprintId = null
```

- `CANCELLED` không bao giờ bị chuyển sang `PROCESSING`.
- `fingerprintId` luôn là ID thật do cảm biến lưu, kiểu number.
- ESP32 không tạo node nào ngoài `enrollment_requests`.

## Cấu trúc project

```
include/
  Config.h                WiFi, Firebase host, DEVICE_ID, chân phần cứng (KHÔNG commit)
  Config.example.h        Bản mẫu của Config.h (an toàn để commit)
  Settings.h              Tham số nội bộ: retry, timeout, tùy chọn errorMessage...
  Types.h                 EnrollmentStatus, EnrollmentRequest
  Log.h                   Macro LOG_I / LOG_W / LOG_E
  Indicator.h             LED xanh/đỏ + còi
  WiFiService.h           Kết nối WiFi
  FirebaseREST.h          HTTP client cho Firebase RTDB
  FingerprintSensor.h     Điều khiển AS608
  EnrollmentRepository.h  Đọc/ghi /enrollment_requests (Data Contract)
  EnrollmentService.h     Logic nghiệp vụ
src/
  *.cpp                   Cài đặt tương ứng
  main.cpp                Khởi tạo và nối các module
```

Mỗi module chỉ làm một việc:

| Module | Trách nhiệm | Biết về Firebase? | Biết về cảm biến? |
|---|---|:---:|:---:|
| `FingerprintSensor` | Giao tiếp phần cứng AS608 | ✗ | ✓ |
| `FirebaseREST` | Gửi GET/PATCH tới Firebase | ✓ | ✗ |
| `EnrollmentRepository` | Tên node, field, status theo Data Contract | ✓ | ✗ |
| `EnrollmentService` | Điều phối luồng đăng ký | qua repository | qua sensor |

## Đấu dây (mặc định trong `Config.h`)

| Thiết bị | ESP32 |
|---|---|
| AS608 TX | GPIO16 (RX2) |
| AS608 RX | GPIO17 (TX2) |
| AS608 VCC / GND | theo nhãn module (thường 3.3V) / GND |
| Còi | GPIO4 |
| LED xanh | GPIO18 |
| LED đỏ | GPIO19 |

## Cài đặt

1. Mở thư mục này bằng VS Code + PlatformIO.
2. Sửa `include/Config.h`: WiFi, `FIREBASE_HOST`, `DEVICE_ID`.
   **`DEVICE_ID` phải giống hệt (phân biệt hoa/thường) giá trị `deviceId` app ghi vào request.**
3. Build và upload, mở Serial Monitor (115200).

## Phản hồi LED / còi

| Trạng thái | Biểu hiện |
|---|---|
| Sẵn sàng | 1 bíp ngắn |
| Đang chờ đặt ngón tay | LED xanh sáng liên tục |
| Đọc được ngón tay | 1 bíp ngắn |
| Thành công | LED xanh ~1s + 2 bíp ngắn |
| Thất bại / bị hủy | LED đỏ ~1s + 1 bíp dài |
| Không thấy cảm biến | LED đỏ sáng liên tục |

## Test khi chưa có app

Trong Firebase Console, thêm một node con dưới `enrollment_requests` với:

```
employeeId    = "NV001"
deviceId      = "esp32_001"      (trùng DEVICE_ID)
status        = "PENDING"
createdAt     = 1757660000000    (number)
updatedAt     = 1757660000000    (number)
```

ESP32 sẽ tự chuyển sang `PROCESSING`, làm theo hướng dẫn trên Serial Monitor
(đặt ngón tay → nhấc ra → đặt lại), rồi ghi `SUCCESS` + `fingerprintId`.

## Xử lý sự cố

| Log | Nguyên nhân thường gặp |
|---|---|
| `Fingerprint sensor not found` | Sai dây TX/RX (phải nối chéo), thiếu nguồn, sai baud |
| `List failed: HTTP 401/403` | Rules Firebase không còn public |
| `GET failed: connection refused` | Mất WiFi hoặc sai `FIREBASE_HOST` |
| Không thấy request nào được xử lý | `deviceId` trong request khác `DEVICE_ID` |
| Enroll luôn `Two scans did not match` | Đặt hai lần không cùng một ngón / cùng vị trí |

## Lưu ý

- Firebase Realtime Database không lưu giá trị `null`: khi `FAILED`, field `fingerprintId`
  sẽ bị xóa khỏi node, phía app đọc ra là `null`.
- TLS đang dùng `setInsecure()` (không kiểm tra chứng chỉ) – đủ cho đồ án, không dùng cho sản phẩm thật.
- Nên xóa các request `PENDING` cũ khi test, nếu không ESP32 sẽ xử lý chúng ngay khi bật.
