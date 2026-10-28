/**
 * SHIFT SERVICE
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 15 & Master Prompt Mục 10
 * Path: /shifts/{shiftId}
 * QUY TẮC: Object RTDB tuyệt đối KHÔNG có field 'id'.
 */
import { ref, get, set, update, remove, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';
import { FIREBASE_PATHS } from '../../constants/firebasePaths';
import { WorkShift, ShiftFirebaseData } from '../../types/shift';
import { isValidTime, cleanPayload } from '../../utils/validators';

/**
 * Danh sách ca mẫu chuẩn theo Data Contract mục 15
 */
export const SHIFT_PRESETS: WorkShift[] = [
  {
    id: 'shift_hanh_chinh',
    name: 'Hành Chính',
    startTime: '08:00',
    endTime: '17:00',
    description: 'Ca hành chính tiêu chuẩn',
    colorHex: '#4F46E5',
    gracePeriodMinutes: 10,
    active: true,
  },
  {
    id: 'shift_sang',
    name: 'Ca Sáng',
    startTime: '06:00',
    endTime: '14:00',
    description: 'Ca làm việc buổi sáng',
    colorHex: '#16A34A',
    gracePeriodMinutes: 10,
    active: true,
  },
  {
    id: 'shift_chieu',
    name: 'Ca Chiều',
    startTime: '14:00',
    endTime: '22:00',
    description: 'Ca làm việc buổi chiều',
    colorHex: '#F59E0B',
    gracePeriodMinutes: 10,
    active: true,
  },
  {
    id: 'shift_dem',
    name: 'Ca Đêm',
    startTime: '22:00',
    endTime: '06:00',
    description: 'Ca làm việc ban đêm qua ngày hôm sau',
    colorHex: '#7C3AED',
    gracePeriodMinutes: 10,
    active: true,
  },
  {
    id: 'shift_part_time',
    name: 'Part-time',
    startTime: '08:00',
    endTime: '12:00',
    description: 'Ca bán thời gian buổi sáng',
    colorHex: '#DC2626',
    gracePeriodMinutes: 10,
    active: true,
  },
];

/**
 * Lấy danh sách toàn bộ các ca làm việc
 */
export async function getAllShifts(): Promise<WorkShift[]> {
  const shiftsRef = ref(database, FIREBASE_PATHS.shifts);
  const snapshot = await get(shiftsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();
  return Object.keys(data).map(shiftId => ({
    id: shiftId,
    name: data[shiftId].name || shiftId,
    startTime: data[shiftId].startTime || '08:00',
    endTime: data[shiftId].endTime || '17:00',
    description: data[shiftId].description || '',
    colorHex: data[shiftId].colorHex || '#4F46E5',
    gracePeriodMinutes: data[shiftId].gracePeriodMinutes ?? 10,
    active: data[shiftId].active ?? true,
  }));
}

/**
 * Lắng nghe thay đổi danh sách ca realtime
 */
export function subscribeShifts(callback: (shifts: WorkShift[]) => void): () => void {
  const shiftsRef = ref(database, FIREBASE_PATHS.shifts);

  const unsubscribe = onValue(shiftsRef, snapshot => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const list = Object.keys(data).map(shiftId => ({
      id: shiftId,
      name: data[shiftId].name || shiftId,
      startTime: data[shiftId].startTime || '08:00',
      endTime: data[shiftId].endTime || '17:00',
      description: data[shiftId].description || '',
      colorHex: data[shiftId].colorHex || '#4F46E5',
      gracePeriodMinutes: data[shiftId].gracePeriodMinutes ?? 10,
      active: data[shiftId].active ?? true,
    }));
    callback(list);
  });

  return () => {
    off(shiftsRef);
  };
}

/**
 * Thêm hoặc cập nhật một ca làm việc
 * QUY TẮC BẮT BUỘC: Không lưu field 'id' vào RTDB.
 */
export async function saveShift(shift: WorkShift): Promise<void> {
  if (!isValidTime(shift.startTime)) {
    throw new Error('Giờ bắt đầu phải theo định dạng HH:mm (ví dụ 08:00).');
  }
  if (!isValidTime(shift.endTime)) {
    throw new Error('Giờ kết thúc phải theo định dạng HH:mm (ví dụ 17:00).');
  }
  if (!shift.id || shift.id.trim() === '') {
    throw new Error('Mã ca (shiftId) không được để trống.');
  }

  const shiftFirebaseData: ShiftFirebaseData = {
    name: shift.name.trim(),
    startTime: shift.startTime.trim(),
    endTime: shift.endTime.trim(),
    description: shift.description.trim(),
    colorHex: shift.colorHex.trim() || '#4F46E5',
    gracePeriodMinutes: Number(shift.gracePeriodMinutes) || 0,
    active: Boolean(shift.active),
  };

  const shiftRef = ref(database, `${FIREBASE_PATHS.shifts}/${shift.id.trim()}`);
  await set(shiftRef, cleanPayload(shiftFirebaseData));
}

/**
 * Xóa một ca làm việc khỏi RTDB
 */
export async function deleteShift(shiftId: string): Promise<void> {
  const shiftRef = ref(database, `${FIREBASE_PATHS.shifts}/${shiftId}`);
  await remove(shiftRef);
}

