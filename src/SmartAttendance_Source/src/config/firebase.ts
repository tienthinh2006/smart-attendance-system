/**
 * FIREBASE CLIENT SDK CENTRAL INITIALIZATION
 * Nguồn sự thật: Master Prompt Mục 4 & Cấu hình chuẩn project hihihaha-6f707
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyBkVXkKudIR_pQ1j_khULbsOeTnaIEG2PQ",
  authDomain: "hihihaha-6f707.firebaseapp.com",
  databaseURL: "https://hihihaha-6f707-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hihihaha-6f707",
  storageBucket: "hihihaha-6f707.firebasestorage.app",
  messagingSenderId: "195122339571",
  appId: "1:195122339571:web:a96bc32d537b50aefea186",
  measurementId: "G-LRVK0LQ293"
};

export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const database: Database = getDatabase(app);

export default app;

