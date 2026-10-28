/**
 * SHIFT TYPE MODEL
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 15 & 23
 */

/**
 * Cấu trúc WorkShift ở tầng TypeScript/UI
 * id đại diện cho Firebase key shiftId, KHÔNG được lưu field 'id' vào RTDB.
 */
export interface WorkShift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  description: string;
  colorHex: string;
  gracePeriodMinutes?: number;
  active: boolean;
}

/**
 * Cấu trúc lưu trong Realtime Database tại /shifts/{shiftId}
 * Tuyệt đối không có field 'id'.
 */
export interface ShiftFirebaseData {
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  colorHex: string;
  gracePeriodMinutes?: number;
  active: boolean;
}

