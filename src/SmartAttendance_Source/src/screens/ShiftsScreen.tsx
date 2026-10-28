import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Button } from '../components/common/Button';
import { ShiftModal } from '../components/shifts/ShiftModal';
import { WorkShift } from '../types/shift';
import { subscribeShifts, deleteShift } from '../services/firebase/shiftService';
import { COLORS } from '../constants/colors';

export const ShiftsScreen: React.FC = () => {
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);

  useEffect(() => {
    const unsub = subscribeShifts(list => {
      setShifts(list);
    });

    return () => {
      unsub();
    };
  }, []);

  const handleDelete = (shift: WorkShift) => {
    Alert.alert(
      'Xóa ca làm việc',
      `Bạn có chắc chắn muốn xóa ca "${shift.name}" (${shift.id})?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShift(shift.id);
              Alert.alert('Đã xóa', 'Ca làm việc đã được xóa thành công.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top action bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>Danh sách ca làm việc</Text>
          <Text style={styles.headerSub}>Tổng số: {shifts.length} ca</Text>
        </View>

        <Button
          title="+ Tạo ca mới"
          size="sm"
          onPress={() => {
            setEditingShift(null);
            setModalVisible(true);
          }}
        />
      </View>

      {/* Danh sách ca */}
      <FlatList
        data={shifts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={styles.emptyTitle}>Chưa có ca làm việc nào</Text>
            <Text style={styles.emptyDesc}>Bấm "+ Tạo ca mới" để thiết lập ca làm việc.</Text>
          </View>
        }
        renderItem={({ item }) => {
          return (
            <View style={[styles.card, { borderLeftColor: item.colorHex || COLORS.primary }]}>
              <View style={styles.cardHeader}>
                <View style={styles.titleCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.shiftName}>{item.name}</Text>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: item.colorHex || COLORS.primary },
                      ]}
                    />
                  </View>
                  <Text style={styles.shiftId}>Mã ca: {item.id}</Text>
                </View>

                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>
                    {item.startTime} – {item.endTime}
                  </Text>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.graceText}>
                  ⏱ Cho phép trễ:{' '}
                  <Text style={{ fontWeight: '700' }}>{item.gracePeriodMinutes ?? 10} phút</Text>
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setEditingShift(item);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.actionText}>Sửa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={styles.deleteText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Modal tạo / sửa ca */}
      <ShiftModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingShift(null);
        }}
        onSuccess={() => {}}
        shiftToEdit={editingShift}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  shiftId: {
    fontSize: 11,
    color: COLORS.slate400,
    fontFamily: 'monospace',
  },
  timeBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  description: {
    fontSize: 13,
    color: COLORS.slate600,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingTop: 10,
  },
  graceText: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.slate100,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  deleteBtn: {
    backgroundColor: COLORS.dangerBg,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate800,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.slate500,
  },
});

