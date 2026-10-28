This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).
# Smart Attendance & Shift Manager

# Getting Started
Hệ thống ứng dụng di động quản trị điểm danh và ca làm việc thông minh (**Smart Attendance**) được xây dựng bằng **React Native** và **TypeScript**, kết nối trực tiếp với **Firebase Client SDK** (Firebase Authentication & Firebase Realtime Database) và đồng bộ dữ liệu thời gian thực với thiết bị phần cứng điểm danh vân tay **ESP32**.

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.
---

## Step 1: Start Metro
## 1. Project Overview

First, you will need to run **Metro**, the JavaScript build tool for React Native.
* **Tên dự án:** `SmartAttendance`
* **Mục đích:** Cung cấp ứng dụng di động dành cho Quản trị viên (Admin) để quản lý danh sách nhân sự, cấu hình ca làm việc, giám sát chấm công theo thời gian thực (realtime), khởi tạo và theo dõi tiến trình đăng ký vân tay qua thiết bị ESP32, xem lịch sử và xuất báo cáo thống kê.
* **Đặc tính cốt lõi:**
  * Toàn bộ dữ liệu nghiệp vụ sử dụng Firebase thật, không sử dụng dữ liệu giả (mock data).
  * Tuân thủ quy ước hợp đồng dữ liệu chuẩn tại `FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md`.
  * Không phụ thuộc vào Backend riêng hoặc Firebase Admin SDK; mọi thao tác vận hành hoàn toàn qua Firebase Client SDK.
  * Tối ưu hóa hiệu năng và dung lượng: Điều hướng màn hình thông qua React Context thuần (Zero-dependency ngoài core), loại bỏ hoàn toàn các lỗi xung đột build native trên hệ điều hành Windows.

To start the Metro dev server, run the following command from the root of your React Native project:
---

```sh
# Using npm
npm start
## 2. Technology Stack

# OR using Yarn
yarn start
```
Dự án sử dụng các công nghệ thực tế sau:

## Step 2: Build and run your app
* **Mobile Framework:** React Native `0.87.1`
* **Ngôn ngữ:** TypeScript `6.0.3`
* **UI & Safe Area:** `react-native-safe-area-context` `5.5.2`
* **Backend as a Service:** Firebase Client SDK `firebase` (sử dụng module `firebase/auth` và `firebase/database`)
* **Nền tảng Native:** Android (Gradle `9.5.0`, Kotlin `2.2.0`, Android SDK `36`)
* **Kiểm thử:** Jest `29.6.3`, `@react-native/jest-preset`

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:
---

### Android
## 3. Project Structure

