#pragma once
#include <Arduino.h>

#include "AttendanceCalculator.h"
#include "HrRepository.h"
#include "NtpClock.h"

enum class ScanOutcome : uint8_t {
  CheckedIn,         // vào ca
  CheckedOut,        // ra ca
  Duplicate,         // quét lại quá sớm, bỏ qua
  UnknownEmployee,   // vân tay có trong cảm biến nhưng chưa gắn với nhân viên nào
  EmployeeInactive,  // nhân viên đã bị vô hiệu hóa (active = false)
  ShiftUnavailable,  // nhân viên chưa có ca / ca không tồn tại / ca bị tắt
  TimeUnavailable,   // chưa đồng bộ được giờ (NTP)
  NetworkError       // lỗi mạng / Firebase, đáng thử lại
};

struct ScanResult {
  ScanOutcome outcome = ScanOutcome::NetworkError;
  String employeeName;
};

// Nghiệp vụ chấm công cho MỘT lần quét vân tay đã nhận diện:
//   fingerprintId -> nhân viên -> ca -> vào ca / ra ca -> ghi /attendance
// Quy tắc:
//   - Lần quét đầu trong ngày = checkIn. Các lần sau = checkOut (ghi đè giờ ra mới nhất).
//   - Quét lại trong DUPLICATE_WINDOW_SEC sau lần quét trước thì bỏ qua.
//   - "late" khi trễ từ gracePeriodMinutes của ca trở lên.
class AttendanceProcessor {
 public:
  AttendanceProcessor(HrRepository& hr, NtpClock& clock);

  ScanResult process(uint16_t fingerprintId);

 private:
  struct Context {
    Employee employee;
    Shift shift;
    String date;  // ngày của ca (key /attendance/{date})
    AttendanceCalc::ShiftWindow window = {0, 0};
    time_t now = 0;
  };

  ScanOutcome doCheckIn(const Context& ctx);
  ScanOutcome doCheckOut(const Context& ctx, const DailyRecord& record);

  HrRepository& _hr;
  NtpClock& _clock;
};
