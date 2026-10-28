/**
 * SETTINGS SERVICE
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 9
 * Path: /settings
 */
import { ref, get, update, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';
import { FIREBASE_PATHS } from '../../constants/firebasePaths';
import { SystemSettings } from '../../types/settings';
import { cleanPayload } from '../../utils/validators';

export const DEFAULT_SETTINGS: SystemSettings = {
  lateThreshold: 10,
  workDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  },
  workStartTime: '08:00',
  workEndTime: '17:00',
};

/**
 * Đọc cấu hình hệ thống từ /settings
 */
export async function getSettings(): Promise<SystemSettings> {
  const settingsRef = ref(database, FIREBASE_PATHS.settings);
  const snapshot = await get(settingsRef);

  if (!snapshot.exists()) {
    return DEFAULT_SETTINGS;
  }

  return snapshot.val() as SystemSettings;
}

/**
 * Lắng nghe thay đổi cấu hình realtime
 */
export function subscribeSettings(callback: (settings: SystemSettings) => void): () => void {
  const settingsRef = ref(database, FIREBASE_PATHS.settings);

  const unsubscribe = onValue(settingsRef, snapshot => {
    if (!snapshot.exists()) {
      callback(DEFAULT_SETTINGS);
      return;
    }
    callback(snapshot.val() as SystemSettings);
  });

  return () => {
    off(settingsRef);
  };
}

/**
 * Cập nhật cấu hình hệ thống
 */
export async function updateSettings(updates: Partial<SystemSettings>): Promise<void> {
  const settingsRef = ref(database, FIREBASE_PATHS.settings);
  await update(settingsRef, cleanPayload(updates));
}