```sh
# Using npm
npm run android
Cấu trúc thư mục thực tế của dự án:

# OR using Yarn
yarn android
```text
c:\Project_ST2\
├── android/                         # Cấu hình dự án Android native, Gradle wrapper
│   ├── app/                         # Mã nguồn ứng dụng Android & build outputs
│   ├── gradle/                      # Gradle wrapper (Gradle 9.5.0)
│   ├── build.gradle                 # Cấu hình build script Android, SDK 36
│   └── local.properties             # Đường dẫn trỏ tới Android SDK
├── src/
│   ├── config/
│   │   └── firebase.ts              # Khởi tạo tập trung Firebase App, Auth, Database
│   ├── constants/
│   │   ├── auth.ts                  # Hằng số xác thực (mật khẩu mặc định nhân viên)
│   │   ├── colors.ts                # Bảng màu chuẩn: Indigo, Slate, Emerald, Amber, Rose
│   │   └── firebasePaths.ts         # Khai báo tập trung các node/path Firebase
│   ├── types/
│   │   ├── user.ts                  # Interface User (/users/{uid})
│   │   ├── employee.ts              # Interface Employee (/employees/{employeeId})
│   │   ├── shift.ts                 # Interface WorkShift & ShiftFirebaseData (/shifts)
│   │   ├── attendance.ts            # Interface AttendanceRecord (/attendance)
│   │   ├── enrollment.ts            # Interface EnrollmentRequest (/enrollment_requests)
│   │   ├── settings.ts              # Interface SystemSettings (/settings)
│   │   ├── device.ts                # Interface Device (/devices)
│   │   └── index.ts                 # Export tổng hợp các kiểu dữ liệu
│   ├── services/
│   │   └── firebase/
│   │       ├── authService.ts       # Quản lý đăng nhập Admin, phiên làm việc, kiểm tra role/active
│   │       ├── adminAuthService.ts  # Tạo tài khoản nhân viên qua Secondary Firebase App instance
│   │       ├── employeeService.ts   # CRUD nhân viên, kích hoạt trạng thái, cập nhật fingerprintId
│   │       ├── shiftService.ts      # CRUD ca làm việc, ca mẫu preset, validate HH:mm
│   │       ├── attendanceService.ts # Đọc và lắng nghe realtime bản ghi chấm công từ ESP32
│   │       ├── enrollmentService.ts # Tạo request đăng ký vân tay và lắng nghe kết quả từ ESP32
│   │       ├── settingsService.ts   # Quản lý cấu hình giờ làm việc và ngưỡng đi muộn
│   │       ├── deviceService.ts     # Giám sát trạng thái thiết bị điểm danh ESP32
│   │       └── index.ts             # Export tổng hợp các services
│   ├── utils/
│   │   ├── validators.ts            # Kiểm tra tính hợp lệ (giờ HH:mm, email, SĐT, cleanPayload)
│   │   ├── mappers.ts               # Ánh xạ trạng thái Firebase sang giao diện UI
│   │   ├── dateUtils.ts             # Tính toán giờ làm việc, phút đi muộn, tăng ca, lọc ngày
│   │   └── exportUtils.ts           # Sinh chuỗi CSV chuẩn UTF-8 BOM và kích hoạt Native Share
│   ├── navigation/
│   │   └── NavigationContext.tsx    # State Router & Context quản lý chuyển tab và modal
│   ├── components/
│   │   ├── common/                  # Badge, Button, Input, StatCard, Header, BottomTabBar, ModalContainer
│   │   ├── employees/               # EmployeeModal (Thêm/Sửa nhân viên)
│   │   ├── shifts/                  # ShiftModal (Thêm/Sửa ca làm việc)
│   │   └── enrollment/              # EnrollmentModal (Đăng ký vân tay ESP32 realtime)
│   └── screens/
│       ├── LoginScreen.tsx          # Màn hình đăng nhập tài khoản quản trị
│       ├── DashboardScreen.tsx      # Bảng điều khiển tổng quan chỉ số vận hành
│       ├── EmployeesScreen.tsx      # Quản lý nhân sự, lọc phòng ban, tìm kiếm
│       ├── ShiftsScreen.tsx         # Quản lý ca làm việc
│       ├── AttendanceHistoryScreen.tsx # Lịch sử chấm công chi tiết theo ngày/nhân viên
│       ├── ReportsScreen.tsx        # Báo cáo tổng hợp hiệu suất và xuất file CSV
│       └── MainAppScreen.tsx        # Khung giao diện chính chứa Tab Navigator
├── __tests__/
│   ├── App.test.tsx                 # Kiểm thử render ứng dụng ban đầu
│   └── utils.test.ts                # Kiểm thử đơn vị các hàm tính toán, validators, mappers
├── App.tsx                          # Entry point ứng dụng, theo dõi Auth State
├── app.json                         # Thông tin định danh ứng dụng React Native
├── package.json                     # Khai báo dependency và script
├── tsconfig.json                    # Cấu hình TypeScript
└── FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md # Hợp đồng dữ liệu chuẩn
```

### iOS
---

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).
## 4. Main Features

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:
| Chức năng | Mô tả thực tế | Trạng thái |
|---|---|---|
| **Admin Authentication** | Đăng nhập bằng Email & Mật khẩu, xác minh quyền `admin` và trạng thái `active: true` tại `/users/{uid}`. Duy trì phiên làm việc tự động. | `Implemented` |
| **Bảo vệ phiên Admin khi tạo NV** | Sử dụng Secondary Firebase App instance độc lập để tạo tài khoản Auth nhân viên mà không làm đăng xuất hoặc thay đổi `currentUser` của Admin. | `Implemented` |
| **Employee Management** | Danh sách nhân viên, tìm kiếm theo tên/mã/SĐT/email, lọc theo phòng ban, thêm nhân viên mới, chỉnh sửa thông tin, khóa/mở khóa tài khoản, xóa hồ sơ. | `Implemented` |
| **Shift Management** | Danh sách ca làm, tạo ca mới, sửa, xóa ca tại `/shifts/{shiftId}`. Hỗ trợ áp dụng nhanh 5 ca mẫu (Hành chính, Sáng, Chiều, Đêm, Part-time), kiểm tra định dạng giờ `HH:mm`. | `Implemented` |
| **Fingerprint Enrollment** | Tạo yêu cầu đăng ký vân tay tại `/enrollment_requests/{requestId}` với trạng thái `PENDING`. Theo dõi tiến trình từ ESP32 (`PROCESSING` -> `SUCCESS`/`FAILED`). Khi thành công, tự động cập nhật `fingerprintId` thật vào hồ sơ nhân viên. | `Implemented` |
| **Realtime Attendance** | Lắng nghe dữ liệu chấm công thời gian thực tại `/attendance/{date}/{employeeId}` do ESP32 ghi nhận. Tính toán động số phút đi muộn, giờ làm, tăng ca. | `Implemented` |
| **Dashboard Tổng quan** | Hiển thị các chỉ số tính động: Tổng nhân sự, Điểm danh đúng giờ, Có mặt hôm nay, Đi muộn, tỷ lệ đúng giờ, danh sách chấm công mới nhất trong ngày và trạng thái thiết bị ESP32. | `Implemented` |
| **Attendance History** | Tra cứu lịch sử chấm công với bộ lọc đa chiều (tìm kiếm tên/mã NV, lọc trạng thái Đúng giờ / Đi muộn, lọc theo phòng ban). | `Implemented` |
| **Reports & Export** | Thống kê tỷ lệ đúng giờ, tổng giờ làm, tổng giờ tăng ca, phân tích hiệu suất theo từng phòng ban. Xuất dữ liệu ra file định dạng CSV (UTF-8 BOM hiển thị chuẩn tiếng Việt trên Excel) qua React Native Native Share. | `Implemented` |

```sh
bundle install
```
---

Then, and every time you update your native dependencies, run:
## 5. Authentication

```sh
bundle exec pod install
* **Nhà cung cấp xác thực:** Firebase Authentication (phương thức Email/Password).
* **Luồng đăng nhập Admin:**
  1. Admin nhập Email và Mật khẩu trên ứng dụng.
  2. Firebase Auth xác thực thông tin đăng nhập và trả về `uid`.
  3. Ứng dụng đọc dữ liệu tại path: `/users/{uid}` trên Firebase Realtime Database.
  4. Kiểm tra điều kiện:
     * `active === true`
     * `role === 'admin'`
  5. Nếu thỏa mãn điều kiện, điều hướng vào `MainAppScreen`. Nếu không thỏa mãn hoặc không tìm thấy hồ sơ, hệ thống tự động từ chối truy cập và đăng xuất.
