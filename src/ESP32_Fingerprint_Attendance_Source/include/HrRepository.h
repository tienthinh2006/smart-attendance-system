#pragma once
#include <Arduino.h>

#include "FirebaseREST.h"

struct Employee {
  String id;       // key trong /employees (vd "employee004")
  String name;
  bool active = true;
  String shiftId;  // defaultShiftId
};

struct Shift {
  String id;
  String name;
  uint16_t startMinutes = 0;  // 08:00 -> 480
  uint16_t endMinutes = 0;
  uint16_t graceMinutes = 0;  // gracePeriodMinutes
  bool active = true;
};

// Phần của /attendance/{ngày}/{employeeId} mà ESP32 cần đọc
struct DailyRecord {
  String checkIn;   // "08:02:15" (rỗng nếu chưa có)
  String checkOut;
};

enum class FetchResult : uint8_t { Found, NotFound, Error };

// Truy cập dữ liệu nhân sự / chấm công trên Firebase.
// ESP32 chỉ ĐỌC /employees và /shifts, chỉ GHI /attendance/{ngày}/{employeeId}.
class HrRepository {
 public:
  explicit HrRepository(FirebaseREST& firebase);

  // Tìm nhân viên theo fingerprintId
  FetchResult findEmployeeByFingerprint(uint16_t fingerprintId, Employee& out);

  FetchResult getShift(const String& shiftId, Shift& out);

  FetchResult getDailyRecord(const String& date, const String& employeeId, DailyRecord& out);

  // Vào ca: ghi checkIn, lateMinutes, status, shift, timestamp
  bool saveCheckIn(const String& date, const Employee& employee, const Shift& shift,
                   const String& checkInTime, const String& isoTimestamp, uint32_t lateMinutes,
                   const char* status);

  // Ra ca: ghi checkOut, earlyMinutes, overtimeHours, workingHours
  bool saveCheckOut(const String& date, const String& employeeId, const String& checkOutTime,
                    uint32_t earlyMinutes, double overtimeHours, double workingHours);

 private:
  FirebaseREST& _firebase;
};
