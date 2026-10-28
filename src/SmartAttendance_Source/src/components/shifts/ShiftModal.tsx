import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { ModalContainer } from '../common/ModalContainer';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { WorkShift } from '../../types/shift';
import { saveShift, SHIFT_PRESETS } from '../../services/firebase/shiftService';
import { isValidTime } from '../../utils/validators';
import { COLORS } from '../../constants/colors';

interface ShiftModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shiftToEdit?: WorkShift | null;
}

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#16A34A', // Green
  '#F59E0B', // Amber
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#0284C7', // Sky blue
  '#E11D48', // Rose
];

export const ShiftModal: React.FC<ShiftModalProps> = ({
  visible,
  onClose,
  onSuccess,
  shiftToEdit,
}) => {
  const isEdit = !!shiftToEdit;

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [description, setDescription] = useState('');
  const [colorHex, setColorHex] = useState('#4F46E5');
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState('10');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shiftToEdit) {
      setId(shiftToEdit.id);
      setName(shiftToEdit.name);
      setStartTime(shiftToEdit.startTime);
      setEndTime(shiftToEdit.endTime);
      setDescription(shiftToEdit.description);
      setColorHex(shiftToEdit.colorHex || '#4F46E5');
      setGracePeriodMinutes(String(shiftToEdit.gracePeriodMinutes ?? 10));
    } else {
      setId('');
      setName('');
      setStartTime('08:00');
      setEndTime('17:00');
      setDescription('');
      setColorHex('#4F46E5');
      setGracePeriodMinutes('10');
    }
    setErrors({});
  }, [shiftToEdit, visible]);

  const applyPreset = (preset: WorkShift) => {
    if (!isEdit) {
      setId(preset.id);
    }
    setName(preset.name);
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
    setDescription(preset.description);
    setColorHex(preset.colorHex);
    setGracePeriodMinutes(String(preset.gracePeriodMinutes ?? 10));
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!isEdit && !id.trim()) {
      errs.id = 'Mã ca (shiftId) không được để trống.';
    }

    if (!name.trim()) {
      errs.name = 'Tên ca không được để trống.';
    }

    if (!isValidTime(startTime)) {
      errs.startTime = 'Giờ bắt đầu phải theo chuẩn HH:mm (ví dụ 08:00).';
    }

    if (!isValidTime(endTime)) {
      errs.endTime = 'Giờ kết thúc phải theo chuẩn HH:mm (ví dụ 17:00).';
    }

    const grace = parseInt(gracePeriodMinutes, 10);
    if (isNaN(grace) || grace < 0) {
      errs.grace = 'Số phút cho phép đi muộn phải là số >= 0.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await saveShift({
        id: id.trim(),
        name: name.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        description: description.trim(),
        colorHex: colorHex.trim(),
        gracePeriodMinutes: parseInt(gracePeriodMinutes, 10) || 0,
        active: true,
      });

      Alert.alert('Thành công', isEdit ? 'Cập nhật ca thành công.' : 'Thêm ca làm mới thành công.');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa ca làm việc' : 'Tạo ca làm việc mới'}
    >
      {!isEdit && (
        <View style={styles.presetsSection}>
          <Text style={styles.presetsTitle}>Ca mẫu có sẵn:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {SHIFT_PRESETS.map(preset => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetChip}
                onPress={() => applyPreset(preset)}
              >
                <Text style={styles.presetText}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Input
        label="Mã ca (shiftId - Firebase key) *"
        value={id}
        onChangeText={setId}
        placeholder="ví dụ: shift_hanh_chinh"
        editable={!isEdit}
        error={errors.id}
        autoCapitalize="none"
      />

      <Input
        label="Tên ca làm việc *"
        value={name}
        onChangeText={setName}
        placeholder="ví dụ: Hành Chính"
        error={errors.name}
      />

      <View style={styles.row}>
        <Input
          label="Giờ bắt đầu (HH:mm) *"
          value={startTime}
          onChangeText={setStartTime}
          placeholder="08:00"
          error={errors.startTime}
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="Giờ kết thúc (HH:mm) *"
          value={endTime}
          onChangeText={setEndTime}
          placeholder="17:00"
          error={errors.endTime}
          containerStyle={{ flex: 1 }}
        />
      </View>

      <Input
        label="Phút cho phép trễ (Grace period)"
        value={gracePeriodMinutes}
        onChangeText={setGracePeriodMinutes}
        placeholder="10"
        error={errors.grace}
        keyboardType="numeric"
      />

      <Input
        label="Mô tả ca làm việc"
        value={description}
        onChangeText={setDescription}
        placeholder="Mô tả chi tiết ca làm..."
      />

      {/* Màu hiển thị */}
      <Text style={styles.colorLabel}>Màu nhận diện ca</Text>
      <View style={styles.colorRow}>
        {PRESET_COLORS.map(c => {
          const isSelected = colorHex.toLowerCase() === c.toLowerCase();
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setColorHex(c)}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                isSelected && styles.colorCircleSelected,
              ]}
            />
          );
        })}
      </View>

      <View style={styles.btnRow}>
        <Button
          title="Hủy"
          variant="outline"
          onPress={onClose}
          style={{ flex: 1 }}
          disabled={loading}
        />
        <Button
          title={isEdit ? 'Lưu ca' : 'Tạo ca'}
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
  presetsSection: {
    marginBottom: 16,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate500,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.slate300,
    marginRight: 8,
  },
  presetText: {
    fontSize: 12,
    color: COLORS.slate700,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  colorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate700,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: COLORS.slate900,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
});