* **Tạo tài khoản Nhân viên (Employee):**
  * Khi Admin tạo nhân viên mới, mật khẩu khởi tạo mặc định là:
    ```text
    abc@123
    ```
  * Mật khẩu được truyền trực tiếp vào Firebase Authentication thông qua Secondary Firebase App instance.
  * **Tuyệt đối không lưu mật khẩu vào Realtime Database** tại `/users/{uid}` hay `/employees/{employeeId}`.

---

## 6. Firebase Configuration & Nodes

Dự án kết nối trực tiếp đến Firebase project:
* **Firebase Project ID:** `hihihaha-6f707`
* **Realtime Database URL:** `https://hihihaha-6f707-default-rtdb.asia-southeast1.firebasedatabase.app`

### Các node Firebase thực tế được ứng dụng sử dụng:

* `/users/{uid}`: Hồ sơ người dùng liên kết với Firebase Auth UID (`active`, `email`, `employeeId`, `name`, `role`).
* `/employees/{employeeId}`: Thông tin nhân sự chi tiết (`employeeId`, `name`, `phone`, `department`, `position`, `email`, `fingerprintId`, `defaultShiftId`, `active`, `createdAt`, `updatedAt`).
* `/shifts/{shiftId}`: Thông tin ca làm việc (`name`, `startTime`, `endTime`, `description`, `colorHex`, `gracePeriodMinutes`, `active`). Lưu ý: Object lưu trên RTDB không chứa trường `id` dư thừa.
* `/attendance/{date}/{employeeId}`: Dữ liệu chấm công thực tế do ESP32 tạo (`checkIn`, `checkOut`, `status`, `timestamp`, `shiftId`, `shiftName`, `lateMinutes`, `earlyMinutes`, `workingHours`, `overtimeHours`, `note`).
* `/enrollment_requests/{requestId}`: Yêu cầu đăng ký vân tay (`requestId`, `employeeId`, `deviceId`, `status`, `fingerprintId`, `createdAt`, `updatedAt`).
* `/devices/{deviceId}`: Trạng thái và thông tin của thiết bị chấm công phần cứng (`name`, `active`, `location`, `lastSeen`, `firmwareVersion`).
* `/settings`: Cấu hình hệ thống chung (`lateThreshold`, `workDays`, `workStartTime`, `workEndTime`).
* `/attendance_test/{recordId}`: Node trao đổi dữ liệu kiểm thử với cảm biến.

