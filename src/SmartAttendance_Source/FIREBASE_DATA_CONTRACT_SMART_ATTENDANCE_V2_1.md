# FIREBASE DATA CONTRACT
# SMART ATTENDANCE & SHIFT MANAGER
## VERSION 2.1 — CLEANED & CONSOLIDATED

> Đây là hợp đồng dữ liệu giữa React Native + TypeScript,
> Firebase Authentication, Firebase Realtime Database và ESP32.
>
> Firebase Realtime Database là nguồn dữ liệu trung tâm.
> Data Contract là schema logic bắt buộc của ứng dụng.
>
> Không tự ý thay đổi cấu trúc Firebase hiện tại.

---

# 1. NGUYÊN TẮC CAO NHẤT

Data Contract này quyết định:
- node;
- path;
- Firebase key;
- field;
- kiểu dữ liệu;
- status;
- quyền sở hữu dữ liệu;
- luồng dữ liệu.

Không được tự ý:
- đổi tên node;
- đổi tên field;
- đổi kiểu;
- đổi key;
- xóa dữ liệu;
- migration;
- tạo node trùng chức năng;
- thay đổi protocol ESP32.

Nếu cần migration hoặc thay đổi schema:
STOP và yêu cầu phê duyệt.

---

# 2. FIREBASE NODES

## 2.1 Node hiện có

```text
/
├── attendance
├── attendance_test
├── devices
├── employees
├── settings
└── users
```

Các node này phải được giữ nguyên.

## 2.2 Node mới được phép

```text
shifts
enrollment_requests
```

RTDB sẽ tự tạo node khi ứng dụng ghi đúng path.

Không cần tạo node thủ công trên Firebase Console.

## 2.3 Node không được tạo cho cùng chức năng

```text
reports
employee
employeeRecords
staff
attendanceRecords
records
systemSettings
appSettings
workSettings
workShifts
shiftManagement
```

---

# 3. NAMING

Tất cả field mới dùng camelCase.

Ví dụ:

```text
employeeId
fingerprintId
defaultShiftId
checkIn
checkOut
createdAt
updatedAt
```

Không dùng đồng thời:
```text
employeeId
employeeID
employee_id
```

cho cùng một ý nghĩa.

---

# 4. ID

## 4.1 Employee ID

`employeeId` là mã duy nhất.

Ví dụ:

```text
employee001
employee002
employee003
```

Firebase path:

```text
/employees/{employeeId}
```

Không tạo thêm field `id` thay thế employeeId.

## 4.2 Shift ID

Ví dụ:

```text
shift_hanh_chinh
shift_sang
shift_chieu
shift_dem
shift_part_time
```

Firebase path:

```text
/shifts/{shiftId}
```

`shiftId` là Firebase key.

Không tạo field `id` trong object RTDB.

## 4.3 Device ID

Thiết bị hiện tại:

```text
esp32_001
```

## 4.4 Request ID

Mỗi enrollment request phải có ID duy nhất.

Khuyến nghị sử dụng Firebase `push()` để tạo key.

Nếu sử dụng push key, field `requestId` phải chứa chính key đó để thuận tiện cho tầng ứng dụng:

```text
/enrollment_requests/{requestId}
```

Ví dụ:

```json
{
  "requestId": "-Oabc123...",
  "employeeId": "employee001",
  "deviceId": "esp32_001",
  "status": "PENDING",
  "fingerprintId": null,
  "createdAt": 1757200000000,
  "updatedAt": 1757200000000
}
```

Không dùng `push()` cho employee nếu employeeId phải là key.

---

# 5. NODE attendance

## 5.1 Path

```text
/attendance/{date}/{employeeId}
```

## 5.2 Schema hiện tại

```json
{
  "checkIn": "08:02:15",
  "checkOut": "17:05:20",
  "status": "late",
  "timestamp": "2026-09-07T08:02:15"
}
```

## 5.3 Field

| Field | Kiểu | Trạng thái |
|---|---|---|
| checkIn | string/null | Có |
| checkOut | string/null | Có |
| status | string | Có |
| timestamp | string | Có |
| shiftId | string/null | Mới |
| shiftName | string/null | Mới |
| lateMinutes | number/null | Mới |
| earlyMinutes | number/null | Mới |
| overtimeHours | number/null | Mới |
| workingHours | number/null | Mới |
| note | string/null | Mới |

