import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  subscribeEmployeeInfo,
  subscribeEmployeeAvatar,
  updateEmployeeAvatar,
  subscribeEmployeeAttendance,
  getAttendanceRangeStart,
  changeEmployeePassword,
  EmployeeAttendanceRecord,
} from '../../services/firebase/employeeAppService';

interface EmployeeProfileScreenProps {
  employeeId: string;
  onBack: () => void;
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

export const EmployeeProfileScreen: React.FC<EmployeeProfileScreenProps> = ({
  employeeId,
  onBack,
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>(employeeId);
  const [department, setDepartment] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [monthCount, setMonthCount] = useState<number>(0);
  const [latestRecord, setLatestRecord] =
    useState<EmployeeAttendanceRecord | null>(null);

  // Form đổi mật khẩu
  const [changingPw, setChangingPw] = useState<boolean>(false);
  const [currentPw, setCurrentPw] = useState<string>('');
  const [newPw, setNewPw] = useState<string>('');
  const [confirmPw, setConfirmPw] = useState<string>('');
  const [pwSaving, setPwSaving] = useState<boolean>(false);
  const [showCurrentPw, setShowCurrentPw] = useState<boolean>(false);
  const [showNewPw, setShowNewPw] = useState<boolean>(false);
  const [showConfirmPw, setShowConfirmPw] = useState<boolean>(false);

  useEffect(() => {
    // 1. Thông tin nhân viên
    const unsubEmp = subscribeEmployeeInfo(employeeId, data => {
      if (data) {
        if (data.name) setEmployeeName(data.name);
        setDepartment(data.department || '');
        setPosition(data.position || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
      }
    });

    // 2. Avatar
    const unsubAvatar = subscribeEmployeeAvatar(employeeId, url => {
      setAvatarUrl(url);
    });

    // 3. Chấm công
    const unsubAtt = subscribeEmployeeAttendance(employeeId, records => {
      setLatestRecord(records.length > 0 ? records[0] : null);

      const startOfMonth = getAttendanceRangeStart('MONTH');
      if (startOfMonth !== null) {
        setMonthCount(records.filter(r => r.timestamp >= startOfMonth).length);
      } else {
        setMonthCount(records.length);
      }
    });

    return () => {
      unsubEmp();
      unsubAvatar();
      unsubAtt();
    };
  }, [employeeId]);

  const handlePickAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.5,
        maxWidth: 500,
        maxHeight: 500,
        includeBase64: true,
      });

      if (result.didCancel || result.errorCode) return;

      const base64Data = result.assets?.[0]?.base64;
      const mimeType = result.assets?.[0]?.type || 'image/jpeg';
      if (!base64Data) {
        Alert.alert('Lỗi', 'Không lấy được dữ liệu ảnh.');
        return;
      }

      const dataUri = `data:${mimeType};base64,${base64Data}`;
      setUploading(true);
      await updateEmployeeAvatar(employeeId, dataUri);
      setAvatarUrl(dataUri);
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh đại diện', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường.');
    }
    if (newPw !== confirmPw) {
      return Alert.alert('Lỗi', 'Mật khẩu mới không khớp.');
    }
    if (newPw.length < 6) {
      return Alert.alert('Lỗi', 'Mật khẩu yêu cầu tối thiểu 6 ký tự.');
    }

    setPwSaving(true);
    try {
      await changeEmployeePassword(currentPw, newPw);
      Alert.alert('Thành công', 'Đổi mật khẩu bảo mật thành công.');
      setChangingPw(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        Alert.alert('Lỗi', 'Mật khẩu hiện tại không chính xác.');
      } else {
        Alert.alert('Lỗi đổi mật khẩu', err.message);
      }
    } finally {
      setPwSaving(false);
    }
  };

  const status = getStatus(latestRecord);

  const infoRows = [
    ...(department ? [{ icon: '🏢', label: 'Phòng ban', value: department }] : []),
    ...(position ? [{ icon: '💼', label: 'Chức vụ', value: position }] : []),
    ...(phone ? [{ icon: '📱', label: 'Số điện thoại', value: phone }] : []),
    ...(email ? [{ icon: '📧', label: 'Email', value: email }] : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Thông tin cá nhân</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileBox}>
          <TouchableOpacity
            style={styles.avatarCircleLarge}
            onPress={handlePickAvatar}
            disabled={uploading}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImageLarge} />
            ) : (
              <Text style={styles.avatarEmojiLarge}>👤</Text>
            )}
            {uploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Chạm để đổi ảnh đại diện</Text>

          <Text style={styles.profileName}>{employeeName}</Text>
          <Text style={styles.profileIdSub}>Mã nhân viên: {employeeId}</Text>

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

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{monthCount}</Text>
            <Text style={styles.statLabel}>lượt chấm công tháng này</Text>
          </View>

          {infoRows.length > 0 && (
            <View style={styles.infoCard}>
              {infoRows.map((row, idx) => (
                <View
                  key={row.label}
                  style={[
                    styles.infoRow,
                    idx === infoRows.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.infoIcon}>{row.icon}</Text>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!changingPw ? (
            <TouchableOpacity
              style={styles.changePwBtn}
              onPress={() => setChangingPw(true)}
            >
              <Text style={styles.changePwBtnText}>
                🔒  Đổi mật khẩu bảo mật
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pwForm}>
              <View style={styles.pwInputWrapper}>
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Mật khẩu hiện tại"
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry={!showCurrentPw}
                  editable={!pwSaving}
                />
                <TouchableOpacity
                  style={styles.pwToggleBtn}
                  onPress={() => setShowCurrentPw(!showCurrentPw)}
                >
                  <Text style={styles.pwToggleIcon}>
                    {showCurrentPw ? '🙈' : '👁'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pwInputWrapper}>
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry={!showNewPw}
                  editable={!pwSaving}
                />
                <TouchableOpacity
                  style={styles.pwToggleBtn}
                  onPress={() => setShowNewPw(!showNewPw)}
                >
                  <Text style={styles.pwToggleIcon}>
                    {showNewPw ? '🙈' : '👁'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pwInputWrapper}>
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry={!showConfirmPw}
                  editable={!pwSaving}
                />
                <TouchableOpacity
                  style={styles.pwToggleBtn}
                  onPress={() => setShowConfirmPw(!showConfirmPw)}
                >
                  <Text style={styles.pwToggleIcon}>
                    {showConfirmPw ? '🙈' : '👁'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pwActionsRow}>
                <TouchableOpacity
                  style={styles.pwCancelBtn}
                  onPress={() => setChangingPw(false)}
                  disabled={pwSaving}
                >
                  <Text style={styles.pwCancelBtnText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pwSaveBtn}
                  onPress={handleChangePassword}
                  disabled={pwSaving}
                >
                  {pwSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.pwSaveBtnText}>Lưu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backBtn: {
    padding: 8,
    width: 70,
  },
  backText: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  profileBox: {
    alignItems: 'center',
  },
  avatarCircleLarge: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#e7f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cfe0ff',
    elevation: 3,
    overflow: 'hidden',
  },
  avatarImageLarge: {
    width: '100%',
    height: '100%',
  },
  avatarEmojiLarge: {
    fontSize: 60,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 14,
  },
  profileIdSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
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
  statCard: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    width: '100%',
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    fontSize: 16,
    width: 28,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  changePwBtn: {
    marginTop: 24,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  changePwBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  pwForm: {
    width: '100%',
    marginTop: 20,
  },
  pwInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 14,
  },
  inputWithIcon: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    paddingRight: 44,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  pwToggleBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  pwToggleIcon: {
    fontSize: 18,
  },
  pwActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  pwCancelBtn: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  pwCancelBtnText: {
    color: '#555',
    fontWeight: '600',
  },
  pwSaveBtn: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#007BFF',
  },
  pwSaveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

