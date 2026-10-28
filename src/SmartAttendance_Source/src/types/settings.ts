/**
 * SETTINGS TYPE MODEL
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 9
 */

export interface WorkDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface SystemSettings {
  lateThreshold: number;
  workDays: WorkDays;
  workStartTime: string;
  workEndTime: string;
}