## 5.4 Status

Giữ nguyên status mà ESP32 hiện sử dụng.

Ví dụ:

```text
late
on-time
```

Không đổi Firebase thành:

```text
LATE
ON_TIME
```

Nếu UI cần enum khác, mapper Firebase → UI.

## 5.5 Ownership

```text
ESP32:
ghi attendance thực tế

React Native:
đọc
hiển thị
tính toán
export
```

React Native không được tự tạo attendance giả.

---

# 6. NODE attendance_test

Path:

```text
/attendance_test/{recordId}
```

Schema:

```json
{
  "fingerprintId": 6
}
```

Field:

```text
fingerprintId: number
```

Không đổi tên thành:
```text
fingerId
fingerprintID
fingerprint_id
```

Node này là dữ liệu test/trao đổi hiện có với thiết bị.

Không xóa nếu chưa xác định ESP32 không còn sử dụng.

---

# 7. NODE devices

Path:

```text
/devices/esp32_001
```

Schema:

```json
{
  "active": true,
  "name": "Attendance Device 01"
}
```

Field:

| Field | Kiểu |
|---|---|
| active | boolean |
| name | string |
| location | string, optional |
| lastSeen | number, optional |
| firmwareVersion | string, optional |

Không thêm field tùy tiện.

---

# 8. NODE employees

Path:

```text
/employees/{employeeId}
```

## 8.1 Field bắt buộc

```text
employeeId: string
name: string
phone: string
department: string
active: boolean
```

## 8.2 Field tùy chọn

```text
position: string
email: string
fingerprintId: number | null
defaultShiftId: string | null
avatarUrl: string | null
createdAt: number
updatedAt: number
```

## 8.3 Schema

```json
{
  "employeeId": "employee001",
  "name": "Le Van C",
  "phone": "09000000003",
  "department": "IT",
  "active": true,
  "position": "Developer",
  "email": "employee001@gmail.com",
  "fingerprintId": 5,
  "defaultShiftId": "shift_hanh_chinh",
  "avatarUrl": "",
  "createdAt": 1757200000000,
  "updatedAt": 1757200000000
}
```

## 8.4 fingerprintId

Kiểu duy nhất:

```text
number | null
```

Quy tắc:

- `null`: chưa đăng ký;
- `number`: ID thật từ ESP32;
- không sử dụng string;
- không tự tạo;
- không giả lập.

Nếu ESP32 trả:

```text
fingerprintId = 5
```

App lưu:

```text
5
```

---

# 9. NODE settings

Path:

```text
/settings
```

Schema:

```json
{
  "lateThreshold": 10,
  "workDays": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  },
  "workStartTime": "08:00",
  "workEndTime": "17:00"
}
```

Field:

```text
lateThreshold: number
workDays: object
workStartTime: string
workEndTime: string
```

Không tạo:

```text
systemSettings
appSettings
workSettings
```

`settings` là cấu hình chung duy nhất.

---

# 10. NODE users

Path:

```text
/users/{uid}
```

`uid` bắt buộc là Firebase Authentication UID.

Schema:

```json
{
  "active": true,
  "email": "admin@gmail.com",
  "employeeId": "employee001",
  "name": "Nguyen Van A",
  "role": "admin"
}
```

Field:

```text
active: boolean
email: string
employeeId: string
name: string
role: admin | employee
```

Không lưu:

```text
password
```

Password chỉ do Firebase Authentication quản lý.

---

# 11. FIREBASE AUTHENTICATION

Provider:

```text
Email/Password
```

API sử dụng:

```text
signInWithEmailAndPassword
createUserWithEmailAndPassword
signOut
onAuthStateChanged
```

Authentication chịu trách nhiệm:
- đăng ký;
- đăng nhập;
- đăng xuất;
- password;
- session.

RTDB chịu trách nhiệm:
- profile;
- role;
- active;
- dữ liệu ứng dụng.

Flow:

```text
Firebase Authentication
        ↓
       uid
        ↓
 /users/{uid}
```

Không dùng email/password làm key.

---

# 12. ROLE

Role hợp lệ:

```text
admin
employee
```

Admin:

```text
role === "admin"
AND
active === true
```

Employee không được truy cập chức năng quản trị.

Security Rules mới là lớp bảo vệ dữ liệu thực tế.

---

# 13. TẠO EMPLOYEE

Flow:

