import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Badge } from '../components/common/Badge';
import { AttendanceRecord } from '../types/attendance';
import { Employee } from '../types/employee';
import { subscribeAllAttendance } from '../services/firebase/attendanceService';
import { subscribeEmployees } from '../services/firebase/employeeService';
import { mapAttendanceStatus } from '../utils/mappers';
import { formatDisplayTime } from '../utils/dateUtils';
import { COLORS } from '../constants/colors';

export const AttendanceHistoryScreen: React.FC = () => {
  const [allAttendance, setAllAttendance] = useState<{ date: string; record: AttendanceRecord }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ON_TIME' | 'LATE'>('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');

  useEffect(() => {
    const unsubAtt = subscribeAllAttendance(list => {
      setAllAttendance(list);
    });

    const unsubEmp = subscribeEmployees(list => {
      setEmployees(list);
    });

    return () => {
      unsubAtt();
      unsubEmp();
    };
  }, []);

  const empMap = new Map<string, Employee>();
  employees.forEach(e => empMap.set(e.employeeId, e));

  const departments = ['ALL', ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  // Lọc dữ liệu
  const filteredRecords = allAttendance.filter(({ date, record }) => {
    const emp = empMap.get(record.employeeId);
    const q = searchQuery.toLowerCase().trim();

    // 1. Search query
    const matchesSearch =
      !q ||
      record.employeeId.toLowerCase().includes(q) ||
      (emp?.name || '').toLowerCase().includes(q) ||
      date.includes(q);

    // 2. Department filter
    const matchesDept = selectedDept === 'ALL' || emp?.department === selectedDept;

    // 3. Status filter
    const normStatus = (record.status || '').toLowerCase();
    let matchesStatus = true;
    if (selectedStatus === 'ON_TIME') {
      matchesStatus = normStatus === 'on-time' || normStatus === 'on_time';
    } else if (selectedStatus === 'LATE') {
      matchesStatus = normStatus === 'late' || (record.lateMinutes ?? 0) > 0;
    }

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.topFilterSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Tìm theo nhân viên, mã NV, ngày..."
            placeholderTextColor={COLORS.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter status */}
        <View style={styles.statusChips}>
          <TouchableOpacity
            style={[styles.statusChip, selectedStatus === 'ALL' && styles.statusChipActive]}
            onPress={() => setSelectedStatus('ALL')}
          >
            <Text style={[styles.chipLabel, selectedStatus === 'ALL' && styles.chipLabelActive]}>
              Tất cả ({allAttendance.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusChip, selectedStatus === 'ON_TIME' && styles.statusChipActive]}
            onPress={() => setSelectedStatus('ON_TIME')}
          >
            <Text style={[styles.chipLabel, selectedStatus === 'ON_TIME' && styles.chipLabelActive]}>
              Đúng giờ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusChip, selectedStatus === 'LATE' && styles.statusChipActive]}
            onPress={() => setSelectedStatus('LATE')}
          >
            <Text style={[styles.chipLabel, selectedStatus === 'LATE' && styles.chipLabelActive]}>
              Đi muộn
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter department */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
          {departments.map(d => {
            const isSel = selectedDept === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.deptChip, isSel && styles.deptChipActive]}
                onPress={() => setSelectedDept(d)}
              >
                <Text style={[styles.deptText, isSel && styles.deptTextActive]}>
                  {d === 'ALL' ? 'Tất cả PB' : d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Danh sách bản ghi */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item, index) => `${item.date}_${item.record.employeeId}_${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Không có dữ liệu chấm công phù hợp</Text>
            <Text style={styles.emptyDesc}>
              Thay đổi bộ lọc hoặc đợi thiết bị ESP32 đồng bộ dữ liệu mới.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { date, record } = item;
          const emp = empMap.get(record.employeeId);
          const badge = mapAttendanceStatus(record.status);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>📅 {date}</Text>
                </View>

                <Badge
                  label={badge.label}
                  color={badge.color}
                  bgColor={badge.bgColor}
                  size="sm"
                />
              </View>

              <View style={styles.empRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarChar}>
                    {emp?.name ? emp.name.charAt(0).toUpperCase() : 'N'}
                  </Text>
                </View>
                <View style={styles.empTextCol}>
                  <Text style={styles.empName}>{emp?.name || record.employeeId}</Text>
                  <Text style={styles.empMeta}>
                    Mã: {record.employeeId} • {emp?.department || '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Giờ vào</Text>
                  <Text style={styles.metricValue}>{formatDisplayTime(record.checkIn)}</Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Giờ ra</Text>
                  <Text style={styles.metricValue}>{formatDisplayTime(record.checkOut)}</Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Tổng giờ</Text>
                  <Text style={styles.metricValue}>
                    {record.workingHours ? `${record.workingHours}h` : '—'}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Đi muộn</Text>
                  <Text style={[styles.metricValue, record.lateMinutes ? { color: COLORS.warning } : null]}>
                    {record.lateMinutes ? `${record.lateMinutes}p` : '0p'}
                  </Text>
                </View>
              </View>

              {record.note ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>Ghi chú: {record.note}</Text>
                </View>
              ) : null}
            </View>
          );
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
  topFilterSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate100,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
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
  clearText: {
    fontSize: 14,
    color: COLORS.slate400,
    padding: 4,
  },
  statusChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: COLORS.slate100,
  },
  statusChipActive: {
    backgroundColor: COLORS.primary,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate600,
  },
  chipLabelActive: {
    color: COLORS.white,
  },
  deptScroll: {
    flexDirection: 'row',
  },
  deptChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.slate100,
    marginRight: 6,
  },
  deptChipActive: {
    backgroundColor: COLORS.slate800,
  },
  deptText: {
    fontSize: 11,
    color: COLORS.slate600,
  },
  deptTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateBadge: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  empTextCol: {
    flex: 1,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  empMeta: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate50,
    borderRadius: 8,
    padding: 10,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.slate400,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  noteBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.slate500,
    fontStyle: 'italic',
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
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.slate500,
    textAlign: 'center',
  },
});

