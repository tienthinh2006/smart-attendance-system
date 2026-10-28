/**
 * USER TYPE MODEL
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 10 & 23
 */
export type UserRole = 'admin' | 'employee';

export interface User {
  uid?: string;
  active: boolean;
  email: string;
  employeeId: string;
  name: string;
  role: UserRole;
  assignedShiftId?: string | null;
  defaultShiftId?: string | null;
}

