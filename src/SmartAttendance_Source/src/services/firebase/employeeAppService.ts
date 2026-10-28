/**
 * EMPLOYEE APP SERVICE
 * Cung cấp toàn bộ tương tác Firebase Realtime Database & Auth cho phân hệ Nhân viên.
 * Nguồn dữ liệu & logic: App_NV.tsx + src/config/firebase.ts
 */
import {
  ref,
  onValue,
  get,
  update,
  query,
  orderByChild,
  equalTo,
} from 'firebase/database';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { database, auth } from '../../config/firebase';

export interface EmployeeAttendanceRecord {
  id: string;
  dateKey: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  timestamp: number;
}

export interface EmployeeShiftRecord {
  id: string;
  employeeId: string;
  date: number;
  startTime: string;
  endTime: string;
  note?: string;
}

export type AttendanceFilterMode = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

export function getAttendanceRangeStart(mode: AttendanceFilterMode): number | null {
  const now = new Date();
  if (mode === 'ALL') return null;
  if (mode === 'TODAY') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (mode === 'WEEK') {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diffToMonday
    ).getTime();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

/**
 * Lắng nghe thông tin chi tiết nhân viên từ /employees/{employeeId}
 */
export function subscribeEmployeeInfo(
  employeeId: string,
  onUpdate: (data: any) => void
): () => void {
  const empRef = ref(database, `employees/${employeeId}`);
  const unsubscribe = onValue(empRef, snapshot => {
    if (snapshot.exists()) {
      onUpdate(snapshot.val());
    } else {
      onUpdate(null);
    }
  });
  return unsubscribe;
}

/**
 * Lắng nghe ảnh đại diện nhân viên từ /employeeAvatars/{employeeId}
 */
export function subscribeEmployeeAvatar(
  employeeId: string,
  onUpdate: (avatarUrl: string | null) => void
): () => void {
  const avatarRef = ref(database, `employeeAvatars/${employeeId}`);
  const unsubscribe = onValue(avatarRef, snapshot => {
    if (snapshot.exists()) {
      onUpdate(snapshot.val());
    } else {
      onUpdate(null);
    }
  });
  return unsubscribe;
}

/**
 * Cập nhật ảnh đại diện lên /employeeAvatars/{employeeId}
 */
export async function updateEmployeeAvatar(
  employeeId: string,
  dataUri: string
): Promise<void> {
  const avatarsRef = ref(database, 'employeeAvatars');
  await update(avatarsRef, { [employeeId]: dataUri });
}

/**
 * Lắng nghe toàn bộ lịch sử chấm công của nhân viên từ /attendance
 */
export function subscribeEmployeeAttendance(
  employeeId: string,
  onUpdate: (records: EmployeeAttendanceRecord[]) => void,
  onError?: (error: any) => void
): () => void {
  const attendanceRef = ref(database, 'attendance');

  const unsubscribe = onValue(
    attendanceRef,
    snapshot => {
      const records: EmployeeAttendanceRecord[] = [];

      snapshot.forEach(daySnap => {
        const dateString = daySnap.key as string;
        if (daySnap.hasChild(employeeId)) {
          const empData = daySnap.child(employeeId).val();
          const ts = empData.timestamp
            ? new Date(empData.timestamp).getTime()
            : new Date(dateString).getTime();

          records.push({
            id: dateString,
            dateKey: dateString,
            checkIn: empData.checkIn || null,
            checkOut: empData.checkOut || null,
            status: empData.status || '',
            timestamp: ts,
          });
        }
        return undefined;
      });

      // Mặc định sắp xếp giảm dần theo thời gian
      records.sort((a, b) => b.timestamp - a.timestamp);
      onUpdate(records);
    },
    error => {
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

export interface EmployeeAssignedShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  colorHex?: string;
  gracePeriodMinutes?: number;
  active?: boolean;
}

/**
 * Lắng nghe thông tin ca làm việc của nhân viên
 * Nguồn sự thật:
 * 1. /users/{uid}/assignedShiftId hoặc defaultShiftId
 * 2. /employees/{employeeId}/defaultShiftId hoặc assignedShiftId
 * 3. /shifts/{shiftId} chi tiết tên, giờ bắt đầu, giờ kết thúc, thời gian trễ
 */
export function subscribeEmployeeShifts(
  employeeId: string,
  onUpdate: (
    shifts: EmployeeShiftRecord[],
    defaultShiftName: string,
    assignedShift: EmployeeAssignedShift | null
  ) => void,
  onError?: (error: any) => void,
  uid?: string
): () => void {
  const targetUid = uid || auth.currentUser?.uid;
  let assignedShiftIdFromUser: string | null = null;
  let defaultShiftIdFromEmp: string | null = null;
  let shiftsMap = new Map<string, EmployeeAssignedShift>();
  let shiftRecords: EmployeeShiftRecord[] = [];

  const computeAndNotify = () => {
    // Ưu tiên assignedShiftId từ /users/{uid}, nếu không có thì lấy defaultShiftId từ /employees/{employeeId}
    const effectiveShiftId =
      assignedShiftIdFromUser ||
      defaultShiftIdFromEmp ||
      null;

    let assignedShift: EmployeeAssignedShift | null = null;
    let defaultShiftName = 'Chưa phân ca';

    if (effectiveShiftId && typeof effectiveShiftId === 'string' && effectiveShiftId.trim() !== '') {
      const trimmedId = effectiveShiftId.trim();
      if (shiftsMap.has(trimmedId)) {
        assignedShift = shiftsMap.get(trimmedId)!;
        defaultShiftName = assignedShift.name || trimmedId;
      } else {
        // Tìm theo tên ca nếu id lưu dạng tên (ví dụ: "Ca Hành Chính")
        let matchedByName: EmployeeAssignedShift | undefined;
        for (const s of shiftsMap.values()) {
          if (s.name.toLowerCase() === trimmedId.toLowerCase()) {
            matchedByName = s;
            break;
          }
        }

        if (matchedByName) {
          assignedShift = matchedByName;
          defaultShiftName = matchedByName.name;
        } else {
          assignedShift = {
            id: trimmedId,
            name: trimmedId,
            startTime: '',
            endTime: '',
          };
          defaultShiftName = trimmedId;
        }
      }
    } else {
      assignedShift = null;
      defaultShiftName = 'Chưa phân ca';
    }

    onUpdate([...shiftRecords], defaultShiftName, assignedShift);
  };

  // 1. Lắng nghe toàn bộ danh mục ca từ /shifts (để lấy tên, giờ bắt đầu, kết thúc realtime)
  const shiftsRef = ref(database, 'shifts');
  const unsubShifts = onValue(
    shiftsRef,
    snapshot => {
      shiftsMap.clear();
      const records: EmployeeShiftRecord[] = [];

      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          const val = data[key];
          if (val && typeof val === 'object') {
            shiftsMap.set(key, {
              id: key,
              name: val.name || key,
              startTime: val.startTime || '',
              endTime: val.endTime || '',
              description: val.description || '',
              colorHex: val.colorHex || '#4F46E5',
              gracePeriodMinutes: val.gracePeriodMinutes ?? 10,
              active: val.active !== false,
            });

            // Nếu ca có gán cho employeeId cụ thể theo ngày
            if (val.employeeId === employeeId && val.date) {
              records.push({
                id: key,
                ...val,
              } as EmployeeShiftRecord);
            }
          }
        });
      }

      records.sort((a, b) => a.date - b.date);
      shiftRecords = records;
      computeAndNotify();
    },
    error => {
      if (onError) onError(error);
    }
  );

  // 2. Lắng nghe ca làm việc từ /employees/{employeeId}
  const empRef = ref(database, `employees/${employeeId}`);
  const unsubEmp = onValue(
    empRef,
    snapshot => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        defaultShiftIdFromEmp = val.assignedShiftId || val.defaultShiftId || val.shiftId || null;
      } else {
        defaultShiftIdFromEmp = null;
      }
      computeAndNotify();
    },
    error => {
      if (onError) onError(error);
    }
  );

  // 3. Lắng nghe ca làm việc từ /users/{uid}
  let unsubUser: (() => void) | null = null;
  if (targetUid) {
    const userRef = ref(database, `users/${targetUid}`);
    unsubUser = onValue(
      userRef,
      snapshot => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          assignedShiftIdFromUser = val.assignedShiftId || val.defaultShiftId || val.shiftId || null;
        } else {
          assignedShiftIdFromUser = null;
        }
        computeAndNotify();
      },
      () => {
        // Bỏ qua lỗi permission trên userRef nếu đã đọc được empRef
        computeAndNotify();
      }
    );
  } else {
    // Fallback: nếu chưa có targetUid, tìm UID qua /users bằng employeeId
    get(ref(database, 'users'))
      .then(snap => {
        if (snap.exists()) {
          const usersData = snap.val();
          for (const u of Object.keys(usersData)) {
            if (usersData[u]?.employeeId === employeeId) {
              const uShift = usersData[u].assignedShiftId || usersData[u].defaultShiftId || null;
              if (uShift && !assignedShiftIdFromUser) {
                assignedShiftIdFromUser = uShift;
                computeAndNotify();
              }
              break;
            }
          }
        }
      })
      .catch(() => {});
  }

  return () => {
    unsubShifts();
    unsubEmp();
    if (unsubUser) unsubUser();
  };
}

/**
 * Đổi mật khẩu tài khoản nhân viên (reauthenticate + updatePassword)
 */
export async function changeEmployeePassword(
  currentPw: string,
  newPw: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) {
    throw new Error('Không tìm thấy phiên đăng nhập hiện tại.');
  }

  const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPw);
}