```text
Admin
 ↓
create Firebase Auth account
 ↓
UID
 ↓
users/{uid}
 ↓
employees/{employeeId}
```

Password ban đầu:

```text
1234
```

Không lưu password trong RTDB.

## 13.1 Lỗi giữa chừng

Nếu Auth tạo thành công nhưng RTDB thất bại:

- không báo thành công;
- hiển thị trạng thái chưa hoàn tất;
- không tạo UID khác;
- không lưu password;
- không dùng Admin SDK;
- cho phép xử lý lại theo thiết kế.

Client không được tự giả lập thao tác xóa Auth account bằng Admin SDK.

---

# 14. BẢO VỆ SESSION ADMIN

Khi Admin tạo Employee:

- không sign out Admin;
- không đổi `currentUser` của Admin sang Employee;
- không làm mất session.

Có thể sử dụng Firebase App/Auth instance phụ bằng Client SDK.

Đây là yêu cầu bắt buộc của ứng dụng.

---

# 15. NODE shifts

Path:

```text
/shifts/{shiftId}
```

Object KHÔNG có field `id`.

Schema:

```json
{
  "name": "Hành Chính",
  "startTime": "08:00",
  "endTime": "17:00",
  "description": "Ca hành chính",
  "colorHex": "#4F46E5",
  "gracePeriodMinutes": 10,
  "active": true
}
```

Field:

```text
name: string
startTime: string
endTime: string
description: string
colorHex: string
gracePeriodMinutes: number
active: boolean
```

## Preset

### Hành Chính

```text
ID: shift_hanh_chinh
08:00–17:00
```

### Sáng

```text
ID: shift_sang
06:00–14:00
```

### Chiều

```text
ID: shift_chieu
14:00–22:00
```

### Đêm

```text
ID: shift_dem
22:00–06:00
```

### Part-time

Part-time có:

```text
08:00–12:00
18:00–22:00
```

Nếu triển khai dạng hai segment, schema:

```text
segments
├── segment1
│   ├── startTime
│   └── endTime
└── segment2
    ├── startTime
    └── endTime
```

Chỉ sử dụng khi chức năng Part-time thực sự cần.

---

# 16. NODE enrollment_requests

Path:

```text
/enrollment_requests/{requestId}
```

Schema:

```json
{
  "requestId": "req_001",
  "employeeId": "employee001",
  "deviceId": "esp32_001",
  "status": "PENDING",
  "fingerprintId": null,
  "createdAt": 1757200000000,
  "updatedAt": 1757200000000
}
```

Field:

```text
requestId: string
employeeId: string
deviceId: string
status: EnrollmentStatus
fingerprintId: number | null
createdAt: number
updatedAt: number
```

Status:

```text
PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
```

---

# 17. ENROLLMENT FLOW

```text
Admin App
    ↓
create enrollment request
    ↓
Firebase
    ↓
ESP32 reads request
    ↓
Fingerprint registration
    ↓
ESP32 updates Firebase
    ↓
React Native receives realtime update
```

App không tạo fingerprintId.

Khi thành công:

```text
status = SUCCESS
fingerprintId = actual device ID
```

Sau đó:

```text
employees/{employeeId}/fingerprintId
```

được cập nhật bằng giá trị thực tế.

Không hiển thị thành công trước khi Firebase nhận kết quả thực tế.

---

# 18. OWNERSHIP OF DATA

| Node | React Native | ESP32 |
|---|---|---|
| employees | Đọc/Ghi theo quyền | Đọc nếu cần |
| attendance | Đọc | Ghi dữ liệu thực tế |
| attendance_test | Đọc | Ghi/trao đổi theo protocol |
| devices | Theo quyền | Theo protocol |
| settings | Theo quyền | Đọc nếu cần |
| users | Theo quyền | Không |
| shifts | Theo quyền | Đọc nếu cần |
| enrollment_requests | Tạo request/Đọc status | Đọc request/Ghi status + fingerprintId |

Nếu firmware hiện tại khác bảng trên:
- không phá protocol;
- không tự đổi field;
- tạo mapper/adaptor ở React Native nếu cần.

---

# 19. FIREBASE PATHS

Tất cả path tập trung tại:

```text
src/constants/firebasePaths.ts
```

Nội dung:

