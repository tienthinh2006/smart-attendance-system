/**
 * EMPLOYEE TYPE MODEL
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 8 & 23
 */
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
  assignedShiftId?: string | null;
  avatarUrl?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

