/**
 * DEVICE SERVICE
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 7 & Master Prompt Mục 17
 * Path: /devices
 */
import { ref, get, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';
import { FIREBASE_PATHS } from '../../constants/firebasePaths';
import { Device } from '../../types/device';

export interface DeviceWithId extends Device {
  deviceId: string;
}

/**
 * Lấy danh sách thiết bị điểm danh ESP32
 */
export async function getAllDevices(): Promise<DeviceWithId[]> {
  const devicesRef = ref(database, FIREBASE_PATHS.devices);
  const snapshot = await get(devicesRef);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();
  return Object.keys(data).map(deviceId => ({
    ...data[deviceId],
    deviceId,
  }));
}

/**
 * Lắng nghe trạng thái thiết bị realtime
 */
export function subscribeDevices(callback: (devices: DeviceWithId[]) => void): () => void {
  const devicesRef = ref(database, FIREBASE_PATHS.devices);

  const unsubscribe = onValue(devicesRef, snapshot => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val();
    const list = Object.keys(data).map(deviceId => ({
      ...data[deviceId],
      deviceId,
    }));
    callback(list);
  });

  return () => {
    off(devicesRef);
  };
}