```typescript
export const FIREBASE_PATHS = {
  attendance: 'attendance',
  attendanceTest: 'attendance_test',
  devices: 'devices',
  employees: 'employees',
  settings: 'settings',
  users: 'users',
  shifts: 'shifts',
  enrollmentRequests: 'enrollment_requests',
} as const;
```

Không hard-code path Firebase rải rác trong UI.

---

# 20. FIREBASE DATA ACCESS

Luồng đọc:

```text
Firebase
   ↓
Service
   ↓
Mapper / Validator
   ↓
TypeScript Model
   ↓
UI
```

Không truy cập RTDB trực tiếp ở mọi screen.

Ví dụ:

```typescript
employeeService.createEmployee(...)
attendanceService.getAttendance(...)
shiftService.createShift(...)
enrollmentService.createRequest(...)
settingsService.getSettings(...)
deviceService.getDevices(...)
```

---

# 21. set / update / push

## set()

Dùng khi ghi toàn bộ object:

```text
/employees/{employeeId}
/shifts/{shiftId}
```

## update()

Dùng khi thay đổi một hoặc một số field.

Ví dụ:

```json
{
  "active": false,
  "updatedAt": 1757200010000
}
```

## push()

Chỉ dùng khi Data Contract cho phép ID tự sinh.

Phù hợp với:

```text
/enrollment_requests
```

Không dùng push cho:

```text
/employees/{employeeId}
```

nếu employeeId là key chuẩn.

Không dùng push để thay đổi cấu trúc attendance.

---

# 22. NULL / MISSING DATA

Field mới có thể không tồn tại trong dữ liệu cũ.

Không được:
- crash app;
- tạo dữ liệu giả;
- tự ghi field chỉ để làm dữ liệu cũ giống dữ liệu mới.

Các field tính toán có thể có:

```text
lateMinutes: number | null
earlyMinutes: number | null
workingHours: number | null
overtimeHours: number | null
```

UI có thể hiển thị:

```text
—
```

khi dữ liệu chưa tồn tại.

Không ghi `undefined` vào RTDB.

---

# 23. TYPESCRIPT MODELS

## Employee

```typescript
export interface Employee {
  employeeId: string;
  name: string;
  phone: string;
  department: string;
  active: boolean;

  position?: string;
  email?: string;
  fingerprintId?: number | null;
  defaultShiftId?: string | null;
  avatarUrl?: string | null;
  createdAt?: number;
  updatedAt?: number;
}
```

## WorkShift

```typescript
export interface WorkShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  colorHex: string;
  gracePeriodMinutes?: number;
  active: boolean;
}
```

`WorkShift.id` chỉ đại diện cho Firebase key `shiftId` ở tầng TypeScript/UI.

Firebase không lưu:

```text
id
```

trong object `/shifts/{shiftId}`.

## Attendance

```typescript
export type FirebaseAttendanceStatus =
  | 'on-time'
  | 'late';

export interface AttendanceRecord {
  employeeId: string;
  checkIn: string | null;
  checkOut: string | null;
  status: FirebaseAttendanceStatus | string;
  timestamp: string;

  shiftId?: string | null;
  shiftName?: string | null;
  lateMinutes?: number | null;
  earlyMinutes?: number | null;
  overtimeHours?: number | null;
  workingHours?: number | null;
  note?: string | null;
}
```

## User

```typescript
export interface User {
  active: boolean;
  email: string;
  employeeId: string;
  name: string;
  role: 'admin' | 'employee';
}
```

## Device

```typescript
export interface Device {
  active: boolean;
  name: string;
  location?: string;
  lastSeen?: number;
  firmwareVersion?: string;
}
```

## EnrollmentRequest

```typescript
export type EnrollmentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export interface EnrollmentRequest {
  requestId: string;
  employeeId: string;
  deviceId: string;
  status: EnrollmentStatus;
  fingerprintId: number | null;
  createdAt: number;
  updatedAt: number;
}
```

---

# 24. DASHBOARD DATA

Dashboard lấy dữ liệu từ:

```text
employees
attendance
settings
shifts
```

Tính động:

```text
totalEmployees
presentToday
lateToday
absentToday
onTimeRate
```

Không bắt buộc lưu các số liệu này vào Firebase.

---

# 25. HISTORY DATA

History lấy:

```text
attendance
employees
shifts
```

Filter:

```text
date
week
month
date range
department
employee
status
```

Hiển thị:

```text
employee
date
checkIn
checkOut
status
lateMinutes
earlyMinutes
workingHours
overtimeHours
```

