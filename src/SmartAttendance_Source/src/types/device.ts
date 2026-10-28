/**
 * DEVICE TYPE MODEL
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 7 & 23
 */

export interface Device {
  active: boolean;
  name: string;
  location?: string;
  lastSeen?: number;
  firmwareVersion?: string;
}

