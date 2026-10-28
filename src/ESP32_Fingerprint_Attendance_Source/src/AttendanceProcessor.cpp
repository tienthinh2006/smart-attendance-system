#include "AttendanceProcessor.h"

#include "AttendanceRules.h"
#include "Log.h"

namespace {
constexpr char TAG[] = "Process";
}

AttendanceProcessor::AttendanceProcessor(HrRepository& hr, NtpClock& clock)
    : _hr(hr), _clock(clock) {}

ScanResult AttendanceProcessor::process(uint16_t fingerprintId) {
  ScanResult result;  // mặc định NetworkError: mọi lỗi đọc Firebase trả về nguyên như vậy

  // 0) Cần có giờ thật
  if (!_clock.isValid()) {
    LOG_E(TAG, "Clock is not synced (NTP) yet");
    result.outcome = ScanOutcome::TimeUnavailable;
    return result;
  }

  Context ctx;
  ctx.now = _clock.nowEpoch();

  // 1) fingerprintId -> nhân viên
  const FetchResult employeeResult = _hr.findEmployeeByFingerprint(fingerprintId, ctx.employee);
  if (employeeResult == FetchResult::Error) return result;
  if (employeeResult == FetchResult::NotFound) {
    LOG_W(TAG, "fingerprintId=%u is not linked to any employee", (unsigned)fingerprintId);
    result.outcome = ScanOutcome::UnknownEmployee;
    return result;
  }
  result.employeeName = ctx.employee.name;

  if (!ctx.employee.active) {
    LOG_W(TAG, "Employee %s is inactive", ctx.employee.id.c_str());
    result.outcome = ScanOutcome::EmployeeInactive;
    return result;
  }

  // 2) nhân viên -> ca làm việc
  if (ctx.employee.shiftId.isEmpty()) {
    LOG_W(TAG, "Employee %s has no defaultShiftId", ctx.employee.id.c_str());
    result.outcome = ScanOutcome::ShiftUnavailable;
    return result;
  }
  const FetchResult shiftResult = _hr.getShift(ctx.employee.shiftId, ctx.shift);
  if (shiftResult == FetchResult::Error) return result;
  if (shiftResult == FetchResult::NotFound || !ctx.shift.active) {
    LOG_W(TAG, "Shift %s missing or inactive", ctx.employee.shiftId.c_str());
    result.outcome = ScanOutcome::ShiftUnavailable;
    return result;
  }

  // 3) lần quét này thuộc ngày nào, khung giờ ca là bao nhiêu
  const time_t shiftDay = AttendanceCalc::shiftDayFor(
      ctx.now, ctx.shift.startMinutes, ctx.shift.endMinutes, AttendanceRules::OVERNIGHT_CARRY_MINUTES);
  ctx.date = NtpClock::formatDate(shiftDay);
  ctx.window = AttendanceCalc::shiftWindow(shiftDay, ctx.shift.startMinutes, ctx.shift.endMinutes);

  // 4) đã có bản ghi hôm nay chưa?
  DailyRecord record;
  const FetchResult recordResult = _hr.getDailyRecord(ctx.date, ctx.employee.id, record);
  if (recordResult == FetchResult::Error) return result;

  if (recordResult == FetchResult::NotFound || record.checkIn.isEmpty()) {
    result.outcome = doCheckIn(ctx);
  } else {
    result.outcome = doCheckOut(ctx, record);
  }
  return result;
}

ScanOutcome AttendanceProcessor::doCheckIn(const Context& ctx) {
  const uint32_t lateMinutes = AttendanceCalc::wholeMinutes((long)(ctx.now - ctx.window.start));
  const bool late = AttendanceCalc::isLate(lateMinutes, ctx.shift.graceMinutes);
  const char* status = late ? AttendanceRules::STATUS_LATE : AttendanceRules::STATUS_ON_TIME;

  LOG_I(TAG, "CHECK-IN  %s (%s) shift=%s late=%lu min -> %s", ctx.employee.name.c_str(),
        ctx.employee.id.c_str(), ctx.shift.id.c_str(), (unsigned long)lateMinutes, status);

  if (!_hr.saveCheckIn(ctx.date, ctx.employee, ctx.shift, NtpClock::formatTime(ctx.now),
                       NtpClock::formatIso(ctx.now), lateMinutes, status)) {
    return ScanOutcome::NetworkError;
  }
  return ScanOutcome::CheckedIn;
}

ScanOutcome AttendanceProcessor::doCheckOut(const Context& ctx, const DailyRecord& record) {
  // Chống quét trùng: so với lần quét gần nhất (giờ ra nếu có, nếu không thì giờ vào)
  const String& lastScanText = record.checkOut.isEmpty() ? record.checkIn : record.checkOut;
  time_t lastScan = 0;
  if (AttendanceCalc::resolveRecent(lastScanText.c_str(), ctx.now, lastScan) &&
      (ctx.now - lastScan) < (time_t)AttendanceRules::DUPLICATE_WINDOW_SEC) {
    LOG_I(TAG, "Duplicate scan (%ld s after the previous one), ignored", (long)(ctx.now - lastScan));
    return ScanOutcome::Duplicate;
  }

  uint32_t workedMinutes = 0;
  time_t checkInAt = 0;
  if (AttendanceCalc::resolveRecent(record.checkIn.c_str(), ctx.now, checkInAt)) {
    workedMinutes = AttendanceCalc::wholeMinutes((long)(ctx.now - checkInAt));
  }
  const uint32_t earlyMinutes = AttendanceCalc::wholeMinutes((long)(ctx.window.end - ctx.now));
  const uint32_t overtimeMinutes = AttendanceCalc::wholeMinutes((long)(ctx.now - ctx.window.end));
  const double overtimeHours = AttendanceCalc::toHours(overtimeMinutes);
  const double workingHours = AttendanceCalc::toHours(workedMinutes);

  LOG_I(TAG, "CHECK-OUT %s (%s) early=%lu min overtime=%.2f h worked=%.2f h",
        ctx.employee.name.c_str(), ctx.employee.id.c_str(), (unsigned long)earlyMinutes,
        overtimeHours, workingHours);

  if (!_hr.saveCheckOut(ctx.date, ctx.employee.id, NtpClock::formatTime(ctx.now), earlyMinutes,
                        overtimeHours, workingHours)) {
    return ScanOutcome::NetworkError;
  }
  return ScanOutcome::CheckedOut;
}
