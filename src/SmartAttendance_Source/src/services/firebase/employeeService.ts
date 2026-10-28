/**
 * EMPLOYEE SERVICE
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 8 & Master Prompt Mục 9
 * Path: /employees/{employeeId}
 */
import { ref, get, set, update, remove, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';
import { FIREBASE_PATHS } from '../../constants/firebasePaths';
import { Employee } from '../../types/employee';
import { cleanPayload } from '../../utils/validators';

/**
 * Lấy danh sách toàn bộ nhân viên từ /employees
 */
export async function getAllEmployees(): Promise<Employee[]> {
  const employeesRef = ref(database, FIREBASE_PATHS.employees);
  const snapshot = await get(employeesRef);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();
  return Object.keys(data).map(key => ({
    ...data[key],
    employeeId: key,
  })) as Employee[];
}

/**
 * Lấy chi tiết một nhân viên
 */
export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const empRef = ref(database, `${FIREBASE_PATHS.employees}/${employeeId}`);
  const snapshot = await get(empRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { ...snapshot.val(), employeeId } as Employee;
}

/**
 * Lắng nghe thay đổi danh sách nhân viên realtime
 */
export function subscribeEmployees(callback: (employees: Employee[]) => void): () => void {
  const employeesRef = ref(database, FIREBASE_PATHS.employees);

  const unsubscribe = onValue(employeesRef, snapshot => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const list = Object.keys(data).map(key => ({
      ...data[key],
      employeeId: key,
    })) as Employee[];
    callback(list);
  });

  return () => {
    off(employeesRef);
  };
}

/**
 * Cập nhật thông tin nhân viên
 */
export async function updateEmployee(
  employeeId: string,
  updates: Partial<Omit<Employee, 'employeeId'>>
): Promise<void> {
  const empRef = ref(database, `${FIREBASE_PATHS.employees}/${employeeId}`);
  const payload = cleanPayload({
    ...updates,
    ...(updates.defaultShiftId !== undefined ? { assignedShiftId: updates.defaultShiftId || null } : {}),
    updatedAt: Date.now(),
  });
  await update(empRef, payload);

  // Đồng bộ trường assignedShiftId sang /users/{uid} nếu có thay đổi ca làm việc
  if (updates.defaultShiftId !== undefined || (updates as any).assignedShiftId !== undefined) {
    const shiftVal = updates.defaultShiftId !== undefined ? updates.defaultShiftId : (updates as any).assignedShiftId;
    try {
      const usersRef = ref(database, FIREBASE_PATHS.users);
      const usersSnap = await get(usersRef);
      if (usersSnap.exists()) {
        const usersData = usersSnap.val();
        for (const uid of Object.keys(usersData)) {
          if (usersData[uid]?.employeeId === employeeId) {
            const uRef = ref(database, `${FIREBASE_PATHS.users}/${uid}`);
            await update(uRef, {
              assignedShiftId: shiftVal || null,
              defaultShiftId: shiftVal || null,
            });
          }
        }
      }
    } catch (syncErr) {
      console.warn('Lưu ý: Không thể đồng bộ assignedShiftId sang /users:', syncErr);
    }
  }
}

/**
 * Cập nhật trạng thái kích hoạt (active) của nhân viên
 */
export async function toggleEmployeeActive(
  employeeId: string,
  currentActive: boolean
): Promise<void> {
  await updateEmployee(employeeId, { active: !currentActive });
}

/**
 * Cập nhật fingerprintId thật từ ESP32 vào nhân viên
 * Quy tắc: number hoặc null (không dùng string)
 */
export async function updateEmployeeFingerprint(
  employeeId: string,
  fingerprintId: number | null
): Promise<void> {
  const empRef = ref(database, `${FIREBASE_PATHS.employees}/${employeeId}`);
  await update(empRef, cleanPayload({
    fingerprintId,
    updatedAt: Date.now(),
  }));
}

/**
 * Xóa nhân viên khỏi RTDB
 */
export async function deleteEmployee(employeeId: string): Promise<void> {
  const empRef = ref(database, `${FIREBASE_PATHS.employees}/${employeeId}`);
  await remove(empRef);
}

