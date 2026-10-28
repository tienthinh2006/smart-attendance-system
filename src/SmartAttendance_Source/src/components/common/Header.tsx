import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../../constants/colors';
import { logout } from '../../services/firebase/authService';
import { User } from '../../types/user';

interface HeaderProps {
  title: string;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ title, user }) => {
  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản Admin?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (err: any) {
            Alert.alert('Lỗi đăng xuất', err.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.appName}>SMART ATTENDANCE</Text>
        <Text style={styles.screenTitle}>{title}</Text>
      </View>

      <View style={styles.userContainer}>
        {user ? (
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.userRole}>ADMIN</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.slate900,
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  userDetails: {
    display: 'none', // Ẩn trên mobile để tiết kiệm không gian
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  userRole: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.successLight,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate300,
  },
});
