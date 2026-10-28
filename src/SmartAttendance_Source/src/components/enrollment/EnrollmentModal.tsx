import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { ModalContainer } from '../common/ModalContainer';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Employee } from '../../types/employee';
import { EnrollmentRequest } from '../../types/enrollment';
import {
  createEnrollmentRequest,
  subscribeEnrollmentRequest,
  cancelEnrollmentRequest,
} from '../../services/firebase/enrollmentService';
import { mapEnrollmentStatus } from '../../utils/mappers';
import { COLORS } from '../../constants/colors';

interface EnrollmentModalProps {
  visible: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
  visible,
  onClose,
  employee,
  onSuccess,
}) => {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<EnrollmentRequest | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!visible || !employee) {
      setRequestId(null);
      setRequestData(null);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const startEnrollment = async () => {
      setIsStarting(true);
      try {
        const id = await createEnrollmentRequest(employee.employeeId, 'esp32_001');
        setRequestId(id);

        unsubscribe = subscribeEnrollmentRequest(id, req => {
          setRequestData(req);
          if (req?.status === 'SUCCESS') {
            onSuccess();
          }
        });
      } catch (err: any) {
        Alert.alert('Không thể tạo yêu cầu', err.message);
        onClose();
      } finally {
        setIsStarting(false);
      }
    };

    startEnrollment();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [visible, employee]);

  const handleCancel = async () => {
    if (requestId) {
      try {
        await cancelEnrollmentRequest(requestId);
      } catch (err: any) {
        console.error('Lỗi khi hủy:', err);
      }
    }
    onClose();
  };

  if (!employee) return null;

  const currentStatus = requestData?.status || 'PENDING';
  const badgeInfo = mapEnrollmentStatus(currentStatus);

  return (
    <ModalContainer visible={visible} onClose={handleCancel} title="Đăng ký vân tay (ESP32)">
      <View style={styles.content}>
        {/* Thông tin nhân viên */}
        <View style={styles.empBox}>
          <Text style={styles.empName}>{employee.name}</Text>
          <Text style={styles.empId}>
            Mã NV: {employee.employeeId} • {employee.department}
          </Text>
          <Text style={styles.deviceInfo}>Thiết bị chỉ định: esp32_001 (Phòng bảo vệ)</Text>
        </View>

        {/* Trạng thái tiến trình */}
        <View style={styles.statusBox}>
          {isStarting ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.badgeWrapper}>
                <Badge
                  label={badgeInfo.label}
                  color={badgeInfo.color}
                  bgColor={badgeInfo.bgColor}
                  size="md"
                />
              </View>

              {currentStatus === 'PENDING' && (
                <View style={styles.instructionBox}>
                  <Text style={styles.iconLarge}>⏳</Text>
                  <Text style={styles.instructionText}>
                    Đang gửi yêu cầu đến thiết bị ESP32...
                  </Text>
                  <Text style={styles.subText}>
                    Vui lòng hướng dẫn nhân viên đến trước máy chấm công.
                  </Text>
                </View>
              )}

              {currentStatus === 'PROCESSING' && (
                <View style={styles.instructionBox}>
                  <Text style={styles.iconLarge}>👆</Text>
                  <Text style={[styles.instructionText, { color: COLORS.info }]}>
                    ESP32 đã sẵn sàng! Đặt ngón tay lên cảm biến...
                  </Text>
                  <Text style={styles.subText}>
                    Nhấc và đặt lại ngón tay theo tín hiệu đèn/chuông trên thiết bị.
                  </Text>
                  <ActivityIndicator size="small" color={COLORS.info} style={{ marginTop: 12 }} />
                </View>
              )}

              {currentStatus === 'SUCCESS' && (
                <View style={styles.instructionBox}>
                  <Text style={styles.iconLarge}>🎉</Text>
                  <Text style={[styles.instructionText, { color: COLORS.success }]}>
                    Đăng ký vân tay thành công!
                  </Text>
                  <Text style={styles.resultIdText}>
                    Mã vân tay nhận từ cảm biến:{' '}
                    <Text style={{ fontWeight: '800' }}>#{requestData?.fingerprintId}</Text>
                  </Text>
                </View>
              )}

              {currentStatus === 'FAILED' && (
                <View style={styles.instructionBox}>
                  <Text style={styles.iconLarge}>❌</Text>
                  <Text style={[styles.instructionText, { color: COLORS.danger }]}>
                    Đăng ký thất bại hoặc quá thời gian chờ.
                  </Text>
                  <Text style={styles.subText}>
                    Vui lòng làm sạch ngón tay và thử lại.
                  </Text>
                </View>
              )}

              {currentStatus === 'CANCELLED' && (
                <View style={styles.instructionBox}>
                  <Text style={styles.iconLarge}>🚫</Text>
                  <Text style={styles.instructionText}>Yêu cầu đã được hủy.</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Nút hành động */}
        <View style={styles.actionRow}>
          {currentStatus === 'SUCCESS' ? (
            <Button
              title="Hoàn tất"
              variant="primary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              title="Hủy yêu cầu"
              variant="danger"
              onPress={handleCancel}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 10,
  },
  empBox: {
    backgroundColor: COLORS.slate50,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: 4,
  },
  empId: {
    fontSize: 13,
    color: COLORS.slate600,
    marginBottom: 4,
  },
  deviceInfo: {
    fontSize: 12,
    color: COLORS.slate500,
    fontWeight: '500',
  },
  statusBox: {
    alignItems: 'center',
    paddingVertical: 16,
    minHeight: 180,
    justifyContent: 'center',
  },
  badgeWrapper: {
    marginBottom: 16,
  },
  instructionBox: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconLarge: {
    fontSize: 48,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate800,
    textAlign: 'center',
    marginBottom: 6,
  },
  subText: {
    fontSize: 13,
    color: COLORS.slate500,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultIdText: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 8,
  },
  actionRow: {
    marginTop: 20,
  },
});

