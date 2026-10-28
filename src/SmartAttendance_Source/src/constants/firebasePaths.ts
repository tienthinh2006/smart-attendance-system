/**
 * FIREBASE PATHS CONSTANTS
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 19
 */
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

export type FirebasePathKey = keyof typeof FIREBASE_PATHS;