---

# 26. REPORTS

Reports tính từ:

```text
attendance
employees
shifts
settings
```

Tính:

```text
tỷ lệ đúng giờ
số người đi muộn
số người vắng
số phút đi muộn
số phút về sớm
số giờ làm
số giờ tăng ca
theo phòng ban
theo nhân viên
```

Không tạo node:

```text
/reports
```

chỉ để lưu báo cáo động.

Export có thể gồm:

```text
CSV
Excel
PDF
```

nhưng việc cài dependency phải tuân theo Master Prompt.

---

# 27. REALTIME

Các dữ liệu cần realtime:

```text
/attendance
/enrollment_requests/{requestId}
/devices
```

Có thể sử dụng `onValue()`.

Listener phải được unsubscribe khi không còn sử dụng.

Không tạo listener trùng nhau cho cùng một màn hình.

---

# 28. SECURITY RULES

Security Rules phải bảo vệ:
- authentication state;
- UID;
- role;
- active;
- read;
- write;
- dữ liệu hợp lệ.

Không sử dụng public:

```text
.read = true
.write = true
```

cho production.

Admin được quản lý dữ liệu theo chính sách.

Employee không được tự ý sửa employee khác.

Employee không được thực hiện thao tác quản trị nếu không có quyền.

Attendance phải được bảo vệ khỏi ghi tùy ý.

Quyền ESP32 phải phù hợp với protocol hiện tại.

Nếu chưa đủ thông tin để viết Security Rules an toàn:
STOP và yêu cầu xác định quyền.

---

# 29. KHÔNG CODE ESP32

React Native chỉ:

```text
ghi enrollment request
đọc enrollment status
đọc fingerprintId thực tế
đọc attendance
hiển thị
tính toán
export
```

ESP32 chịu trách nhiệm:
- fingerprint sensor;
- fingerprint matching/registration;
- tạo attendance thực tế;
- cập nhật Firebase theo protocol hiện tại.

Không viết lại ESP32 trong project React Native.

---

# 30. KHÔNG MIGRATION TỰ ĐỘNG

AI không được tự động:
- rename node;
- rename field;
- move data;
- delete field;
- change key;
- convert toàn bộ dữ liệu.

Nếu cần migration:
STOP.

---

# 31. QUY TẮC TRƯỚC KHI THÊM NODE/FIELD

Phải kiểm tra:

```text
1. Firebase đã có dữ liệu này chưa?
2. Node hiện tại có thể dùng không?
3. Data Contract có cho phép không?
4. Có trùng chức năng với node hiện tại không?
```

Nếu không chắc:
STOP.

---

# 32. DEFINITION OF DONE — FIREBASE

- [ ] Đọc employees.
- [ ] Ghi employees.
- [ ] Đọc attendance.
- [ ] Nhận realtime attendance.
- [ ] Đọc attendance_test.
- [ ] Đọc devices.
- [ ] Đọc settings.
- [ ] Đọc users.
- [ ] CRUD shifts.
- [ ] Tạo enrollment_requests.
- [ ] Nhận realtime enrollment.
- [ ] Không tạo fingerprintId giả.
- [ ] Không tạo node trùng.
- [ ] Không đổi field Firebase.
- [ ] TypeScript models khớp Contract.
- [ ] Firebase paths tập trung.
- [ ] Firebase services tách UI.
- [ ] Xử lý null/missing fields.
- [ ] Không ghi undefined.
- [ ] Security Rules phù hợp.
- [ ] Có test đọc/ghi.

---

# 33. QUY TẮC CUỐI CÙNG CHO AI

Thứ tự bắt buộc:

```text
Firebase hiện tại
        ↓
Data Contract
        ↓
TypeScript interfaces
        ↓
Firebase paths
        ↓
Firebase services
        ↓
Validation / Mapper
        ↓
Business logic
        ↓
UI
```

Không làm ngược lại.

Data Contract không cho phép AI tự sáng tạo schema.

Nếu thiếu thông tin:
STOP.

Nếu có mâu thuẫn:
STOP.

Nếu cần thay đổi cấu trúc:
STOP.

Nếu cần dependency mới:
STOP.

Nếu cần backend/Admin SDK:
STOP.

Mục tiêu là giữ Firebase hiện tại tương thích với ESP32 và xây React Native App phía trên dữ liệu thực tế.
