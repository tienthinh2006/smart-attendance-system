import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmployeeModal } from '../components/employees/EmployeeModal';
import { EnrollmentModal } from '../components/enrollment/EnrollmentModal';
import { Employee } from '../types/employee';
import { WorkShift } from '../types/shift';
import {
  subscribeEmployees,
  toggleEmployeeActive,
  deleteEmployee,
} from '../services/firebase/employeeService';
import { getAllShifts } from '../services/firebase/shiftService';
import { mapActiveStatus } from '../utils/mappers';
import { COLORS } from '../../src/constants/colors';

export const EmployeesScreen: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [enrollingEmployee, setEnrollingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    // 1. Subscribe employees realtime
    const unsub = subscribeEmployees(list => {
      setEmployees(list);
    });

    // 2. Load shifts
    getAllShifts().then(sList => setShifts(sList));

    return () => {
      unsub();
    };
  }, []);

  // Lấy danh sách các phòng ban duy nhất
  const departments = ['ALL', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  // Lọc theo tìm kiếm và phòng ban
  const filteredEmployees = employees.filter(e => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.phone.includes(q) ||
      (e.email || '').toLowerCase().includes(q);

    const matchesDept = selectedDept === 'ALL' || e.department === selectedDept;

    return matchesQuery && matchesDept;
  });

  const handleToggleActive = (emp: Employee) => {
    const actionText = emp.active ? 'khóa' : 'mở khóa';
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc chắn muốn ${actionText} tài khoản của nhân viên ${emp.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              await toggleEmployeeActive(emp.employeeId, emp.active);
            } catch (err: any) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (emp: Employee) => {
    Alert.alert(
      'Xóa nhân viên',
      `CẢNH BÁO: Thao tác này sẽ xóa hồ sơ của ${emp.name} (${emp.employeeId}) khỏi cơ sở dữ liệu. Tiếp tục?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmployee(emp.employeeId);
              Alert.alert('Đã xóa', 'Đã xóa hồ sơ nhân viên.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  };

  const shiftMap = new Map<string, WorkShift>();
  shifts.forEach(s => shiftMap.set(s.id, s));

  return (
    <View style={styles.container}>
      {/* Header Actions */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Tìm tên, mã NV, SĐT, email..."
            placeholderTextColor={COLORS.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Button
          title="+ Thêm NV"
          size="sm"
          onPress={() => {
            setEditingEmployee(null);
            setModalVisible(true);
          }}
          style={styles.addBtn}
        />
      </View>

      {/* Filter theo phòng ban */}
      <View style={styles.deptFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
          {departments.map(dept => {
            const isSelected = selectedDept === dept;
            return (
              <TouchableOpacity
                key={dept}
                onPress={() => setSelectedDept(dept)}
                style={[styles.deptChip, isSelected && styles.deptChipActive]}
              >
                <Text style={[styles.deptChipText, isSelected && styles.deptChipTextActive]}>
                  {dept === 'ALL' ? 'Tất cả phòng ban' : dept}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Danh sách nhân viên */}
      <FlatList
        data={filteredEmployees}
        keyExtractor={item => item.employeeId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy nhân viên nào</Text>
            <Text style={styles.emptyDesc}>
              Hãy thử tìm kiếm với từ khóa khác hoặc bấm "+ Thêm NV" để tạo mới.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusBadge = mapActiveStatus(item.active);
          const assignedShift = item.defaultShiftId ? shiftMap.get(item.defaultShiftId) : null;
          const hasFingerprint = typeof item.fingerprintId === 'number';

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.name ? item.name.charAt(0).toUpperCase() : 'N'}
                  </Text>
                </View>

                <View style={styles.mainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Badge
                      label={statusBadge.label}
                      color={statusBadge.color}
                      bgColor={statusBadge.bgColor}
                      size="sm"
                    />
                  </View>
                  <Text style={styles.subInfo}>
                    Mã: <Text style={styles.bold}>{item.employeeId}</Text> • {item.department}
                    {item.position ? ` • ${item.position}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsBox}>
                <Text style={styles.detailRow}>
                  📞 <Text style={styles.detailText}>{item.phone || '—'}</Text>
                </Text>
                {item.email ? (
                  <Text style={styles.detailRow}>
                    ✉️ <Text style={styles.detailText}>{item.email}</Text>
                  </Text>
                ) : null}
                <Text style={styles.detailRow}>
                  ⏰ Ca mặc định:{' '}
                  <Text style={styles.detailHighlight}>
                    {assignedShift
                      ? `${assignedShift.name} (${assignedShift.startTime}–${assignedShift.endTime})`
                      : 'Chưa gán ca'}
                  </Text>
                </Text>
                <Text style={styles.detailRow}>
                  👆 Vân tay ESP32:{' '}
                  {hasFingerprint ? (
                    <Text style={styles.fpSuccess}>Đã đăng ký (ID #{item.fingerprintId})</Text>
                  ) : (
                    <Text style={styles.fpPending}>Chưa đăng ký</Text>
                  )}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.fpBtn]}
                  onPress={() => setEnrollingEmployee(item)}
                >
                  <Text style={styles.fpBtnText}>
                    {hasFingerprint ? '🔄 Quét lại vân tay' : '➕ Đăng ký vân tay'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setEditingEmployee(item);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.actionText}>Sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleToggleActive(item)}
                >
                  <Text style={[styles.actionText, { color: item.active ? COLORS.warning : COLORS.success }]}>
                    {item.active ? 'Khóa' : 'Mở'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(item)}
                >
                  <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Modal Thêm/Sửa nhân viên */}
      <EmployeeModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingEmployee(null);
        }}
        onSuccess={() => {
          // Realtime listener tự động cập nhật list
        }}
        employeeToEdit={editingEmployee}
        shifts={shifts}
      />

      {/* Modal Đăng ký vân tay */}
      <EnrollmentModal
        visible={!!enrollingEmployee}
        employee={enrollingEmployee}
        onClose={() => setEnrollingEmployee(null)}
        onSuccess={() => {
          // Sau khi thành công
        }}
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
    padding: 16,
    paddingBottom: 8,
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate900,
  },
  clearIcon: {
    fontSize: 14,
    color: COLORS.slate400,
    padding: 4,
  },
  addBtn: {
    height: 44,
  },
  deptFilterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  deptScroll: {
    flexDirection: 'row',
  },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginRight: 8,
  },
  deptChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  deptChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate600,
  },
  deptChipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  mainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  subInfo: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.slate700,
  },
  detailsBox: {
    backgroundColor: COLORS.slate50,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    fontSize: 12,
    color: COLORS.slate600,
  },
  detailText: {
    fontWeight: '500',
    color: COLORS.slate800,
  },
  detailHighlight: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  fpSuccess: {
    fontWeight: '700',
    color: COLORS.success,
  },
  fpPending: {
    fontWeight: '600',
    color: COLORS.slate400,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingTop: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: COLORS.slate100,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  fpBtn: {
    backgroundColor: COLORS.primaryBg,
    marginRight: 'auto',
  },
  fpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  deleteBtn: {
    backgroundColor: COLORS.dangerBg,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
  emptyContainer: {
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
    textAlign: 'center',
    maxWidth: 260,
  },
});

