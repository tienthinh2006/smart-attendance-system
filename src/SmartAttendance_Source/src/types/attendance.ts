/**
 * ATTENDANCE TYPE MODEL
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 5 & 23
 */

export type FirebaseAttendanceStatus = 'on-time' | 'late';

export type UIAttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT' | 'EARLY_LEAVE';

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

