/**
 * ENROLLMENT SERVICE
 * Nguồn sự thật: FIREBASE_DATA_CONTRACT_SMART_ATTENDANCE_V2_1.md - Mục 16, 17 & Master Prompt Mục 11
 * Path: /enrollment_requests/{requestId}
 * QUY TẮC:
 * - App chỉ tạo request và theo dõi realtime.
 * - Không tự tạo fingerprintId giả lập.
 * - Khi ESP32 cập nhật SUCCESS + fingerprintId thật -> cập nhật vào /employees/{employeeId}/fingerprintId.
 */
import { ref, push, set, update, get, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';
import { FIREBASE_PATHS } from '../../constants/firebasePaths';
import { EnrollmentRequest, EnrollmentStatus } from '../../types/enrollment';
import { updateEmployeeFingerprint } from './employeeService';
import { cleanPayload } from '../../utils/validators';

/**
 * Tạo một yêu cầu đăng ký vân tay mới với status = PENDING
 */
export async function createEnrollmentRequest(
  employeeId: string,
  deviceId = 'esp32_001'
): Promise<string> {
  const requestsRef = ref(database, FIREBASE_PATHS.enrollmentRequests);
  const newRef = push(requestsRef);
  const requestId = newRef.key;

  if (!requestId) {
    throw new Error('Không thể sinh requestId từ Firebase push.');
  }

  const now = Date.now();
  const requestData: EnrollmentRequest = {
    requestId,
    employeeId: employeeId.trim(),
    deviceId: deviceId.trim(),
    status: 'PENDING',
    fingerprintId: null,
    createdAt: now,
    updatedAt: now,
  };

  await set(newRef, cleanPayload(requestData));
  return requestId;
}

/**
 * Lắng nghe realtime trạng thái đăng ký của một request
 * Tự động cập nhật fingerprintId vào nhân viên khi ESP32 trả về SUCCESS
 */
export function subscribeEnrollmentRequest(
  requestId: string,
  onUpdate: (request: EnrollmentRequest | null) => void
): () => void {
  const reqRef = ref(database, `${FIREBASE_PATHS.enrollmentRequests}/${requestId}`);

  const unsubscribe = onValue(reqRef, async snapshot => {
    if (!snapshot.exists()) {
      onUpdate(null);
      return;
    }

    const data = snapshot.val() as EnrollmentRequest;
    onUpdate(data);

    // Nếu ESP32 xử lý thành công và trả về fingerprintId thực tế (kiểu number)
    if (data.status === 'SUCCESS' && typeof data.fingerprintId === 'number') {
      try {
        await updateEmployeeFingerprint(data.employeeId, data.fingerprintId);
      } catch (err) {
        console.error('Lỗi tự động cập nhật fingerprintId vào employee:', err);
      }
    }
  });

  return () => {
    off(reqRef);
  };
}

/**
 * Hủy một yêu cầu đăng ký đang chờ
 */
export async function cancelEnrollmentRequest(requestId: string): Promise<void> {
  const reqRef = ref(database, `${FIREBASE_PATHS.enrollmentRequests}/${requestId}`);
  await update(reqRef, cleanPayload({
    status: 'CANCELLED' as EnrollmentStatus,
    updatedAt: Date.now(),
  }));
}

/**
 * Lấy lịch sử các yêu cầu đăng ký
 */
export async function getAllEnrollmentRequests(): Promise<EnrollmentRequest[]> {
  const requestsRef = ref(database, FIREBASE_PATHS.enrollmentRequests);
  const snapshot = await get(requestsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val();
  return Object.keys(data).map(k => ({
    ...data[k],
    requestId: data[k].requestId || k,
  })) as EnrollmentRequest[];
}