---

## 7. Employee Flow

Mô hình liên kết dữ liệu nhân viên trong ứng dụng:

```text
Admin tạo nhân viên (Email + Mật khẩu mặc định abc@123)
       ↓
Firebase Authentication Account (tạo qua Secondary Instance)
       ↓
Firebase Auth UID (ví dụ: employeeUid)
       ↓
Ghi dữ liệu tại: /users/{employeeUid}
  - role: "employee"
  - active: true
  - employeeId: "employee00X"
       ↓
Ghi dữ liệu tại: /employees/{employeeId}
  - employeeId: "employee00X"
  - fingerprintId: null (ban đầu)
  - defaultShiftId: "shift_hanh_chinh"
       ↓
Admin vẫn duy trì phiên làm việc bình thường
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).
---

```sh
# Using npm
npm run ios
## 8. Attendance

# OR using Yarn
yarn ios
* Nguồn dữ liệu chấm công: Được tạo và cập nhật bởi thiết bị phần cứng (ESP32) trên node `/attendance/{date}/{employeeId}`.
* Ứng dụng di động **không tự tạo bản ghi chấm công giả mạo**.
* Ứng dụng đọc dữ liệu và sử dụng mapper để hiển thị trạng thái chuẩn:
  * `on-time` -> "Đúng giờ" (Emerald badge)
  * `late` -> "Đi muộn" (Amber badge)
  * Trường dữ liệu chưa có (ví dụ chưa check-out) hiển thị ký tự `—` thay vì giá trị mặc định gây sai lệch.

---

## 9. Fingerprint / ESP32 Enrollment

