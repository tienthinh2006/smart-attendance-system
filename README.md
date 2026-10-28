# Hệ thống chấm công bằng vân tay – Smart Attendance System

Hệ thống chấm công tự động sử dụng cảm biến vân tay AS608, vi điều khiển ESP32, nền tảng Firebase và ứng dụng di động React Native.

## 1. Giới thiệu đề tài

Smart Attendance System là dự án xây dựng hệ thống chấm công bằng vân tay, kết hợp giữa hệ thống nhúng, dịch vụ đám mây và ứng dụng di động.

Hệ thống hướng đến việc hỗ trợ nhân viên thực hiện chấm công vào ca và kết thúc ca làm việc thông qua xác thực vân tay. Dữ liệu chấm công được đồng bộ lên Firebase để ứng dụng di động có thể truy xuất, quản lý và theo dõi lịch sử chấm công.

Dự án được thực hiện trong khuôn khổ học tập, nhằm vận dụng kiến thức về phát triển ứng dụng di động, lập trình vi điều khiển, giao tiếp phần cứng và quản lý dữ liệu trên nền tảng đám mây.

## 2. Chức năng chính

### 2.1. Chức năng dành cho quản trị viên

- Quản lý thông tin nhân viên.
- Đăng ký và liên kết mã vân tay với thông tin nhân viên.
- Quản lý ca làm việc.
- Xem lịch sử chấm công.
- Tìm kiếm và lọc dữ liệu chấm công.
- Theo dõi báo cáo và thống kê chấm công.

### 2.2. Chức năng dành cho nhân viên

- Xem thông tin chấm công cá nhân.
- Theo dõi ca làm việc được phân công.
- Xem thời gian check-in và check-out.
- Tra cứu lịch sử chấm công.
- Theo dõi tình trạng chấm công theo dữ liệu hệ thống.

### 2.3. Chức năng phần cứng

- Sử dụng cảm biến AS608 để nhận diện vân tay.
- Sử dụng ESP32 để xử lý dữ liệu giao tiếp với cảm biến.
- Giao tiếp giữa ESP32 và AS608 thông qua UART.
- Sử dụng đèn LED và còi buzzer để phản hồi kết quả nhận diện.

*Các chức năng cần được đối chiếu với phiên bản mã nguồn thực tế trước khi xác nhận hoàn thành.*

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Vi điều khiển | ESP32 LuaNode 32 |
| Cảm biến vân tay | AS608 |
| Giao tiếp phần cứng | UART |
| Phát triển ứng dụng di động | React Native |
| Ngôn ngữ lập trình ứng dụng | TypeScript |
| Xác thực tài khoản | Firebase Authentication |
| Cơ sở dữ liệu thời gian thực | Firebase Realtime Database |
| Lưu trữ tệp | Firebase Storage |

## 4. Kiến trúc hệ thống

Hệ thống gồm ba thành phần chính:

**4.1. Hệ thống phần cứng**

ESP32 kết nối với cảm biến vân tay AS608 thông qua giao tiếp UART. Sau khi nhận kết quả xác thực, hệ thống điều khiển đèn LED và còi buzzer để phản hồi trạng thái tương ứng.

**4.2. Dịch vụ đám mây**

Firebase Authentication phục vụ xác thực tài khoản. Firebase Realtime Database hỗ trợ lưu trữ và đồng bộ dữ liệu chấm công. Firebase Storage được sử dụng cho các tệp cần lưu trữ nếu có trong triển khai thực tế.

**4.3. Ứng dụng di động**

Ứng dụng được xây dựng bằng React Native và TypeScript, cung cấp giao diện để quản trị viên quản lý thông tin và nhân viên theo dõi dữ liệu chấm công.

## 5. Quy trình hoạt động

1. Nhân viên đặt ngón tay lên cảm biến AS608.
2. ESP32 giao tiếp với cảm biến để nhận kết quả nhận diện vân tay.
3. Khi kết quả hợp lệ, hệ thống xử lý sự kiện chấm công theo logic được triển khai.
4. Dữ liệu chấm công được gửi đến Firebase theo phương thức giao tiếp của hệ thống.
5. Ứng dụng di động truy xuất và hiển thị dữ liệu chấm công.
6. Người dùng xem thông tin theo quyền được cấp.

## 6. Cấu trúc repository

