import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {
  subscribeEmployeeInfo,
  subscribeEmployeeAvatar,
  subscribeEmployeeAttendance,
  EmployeeAttendanceRecord,
} from '../../services/firebase/employeeAppService';

interface EmployeeDashboardScreenProps {
  employeeId: string;
  onLogout: () => void;
  onNavigate: (view: 'PROFILE' | 'HISTORY' | 'SHIFTS') => void;
}

const getStatus = (latest: EmployeeAttendanceRecord | null) => {
  if (!latest) return { text: 'Chưa có dữ liệu', color: '#999' };
  if (latest.checkIn && !latest.checkOut) {
    return { text: 'Đang làm việc', color: '#28a745' };
  }
  if (latest.checkOut) {
    return { text: 'Đã ra về', color: '#6c757d' };
  }
  return { text: 'Chưa rõ', color: '#999' };
};

export const EmployeeDashboardScreen: React.FC<EmployeeDashboardScreenProps> = ({
  employeeId,
  onLogout,
  onNavigate,
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>(employeeId);
  const [latestRecord, setLatestRecord] =
    useState<EmployeeAttendanceRecord | null>(null);
  const latestIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Tên nhân viên
    const unsubEmp = subscribeEmployeeInfo(employeeId, data => {
      if (data && data.name) {
        setEmployeeName(data.name);
      }
    });

    // 2. Avatar
    const unsubAvatar = subscribeEmployeeAvatar(employeeId, url => {
      setAvatarUrl(url);
    });

    return () => {
      unsubEmp();
      unsubAvatar();
    };
  }, [employeeId]);

  useEffect(() => {
    // 3. Theo dõi chấm công realtime và cảnh báo khi có check-in / check-out
    const unsubAtt = subscribeEmployeeAttendance(employeeId, records => {
      if (records.length === 0) {
        setLatestRecord(null);
        return;
      }

      const record = records[0];
      const currentStateHash = `${record.id}_${record.checkIn}_${record.checkOut}`;
      const isNewAction =
        latestIdRef.current !== null &&
        latestIdRef.current !== currentStateHash;

      if (isNewAction) {
        const isCheckOut =
          record.checkOut !== null &&
          latestIdRef.current?.endsWith('_null');
        const actionText = isCheckOut ? 'Giờ ra' : 'Giờ vào';
        const timeStr = isCheckOut ? record.checkOut : record.checkIn;
        Alert.alert('Chấm công thành công ✅', `${actionText} lúc ${timeStr}`);
      }

      latestIdRef.current = currentStateHash;
      setLatestRecord(record);
    });

    return unsubAtt;
  }, [employeeId]);

  const status = getStatus(latestRecord);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutTopBtn} onPress={onLogout}>
        <Text style={styles.logoutTopBtnText}>Đăng xuất</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>Xin chào, {employeeName}</Text>

          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => onNavigate('PROFILE')}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarEmoji}>👤</Text>
            )}
          </TouchableOpacity>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: status.color + '22',
                borderColor: status.color,
              },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: status.color }]}
            />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>

          <Text style={styles.subGreeting}>
            Chúc bạn một ngày làm việc vui vẻ! ✨
          </Text>
        </View>

        <View style={styles.buttonsWrapper}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.menuBtnSquare}
              onPress={() => onNavigate('PROFILE')}
            >
              <Text style={styles.menuBtnSquareIcon}>🙍</Text>
              <Text style={styles.menuBtnSquareText}>Thông tin cá nhân</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuBtnSquare}
              onPress={() => onNavigate('HISTORY')}
            >
              <Text style={styles.menuBtnSquareIcon}>📋</Text>
              <Text style={styles.menuBtnSquareText}>Xem lịch sử cá nhân</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRowCenter}>
            <TouchableOpacity
              style={styles.menuBtnSquare}
              onPress={() => onNavigate('SHIFTS')}
            >
              <Text style={styles.menuBtnSquareIcon}>🗓️</Text>
              <Text style={styles.menuBtnSquareText}>Ca làm việc</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoutTopBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutTopBtnText: {
    color: '#dc3545',
    fontWeight: '700',
    fontSize: 13,
  },
  greetingBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#e7f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 2,
    borderColor: '#cfe0ff',
    elevation: 3,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 50,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subGreeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007BFF',
    marginTop: 16,
    textAlign: 'center',
  },
  buttonsWrapper: {
    width: '100%',
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  buttonRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  menuBtnSquare: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  menuBtnSquareIcon: {
    fontSize: 34,
    marginBottom: 8,
  },
  menuBtnSquareText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

