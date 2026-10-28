/**
 * ENROLLMENT TYPE MODEL
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 16 & 23
 */

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

