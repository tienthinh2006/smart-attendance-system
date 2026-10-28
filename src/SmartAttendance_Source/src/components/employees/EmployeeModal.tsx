import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { ModalContainer } from '../common/ModalContainer';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Employee } from '../../types/employee';
import { WorkShift } from '../../types/shift';
import { createEmployeeWithAuthAccount } from '../../services/firebase/adminAuthService';
import { updateEmployee } from '../../services/firebase/employeeService';
import { isValidEmail, isValidPhone, isValidEmployeeId } from '../../utils/validators';
import { COLORS } from '../../constants/colors';
import { DEFAULT_EMPLOYEE_PASSWORD } from '../../constants/auth';

interface EmployeeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: Employee | null;
  shifts: WorkShift[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  visible,
  onClose,
  onSuccess,
  employeeToEdit,
  shifts,
}) => {
  const isEdit = !!employeeToEdit;

  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('IT');
  const [position, setPosition] = useState('');
  const [defaultShiftId, setDefaultShiftId] = useState<string>('shift_hanh_chinh');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employeeToEdit) {
      setEmployeeId(employeeToEdit.employeeId);
      setName(employeeToEdit.name);
      setEmail(employeeToEdit.email || '');
      setPhone(employeeToEdit.phone);
      setDepartment(employeeToEdit.department);
      setPosition(employeeToEdit.position || '');
      setDefaultShiftId(employeeToEdit.defaultShiftId || (shifts[0]?.id || ''));
    } else {
      setEmployeeId('');
      setName('');
      setEmail('');
      setPhone('');
      setDepartment('IT');
      setPosition('');
      setDefaultShiftId(shifts[0]?.id || 'shift_hanh_chinh');
    }
    setErrors({});
  }, [employeeToEdit, visible, shifts]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!isEdit) {
      if (!employeeId.trim()) {
        errs.employeeId = 'Mã nhân viên không được để trống.';
      } else if (!isValidEmployeeId(employeeId)) {
        errs.employeeId = 'Mã NV chỉ được gồm chữ cái, số, gạch dưới.';
      }
    }

    if (!name.trim()) {
      errs.name = 'Họ và tên không được để trống.';
    }

    if (!phone.trim()) {
      errs.phone = 'Số điện thoại không được để trống.';
    } else if (!isValidPhone(phone)) {
      errs.phone = 'Số điện thoại không đúng định dạng.';
    }

    if (!department.trim()) {
      errs.department = 'Phòng ban không được để trống.';
    }

    if (!isEdit) {
      if (!email.trim()) {
        errs.email = 'Email bắt buộc để tạo tài khoản Auth.';
      } else if (!isValidEmail(email)) {
        errs.email = 'Email không hợp lệ.';
      }
    } else if (email.trim() && !isValidEmail(email)) {
      errs.email = 'Email không hợp lệ.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isEdit) {
        // Cập nhật nhân viên hiện có
        await updateEmployee(employeeToEdit.employeeId, {
          name: name.trim(),
          phone: phone.trim(),
          department: department.trim(),
          position: position.trim(),
          email: email.trim(),
          defaultShiftId: defaultShiftId || null,
        });
        Alert.alert('Thành công', 'Cập nhật thông tin nhân viên thành công.');
      } else {
        // Tạo nhân viên mới + cấp Auth Account mật khẩu mặc định (abc@123)
        const res = await createEmployeeWithAuthAccount({
          employeeId: employeeId.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          department: department.trim(),
          position: position.trim(),
          defaultShiftId: defaultShiftId || null,
        });
        Alert.alert('Thành công', `${res.message}\nMã NV: ${res.employeeId}`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Thao tác thất bại', err.message);
    } finally {
      setLoading(false);
    }
  };

  const DEPARTMENTS = ['IT', 'HR', 'Kế toán', 'Kinh doanh', 'Sản xuất', 'Bảo vệ'];

  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
    >
      {!isEdit && (
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Mật khẩu khởi tạo</Text>
          <Text style={styles.tipDesc}>
            Nhân viên mới sẽ được tạo tài khoản Auth với mật khẩu mặc định là{' '}
            <Text style={{ fontWeight: '700' }}>{DEFAULT_EMPLOYEE_PASSWORD}</Text>. Phiên đăng nhập của Admin được bảo toàn tuyệt đối.
          </Text>
        </View>
      )}

      <Input
        label="Mã nhân viên (employeeId) *"
        value={employeeId}
        onChangeText={setEmployeeId}
        placeholder="ví dụ: employee006"
        editable={!isEdit}
        error={errors.employeeId}
        autoCapitalize="none"
      />

      <Input
        label="Họ và tên *"
        value={name}
        onChangeText={setName}
        placeholder="ví dụ: Trần Thị Mai"
        error={errors.name}
      />

      <Input
        label="Email đăng nhập *"
        value={email}
        onChangeText={setEmail}
        placeholder="ví dụ: mai.tran@company.com"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Số điện thoại *"
        value={phone}
        onChangeText={setPhone}
        placeholder="ví dụ: 0912345678"
        error={errors.phone}
        keyboardType="phone-pad"
      />

      {/* Chọn phòng ban */}
      <Text style={styles.pickerLabel}>Phòng ban *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptRow}>
        {DEPARTMENTS.map(d => {
          const isSelected = department === d;
          return (
            <TouchableOpacity
              key={d}
              activeOpacity={0.7}
              onPress={() => setDepartment(d)}
              style={[styles.chip, isSelected && styles.chipActive]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Input
        label="Chức danh / Vị trí"
        value={position}
        onChangeText={setPosition}
        placeholder="ví dụ: Chuyên viên tuyển dụng"
      />

      {/* Chọn ca làm mặc định */}
      <Text style={styles.pickerLabel}>Ca làm việc mặc định</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptRow}>
        {shifts.map(s => {
          const isSelected = defaultShiftId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.7}
              onPress={() => setDefaultShiftId(s.id)}
              style={[styles.chip, isSelected && styles.chipActive]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {s.name} ({s.startTime}–{s.endTime})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.btnRow}>
        <Button
          title="Hủy"
          variant="outline"
          onPress={onClose}
          style={{ flex: 1 }}
          disabled={loading}
        />
        <Button
          title={isEdit ? 'Lưu thay đổi' : 'Tạo nhân viên'}
          variant="primary"
          onPress={handleSubmit}
          loading={loading}
          style={{ flex: 1.5 }}
        />
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  tipBox: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 12,
    color: COLORS.slate600,
    lineHeight: 18,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate700,
    marginBottom: 8,
  },
  deptRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.slate600,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
});

