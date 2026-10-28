import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Employee } from '../types/employee';
import { AttendanceRecord } from '../types/attendance';
import { DeviceWithId } from '../services/firebase/deviceService';
import { subscribeEmployees } from '../services/firebase/employeeService';
import { subscribeAttendanceByDate } from '../services/firebase/attendanceService';
import { subscribeDevices } from '../services/firebase/deviceService';
import { getTodayDateString, formatDisplayTime } from '../utils/dateUtils';
import { mapAttendanceStatus } from '../utils/mappers';
import { useNavigation } from '../navigation/NavigationContext';
import { COLORS } from '../constants/colors';

export const DashboardScreen: React.FC = () => {
  const { setActiveTab } = useNavigation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [devices, setDevices] = useState<DeviceWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = getTodayDateString();

  useEffect(() => {
    // 1. Subscribe employees
    const unsubEmployees = subscribeEmployees(list => {
      setEmployees(list);
      setLoading(false);
    });

    // 2. Subscribe today attendance
    const unsubAttendance = subscribeAttendanceByDate(todayStr, recs => {
      setTodayRecords(recs);
    });

    // 3. Subscribe devices
    const unsubDevices = subscribeDevices(devs => {
      setDevices(devs);
    });

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubDevices();
    };
  }, [todayStr]);

  // Tính toán các chỉ số động từ dữ liệu thật
  const activeEmployees = employees.filter(e => e.active);
  const totalActive = activeEmployees.length;

  const presentCount = todayRecords.filter(r => !!r.checkIn).length;
  const lateCount = todayRecords.filter(
    r => (r.status || '').toLowerCase() === 'late' || (r.lateMinutes ?? 0) > 0
  ).length;
  const absentCount = Math.max(0, totalActive - presentCount);

  const onTimeCount = presentCount - lateCount;
  const onTimeRate = presentCount > 0 ? Math.round((onTimeCount / presentCount) * 100) : 0;

  // Tạo map tên nhân viên cho bản ghi chấm công
  const empMap = new Map<string, Employee>();
  employees.forEach(e => empMap.set(e.employeeId, e));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} />}
    >
      {/* Date Header & Device Status */}
      <View style={styles.topInfo}>
        <View>
          <Text style={styles.dateText}>Hôm nay, {todayStr}</Text>
          <Text style={styles.greetingText}>Tổng quan vận hành</Text>
        </View>

        {devices.map(d => (
          <View key={d.deviceId} style={styles.deviceStatus}>
            <View
              style={[
                styles.dot,
                { backgroundColor: d.active ? COLORS.success : COLORS.danger },
              ]}
            />
            <Text style={styles.deviceName}>{d.name || d.deviceId}</Text>
          </View>
        ))}
      </View>

      {/* Grid 4 thẻ thống kê chính */}
      <View style={styles.statsGrid}>
        <View style={styles.gridCol}>
          <StatCard
            title="Tổng nhân sự"
            value={totalActive}
            subtitle={`Đang làm việc (${employees.length - totalActive} khóa)`}
            color={COLORS.primary}
            iconText="👥"
          />
          <StatCard
            title="Điểm danh đúng giờ"
            value={Math.max(0, onTimeCount)}
            subtitle={`Tỷ lệ: ${onTimeRate}%`}
            color={COLORS.success}
            iconText="✅"
          />
        </View>

        <View style={styles.gridCol}>
          <StatCard
            title="Có mặt hôm nay"
            value={presentCount}
            subtitle={`Đạt ${totalActive > 0 ? Math.round((presentCount / totalActive) * 100) : 0}% quân số`}
            color={COLORS.info}
            iconText="📍"
          />
          <StatCard
            title="Đi muộn"
            value={lateCount}
            subtitle={absentCount > 0 ? `Vắng mặt: ${absentCount} người` : 'Không có ai vắng'}
            color={lateCount > 0 ? COLORS.warning : COLORS.slate500}
            iconText="⚠️"
          />
        </View>
      </View>

      {/* Quick Action Navigation */}
      <View style={styles.quickNav}>
        <TouchableOpacity
          style={[styles.quickBtn, { borderColor: COLORS.primary }]}
          onPress={() => setActiveTab('employees')}
        >
          <Text style={styles.quickIcon}>👥</Text>
          <Text style={styles.quickLabel}>Nhân viên</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, { borderColor: COLORS.info }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={styles.quickIcon}>📋</Text>
          <Text style={styles.quickLabel}>Chấm công</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, { borderColor: COLORS.warning }]}
          onPress={() => setActiveTab('shifts')}
        >
          <Text style={styles.quickIcon}>⏰</Text>
          <Text style={styles.quickLabel}>Ca làm việc</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, { borderColor: COLORS.success }]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={styles.quickIcon}>📈</Text>
          <Text style={styles.quickLabel}>Báo cáo</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách chấm công gần nhất trong ngày */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chấm công trong ngày ({todayRecords.length})</Text>
          <TouchableOpacity onPress={() => setActiveTab('history')}>
            <Text style={styles.seeAllText}>Xem tất cả →</Text>
          </TouchableOpacity>
        </View>

        {todayRecords.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>☕</Text>
            <Text style={styles.emptyTitle}>Chưa có bản ghi chấm công nào hôm nay</Text>
            <Text style={styles.emptyDesc}>
              Khi nhân viên quét vân tay trên ESP32, dữ liệu sẽ hiển thị tại đây realtime.
            </Text>
          </View>
        ) : (
          todayRecords.map(item => {
            const emp = empMap.get(item.employeeId);
            const badge = mapAttendanceStatus(item.status);

            return (
              <View key={item.employeeId} style={styles.recordItem}>
                <View style={styles.recordAvatar}>
                  <Text style={styles.avatarChar}>
                    {emp?.name ? emp.name.charAt(0).toUpperCase() : 'N'}
                  </Text>
                </View>

                <View style={styles.recordMain}>
                  <Text style={styles.recordName}>{emp?.name || item.employeeId}</Text>
                  <Text style={styles.recordSub}>
                    {emp?.department || '—'} • {item.shiftName || item.shiftId || 'Hành chính'}
                  </Text>
                </View>

                <View style={styles.recordTimes}>
                  <Text style={styles.timeIn}>Vào: {formatDisplayTime(item.checkIn)}</Text>
                  <Text style={styles.timeOut}>Ra: {formatDisplayTime(item.checkOut)}</Text>
                </View>

                <View style={styles.recordStatus}>
                  <Badge
                    label={badge.label}
                    color={badge.color}
                    bgColor={badge.bgColor}
                    size="sm"
                  />
                  {item.lateMinutes ? (
                    <Text style={styles.lateMinText}>+{item.lateMinutes}p</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate900,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridCol: {
    flex: 1,
  },
  quickNav: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate700,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate700,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    maxWidth: 240,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    gap: 10,
  },
  recordAvatar: {
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
  recordMain: {
    flex: 1,
  },
  recordName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  recordSub: {
    fontSize: 11,
    color: COLORS.slate400,
  },
  recordTimes: {
    alignItems: 'flex-end',
  },
  timeIn: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate700,
  },
  timeOut: {
    fontSize: 11,
    color: COLORS.slate400,
  },
  recordStatus: {
    alignItems: 'flex-end',
    minWidth: 65,
  },
  lateMinText: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: '700',
    marginTop: 2,
  },
});