```text
smart-attendance-system/
├── src/
│   ├── ESP32_Fingerprint_Attendance_Source/
│   └── SmartAttendance_Source/
├── docs/
├── demo/
│   └── Video/
├── File_Apk/
└── README.md
```

- `src/`: Chứa mã nguồn phần cứng và ứng dụng di động.
- `docs/`: Chứa tài liệu, báo cáo và sơ đồ thiết kế.
- `demo/Video/`: Chứa video minh họa quá trình hoạt động của hệ thống.
- `File_Apk/`: Chứa tệp APK dùng để cài đặt và thử nghiệm ứng dụng.
- `README.md`: Tài liệu giới thiệu tổng quan về dự án.

*Cấu trúc trên mô tả cách tổ chức dự kiến; tên thư mục cần được điều chỉnh nếu khác với cấu trúc thực tế trên GitHub.*

## 7. Hướng dẫn triển khai

### 7.1. Tải mã nguồn

Sao chép repository về máy tính bằng lệnh:

```bash
git clone https://github.com/hihihaha214/smart-attendance-system.git
cd smart-attendance-system
```

### 7.2. Triển khai ứng dụng di động

- Mở thư mục mã nguồn ứng dụng.
- Kiểm tra các tệp cấu hình và phiên bản công cụ đang sử dụng.
- Cài đặt các thư viện phụ thuộc theo cấu hình dự án.
- Cấu hình Firebase phù hợp với môi trường triển khai.
- Chạy ứng dụng theo hướng dẫn tương ứng với cấu hình thực tế.

### 7.3. Triển khai phần cứng

- Kết nối ESP32 với cảm biến AS608 theo sơ đồ mạch.
- Kiểm tra nguồn cấp, chân TX/RX và cấu hình UART.
- Mở mã nguồn firmware trong môi trường phát triển phù hợp.
- Kiểm tra thư viện và cấu hình bo mạch trước khi nạp chương trình.

### 7.4. Cấu hình Firebase

- Thiết lập Firebase Authentication.
- Cấu hình Firebase Realtime Database.
- Thiết lập các dịch vụ lưu trữ cần thiết.
- Cấu hình quy tắc bảo mật và quyền truy cập dữ liệu.

Các bước triển khai chi tiết cần được bổ sung theo cấu hình thực tế của dự án.

## 8. Kiểm thử hệ thống

Các trường hợp kiểm thử đề xuất gồm:

- Nhận diện vân tay hợp lệ.
- Xử lý trường hợp vân tay không hợp lệ.
- Ghi nhận sự kiện check-in và check-out.
- Đồng bộ dữ liệu chấm công với Firebase.
- Đăng nhập và phân quyền người dùng.
- Hiển thị lịch sử chấm công trên ứng dụng.
- Kiểm tra khả năng xử lý khi mất kết nối mạng.

Kết quả kiểm thử, ảnh chụp giao diện và nhật ký hoạt động sẽ được trình bày trong thư mục tài liệu của dự án.

## 9. Định hướng phát triển

- Hoàn thiện cơ chế gửi thông báo khi ứng dụng chạy nền.
- Cải thiện giao diện và trải nghiệm người dùng.
- Bổ sung báo cáo và biểu đồ thống kê chấm công.
- Nâng cao khả năng xử lý lỗi và phục hồi kết nối.
- Hoàn thiện tài liệu triển khai và kiểm thử tự động.

## 10. Thông tin dự án

- **Tên dự án:** Smart Attendance System
- **Lĩnh vực:** Phát triển ứng dụng di động, hệ thống nhúng và IoT.
- **Mục đích:** Nghiên cứu và xây dựng hệ thống chấm công bằng vân tay phục vụ học tập và thử nghiệm.
- **Mã nguồn:** [smart-attendance-system](https://github.com/hihihaha214/smart-attendance-system)

## 11. Lưu ý bảo mật

Không công khai mật khẩu, mã truy cập bí mật, khóa riêng tư, thông tin cá nhân của nhân viên hoặc dữ liệu vân tay nhạy cảm.

Cần thiết lập quy tắc bảo mật Firebase phù hợp và giới hạn quyền truy cập dữ liệu theo vai trò người dùng.

---

*Dự án được xây dựng nhằm nghiên cứu việc tích hợp hệ thống nhúng, nhận diện vân tay, dịch vụ đám mây và ứng dụng di động trong bài toán quản lý chấm công.*
