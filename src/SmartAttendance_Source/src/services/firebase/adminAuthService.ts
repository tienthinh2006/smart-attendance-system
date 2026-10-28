/**
 * ADMIN AUTH SERVICE
 * Tạo tài khoản nhân viên mới bằng Secondary Firebase App Client SDK
 * Bảo vệ 100% session hiện tại của Admin (không mất currentUser, không signOut)
 * Nguồn sự thật: Master Prompt Mục 8.1 & 14; Data Contract Mục 13 & 14
 */
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth as primaryAuth, database, firebaseConfig } from '../../config/firebase';
import { FIREBASE_PATHS } from '../../constants/firebasePaths';
import { DEFAULT_EMPLOYEE_PASSWORD } from '../../constants/auth';
import { Employee } from '../../types/employee';
import { User } from '../../types/user';
import { cleanPayload } from '../../utils/validators';

export interface CreateEmployeeParams {
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position?: string;
  defaultShiftId?: string | null;
}

export interface CreateEmployeeResult {
  success: boolean;
  uid: string;
  employeeId: string;
  message: string;
}

/**
 * Tạo nhân viên mới và cấp tài khoản Firebase Auth mà không làm ảnh hưởng phiên Admin
 * Mật khẩu khởi tạo: abc@123 (tuyệt đối không lưu vào RTDB)
 */
export async function createEmployeeWithAuthAccount(
  params: CreateEmployeeParams
): Promise<CreateEmployeeResult> {
  const adminUser = primaryAuth.currentUser;
  if (!adminUser) {
    throw new Error('Chỉ Admin đã đăng nhập mới có quyền tạo nhân viên.');
  }
  const adminUidBefore = adminUser.uid;

  // Khởi tạo Secondary Firebase App tạm thời để đăng ký tài khoản cho nhân viên
  const secondaryAppName = `SecondaryAuth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  let employeeUid = '';

  try {
    // 1. Tạo tài khoản Firebase Auth trên secondary instance với mật khẩu mặc định "abc@123"
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      params.email.trim(),
      DEFAULT_EMPLOYEE_PASSWORD
    );
    employeeUid = userCredential.user.uid;

    // 2. Đăng xuất ngay trên secondary instance và dọn dẹp app instance tạm
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
  } catch (authError: any) {
    // Dọn dẹp app instance nếu gặp lỗi
    try {
      await deleteApp(secondaryApp);
    } catch {
      // bỏ qua
    }
    throw new Error(`Lỗi tạo tài khoản Auth: ${authError.message}`);
  }

  // 3. Kiểm tra tính toàn vẹn của Admin session trên primary instance
  const adminUidAfter = primaryAuth.currentUser?.uid;
  if (adminUidAfter !== adminUidBefore) {
    console.error('CẢNH BÁO: Session của Admin bị thay đổi!', { adminUidBefore, adminUidAfter });
  }

  // 4. Ghi thông tin người dùng vào /users/{uid} (TUYỆT ĐỐI KHÔNG CÓ PASSWORD)
  const userProfile: User = {
    active: true,
    email: params.email.trim(),
    employeeId: params.employeeId.trim(),
    name: params.name.trim(),
    role: 'employee',
    assignedShiftId: params.defaultShiftId || null,
    defaultShiftId: params.defaultShiftId || null,
  };

  try {
    const userRef = ref(database, `${FIREBASE_PATHS.users}/${employeeUid}`);
    await set(userRef, cleanPayload(userProfile));

    // 5. Ghi thông tin chi tiết nhân viên vào /employees/{employeeId}
    const now = Date.now();
    const employeeData: Employee = {
      employeeId: params.employeeId.trim(),
      name: params.name.trim(),
      phone: params.phone.trim(),
      department: params.department.trim(),
      active: true,
      position: params.position?.trim() || '',
      email: params.email.trim(),
      fingerprintId: null, // Ban đầu là null theo Data Contract
      defaultShiftId: params.defaultShiftId || null,
      assignedShiftId: params.defaultShiftId || null,
      avatarUrl: '',
      createdAt: now,
      updatedAt: now,
    };

    const employeeRef = ref(database, `${FIREBASE_PATHS.employees}/${params.employeeId.trim()}`);
    await set(employeeRef, cleanPayload(employeeData));

    return {
      success: true,
      uid: employeeUid,
      employeeId: params.employeeId.trim(),
      message: `Tạo nhân viên thành công với mật khẩu mặc định ${DEFAULT_EMPLOYEE_PASSWORD}.`,
    };
  } catch (rtdbError: any) {
    // Lỗi ghi RTDB giữa chừng: Không báo thành công, ghi log kỹ thuật rõ ràng
    console.error('Lỗi ghi RTDB sau khi đã tạo Auth account:', {
      employeeUid,
      employeeId: params.employeeId,
      error: rtdbError,
    });
    throw new Error(
      `Đã tạo tài khoản Auth (UID: ${employeeUid}) nhưng ghi dữ liệu RTDB thất bại: ${rtdbError.message}. Vui lòng thử lại.`
    );
  }
}

