/**
 * DATE & TIME UTILITY FUNCTIONS
 * Tính toán ca, đi muộn, giờ làm và format ngày giờ
 */

/**
 * Lấy ngày hiện tại định dạng YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format hiển thị giờ: nếu rỗng trả về '—' theo yêu cầu Data Contract
 */
export function formatDisplayTime(time?: string | null): string {
  if (!time || time.trim() === '') return '—';
  return time.trim();
}

/**
 * Parse chuỗi "HH:mm" hoặc "HH:mm:ss" thành số phút từ đầu ngày
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Tính số phút đi muộn dựa trên checkIn thực tế và startTime của ca (+ gracePeriodMinutes)
 */
export function calculateLateMinutes(
  checkIn: string,
  shiftStartTime: string,
  gracePeriodMinutes = 0
): number {
  if (!checkIn || !shiftStartTime) return 0;
  const checkInMin = parseTimeToMinutes(checkIn);
  const shiftStartMin = parseTimeToMinutes(shiftStartTime);
  const diff = checkInMin - (shiftStartMin + gracePeriodMinutes);
  return diff > 0 ? diff : 0;
}

/**
 * Tính số giờ làm việc giữa checkIn và checkOut (làm tròn 2 chữ số thập phân)
 */
export function calculateWorkingHours(checkIn?: string | null, checkOut?: string | null): number {
  if (!checkIn || !checkOut) return 0;
  const inMin = parseTimeToMinutes(checkIn);
  const outMin = parseTimeToMinutes(checkOut);
  const diff = outMin >= inMin ? outMin - inMin : (24 * 60 - inMin) + outMin;
  const hours = diff / 60;
  return Math.round(hours * 100) / 100;
}

/**
 * Tính số phút về sớm dựa trên checkOut thực tế và endTime của ca
 */
export function calculateEarlyMinutes(checkOut: string, shiftEndTime: string): number {
  if (!checkOut || !shiftEndTime) return 0;
  const checkOutMin = parseTimeToMinutes(checkOut);
  const shiftEndMin = parseTimeToMinutes(shiftEndTime);
  const diff = shiftEndMin - checkOutMin;
  return diff > 0 ? diff : 0;
}

/**
 * Tính giờ làm tăng ca ngoài chuẩn (mặc định 8h)
 */
export function calculateOvertimeHours(workingHours: number, standardHours = 8): number {
  if (workingHours <= standardHours) return 0;
  const ot = workingHours - standardHours;
  return Math.round(ot * 100) / 100;
}

/**
 * Kiểm tra một chuỗi ngày 'YYYY-MM-DD' có nằm trong khoảng start..end không
 */
export function isDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
  if (!dateStr) return false;
  if (startDate && dateStr < startDate) return false;
  if (endDate && dateStr > endDate) return false;
  return true;
}

