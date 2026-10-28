/**
 * AUTHENTICATION SERVICE
 * Nguồn sự thật: Master Prompt Mục 7 & Data Contract Mục 10, 11, 12
 */
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../../config/firebase';
import { FIREBASE_PATHS } from '../../constants/firebasePaths';
import { User } from '../../types/user';

export interface AuthStateResult {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  error?: string;
}

/**
 * Đọc thông tin người dùng từ /users/{uid}
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  const userRef = ref(database, `${FIREBASE_PATHS.users}/${uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as User;
}

/**
 * Đăng nhập bằng Email và Password
 * Cho phép cả admin và employee:
 * - Kiểm tra hồ sơ /users/{uid}
 * - Kiểm tra active
 * - Kiểm tra role hợp lệ ('admin' | 'employee')
 */
export async function loginUser(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const uid = userCredential.user.uid;

  const profile = await getUserProfile(uid);

  if (!profile) {
    await signOut(auth);
    throw new Error('Hồ sơ tài khoản (/users/' + uid + ') chưa được cấu hình trên hệ thống.');
  }

  if (!profile.active) {
    await signOut(auth);
    throw new Error('Tài khoản đã bị vô hiệu hóa.');
  }

  if (profile.role !== 'admin' && profile.role !== 'employee') {
    await signOut(auth);
    throw new Error('Vai trò tài khoản không hợp lệ: ' + (profile.role || 'Không xác định'));
  }

  return { ...profile, uid };
}

/**
 * Giữ bí danh loginAdmin để tương thích ngược
 */
export const loginAdmin = loginUser;

/**
 * Đăng xuất khỏi hệ thống
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Lắng nghe trạng thái đăng nhập realtime & phục hồi session
 */
export function subscribeToAuthState(
  onStateChange: (state: AuthStateResult) => void
): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      onStateChange({
        isAuthenticated: false,
        user: null,
        firebaseUser: null,
      });
      return;
    }

    try {
      const profile = await getUserProfile(fbUser.uid);
      if (!profile) {
        await signOut(auth);
        onStateChange({
          isAuthenticated: false,
          user: null,
          firebaseUser: null,
          error: 'Không tìm thấy hồ sơ người dùng (/users/' + fbUser.uid + ').',
        });
        return;
      }

      if (!profile.active) {
        await signOut(auth);
        onStateChange({
          isAuthenticated: false,
          user: null,
          firebaseUser: null,
          error: 'Tài khoản đã bị vô hiệu hóa.',
        });
        return;
      }

      if (profile.role !== 'admin' && profile.role !== 'employee') {
        await signOut(auth);
        onStateChange({
          isAuthenticated: false,
          user: null,
          firebaseUser: null,
          error: 'Vai trò tài khoản không hợp lệ: ' + profile.role,
        });
        return;
      }

      onStateChange({
        isAuthenticated: true,
        user: { ...profile, uid: fbUser.uid },
        firebaseUser: fbUser,
      });
    } catch (err: any) {
      onStateChange({
        isAuthenticated: false,
        user: null,
        firebaseUser: null,
        error: err.message,
      });
    }
  });

  return unsubscribe;
}


