/**
 * ATTENDANCE SERVICE
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 5 & Master Prompt Mục 12
 * Path: /attendance/{date}/{employeeId}
 * QUY TẮC:
 * - Attendance do ESP32 ghi thực tế, app KHÔNG tự tạo dữ liệu chấm công giả.
 * - Giữ nguyên status Firebase ('on-time', 'late'), mapper chuyển đổi sang UI.
 */
import { ref, get, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';
import { FIREBASE_PATHS } from '../../constants/firebasePaths';
import { AttendanceRecord } from '../../types/attendance';

export interface DateAttendanceMap {
  [employeeId: string]: AttendanceRecord;
}

export interface AllAttendanceMap {
  [date: string]: DateAttendanceMap;
}

/**
 * Lấy danh sách chấm công theo một ngày cụ thể (YYYY-MM-DD)
 */
export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const dateRef = ref(database, `${FIREBASE_PATHS.attendance}/${date}`);
  const snapshot = await get(dateRef);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();
  return Object.keys(data).map(empId => ({
    ...data[empId],
    employeeId: empId,
  })) as AttendanceRecord[];
}

/**
 * Lắng nghe realtime dữ liệu chấm công trong ngày hôm nay hoặc ngày chỉ định
 */
export function subscribeAttendanceByDate(
  date: string,
  callback: (records: AttendanceRecord[]) => void
): () => void {
  const dateRef = ref(database, `${FIREBASE_PATHS.attendance}/${date}`);

  const unsubscribe = onValue(dateRef, snapshot => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val();
    const records = Object.keys(data).map(empId => ({
      ...data[empId],
      employeeId: empId,
    })) as AttendanceRecord[];
    callback(records);
  });

  return () => {
    off(dateRef);
  };
}

/**
 * Lấy toàn bộ dữ liệu chấm công từ trước tới nay
 */
export async function getAllAttendanceRecords(): Promise<{ date: string; record: AttendanceRecord }[]> {
  const attRef = ref(database, FIREBASE_PATHS.attendance);
  const snapshot = await get(attRef);

  if (!snapshot.exists()) {
    return [];
  }

  const allData: AllAttendanceMap = snapshot.val();
  const list: { date: string; record: AttendanceRecord }[] = [];

  for (const [date, emps] of Object.entries(allData)) {
    if (emps && typeof emps === 'object') {
      for (const [empId, rec] of Object.entries(emps)) {
        list.push({
          date,
          record: {
            ...rec,
            employeeId: empId,
          },
        });
      }
    }
  }

  // Sắp xếp ngày mới nhất lên đầu
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Lắng nghe toàn bộ thay đổi chấm công realtime
 */
export function subscribeAllAttendance(
  callback: (data: { date: string; record: AttendanceRecord }[]) => void
): () => void {
  const attRef = ref(database, FIREBASE_PATHS.attendance);

  const unsubscribe = onValue(attRef, snapshot => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const allData: AllAttendanceMap = snapshot.val();
    const list: { date: string; record: AttendanceRecord }[] = [];

    for (const [date, emps] of Object.entries(allData)) {
      if (emps && typeof emps === 'object') {
        for (const [empId, rec] of Object.entries(emps)) {
          list.push({
            date,
            record: {
              ...rec,
              employeeId: empId,
            },
          });
        }
      }
    }

    callback(list.sort((a, b) => b.date.localeCompare(a.date)));
  });

  return () => {
    off(attRef);
  };
}