* Thiết bị thực tế trong hệ thống: `esp32_001` (Phòng bảo vệ).
* Quy trình đăng ký vân tay qua ứng dụng:
  1. Admin chọn nhân viên chưa có vân tay và bấm *"Đăng ký vân tay"*.
  2. Ứng dụng tạo yêu cầu tại `/enrollment_requests/{requestId}` với trạng thái `PENDING`.
  3. Thiết bị ESP32 phát hiện yêu cầu chuyển trạng thái sang `PROCESSING` và kích hoạt cảm biến quang học.
  4. Sau khi quét và lấy mẫu thành công, ESP32 cập nhật `status: SUCCESS` kèm `fingerprintId` thực tế của cảm biến (kiểu số, ví dụ `4`).
  5. Ứng dụng nhận sự kiện realtime từ Firebase, hiển thị thông báo thành công và tự động cập nhật `fingerprintId` vào `/employees/{employeeId}/fingerprintId`.
  6. Nếu xảy ra lỗi hoặc quá thời gian, trạng thái chuyển thành `FAILED` hoặc Admin có thể bấm *"Hủy yêu cầu"* (`CANCELLED`).
* Ứng dụng **không chứa code firmware ESP32, C++ hay PlatformIO**; tương tác phần cứng được trừu tượng hóa hoàn toàn qua Firebase Realtime Database.

---

## 10. Development

### Cài đặt môi trường
* Node.js $\ge$ `22.11.0` (Đã kiểm thử hoạt động tốt trên Node `v24.21.0`).
* Java OpenJDK `17`.
* Android SDK Platform `36` và Build-tools `36.0.0`.

### Cài đặt dependencies
```bash
npm install
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.
### Chạy Metro Bundler
```bash
npm start
```

This is one way to run your app — you can also build it directly from Android Studio or Xcode.
### Chạy ứng dụng trên thiết bị / máy ảo Android
```bash
npm run android
```

## Step 3: Modify your app
### Kiểm tra TypeScript
```bash
npx tsc --noEmit
```

Now that you have successfully run the app, let's make changes!
### Chạy kiểm thử tự động (Jest)
```bash
npm test
```

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).
---

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:
## 11. Build Android APK

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.
Dự án có cấu hình đầy đủ trong thư mục `android/` và có thể build APK trực tiếp trên Windows bằng Gradle Wrapper mà không cần mở Android Studio:

## Congratulations! :tada:
```powershell
cd android
.\gradlew.bat assembleDebug
```

You've successfully run and modified your React Native App. :partying_face:
Tệp APK đầu ra sau khi build thành công:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Now what?
---

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).
## 12. Current Status

# Troubleshooting
* **Authentication & Admin Session Protection:** `Implemented`
* **Employee Management CRUD:** `Implemented`
* **Shift Management CRUD & Presets:** `Implemented`
* **Fingerprint Enrollment Flow (ESP32):** `Implemented`
* **Realtime Attendance Listener & Dashboard:** `Implemented`
* **Attendance History & Multi-filter:** `Implemented`
* **Dynamic Reports & CSV Export:** `Implemented`
* **Android Gradle Build:** `Implemented & Verified`
* **Unit Tests (12/12 passing):** `Implemented & Verified`

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.
---

# Learn More
## 13. Known Limitations

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
* **Nền tảng mục tiêu hiện tại:** Dự án được tối ưu và kiểm thử hoàn chỉnh cho hệ điều hành **Android** trên máy tính Windows. Cấu hình iOS (CocoaPods) chưa được kiểm thử do môi trường phát triển hiện tại là Windows.
* **Xuất file:** Chức năng xuất báo cáo sử dụng định dạng file CSV chuẩn UTF-8 kết hợp Native Share API có sẵn của React Native core nhằm tuân thủ nguyên tắc không bổ sung thư viện thứ ba khi chưa phê duyệt. Các định dạng như `.xlsx` hoặc `.pdf` cần cài đặt thêm thư viện chuyên dụng nếu có nhu cầu trong tương lai.
