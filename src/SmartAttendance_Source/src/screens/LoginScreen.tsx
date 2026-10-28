import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { loginUser } from '../services/firebase/authService';
import { COLORS } from '../constants/colors';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await loginUser(email, password);
      // onAuthStateChanged trong App.tsx sẽ tự động nhận diện role và chuyển màn hình
    } catch (error: any) {
      console.error('Lỗi đăng nhập:', error);
      let msg = error.message;
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password'
      ) {
        msg = 'Email hoặc mật khẩu không chính xác.';
      } else if (error.code === 'auth/user-not-found') {
        msg = 'Tài khoản không tồn tại trên hệ thống.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Định dạng email không hợp lệ.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🏢</Text>
            </View>
            <Text style={styles.title}>SMART ATTENDANCE</Text>
            <Text style={styles.subtitle}>
              Hệ thống Điểm danh & Quản trị Nhân sự
            </Text>
            <View style={styles.badgeAdmin}>
              <Text style={styles.badgeAdminText}>CỔNG XÁC THỰC HỆ THỐNG</Text>
            </View>
          </View>

          {/* Form Box */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Đăng nhập hệ thống</Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Email đăng nhập"
              value={email}
              onChangeText={setEmail}
              placeholder="Nhập email của bạn..."
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Input
              label="Mật khẩu"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <Button
              title="Đăng nhập"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.loginBtn}
            />
          </View>

          {/* Footer Note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Kết nối trực tiếp Firebase Realtime Database & ESP32 Fingerprint Sensor
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.slate900,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.slate400,
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeAdmin: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(79, 70, 229, 0.25)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  badgeAdminText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryLight,
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
    fontWeight: '500',
  },
  loginBtn: {
    marginTop: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.slate500,
    textAlign: 'center',
  },
});

