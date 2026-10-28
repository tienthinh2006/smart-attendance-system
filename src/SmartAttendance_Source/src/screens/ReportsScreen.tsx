import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { AttendanceRecord } from '../types/attendance';
import { Employee } from '../types/employee';
import { getAllAttendanceRecords } from '../services/firebase/attendanceService';
import { getAllEmployees } from '../services/firebase/employeeService';
import { generateAttendanceCSV, shareCSV } from '../utils/exportUtils';
import { COLORS } from '../constants/colors';

export const ReportsScreen: React.FC = () => {
  const [attendanceList, setAttendanceList] = useState<{ date: string; record: AttendanceRecord }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [att, emp] = await Promise.all([
        getAllAttendanceRecords(),
        getAllEmployees(),
      ]);
      setAttendanceList(att);
      setEmployees(emp);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  const empMap: Record<string, Employee> = {};
  employees.forEach(e => {
    empMap[e.employeeId] = e;
  });

  // Tính toán các chỉ số báo cáo động
  const totalRecords = attendanceList.length;
  const onTimeRecords = attendanceList.filter(
    item =>
      (item.record.status || '').toLowerCase() === 'on-time' ||
      (item.record.status || '').toLowerCase() === 'on_time'
  ).length;
  const lateRecords = attendanceList.filter(
    item =>
      (item.record.status || '').toLowerCase() === 'late' ||
      (item.record.lateMinutes ?? 0) > 0
  ).length;

  const onTimeRate = totalRecords > 0 ? Math.round((onTimeRecords / totalRecords) * 100) : 0;

  const totalLateMinutes = attendanceList.reduce(
    (acc, cur) => acc + (cur.record.lateMinutes || 0),
    0
  );

  const totalWorkingHours = attendanceList.reduce(
    (acc, cur) => acc + (cur.record.workingHours || 0),
    0
  );

  const totalOvertime = attendanceList.reduce(
    (acc, cur) => acc + (cur.record.overtimeHours || 0),
    0
  );

  // Thống kê theo phòng ban
  const deptStats: Record<string, { total: number; onTime: number; late: number; hours: number }> = {};
  attendanceList.forEach(({ record }) => {
    const emp = empMap[record.employeeId];
    const dept = emp?.department || 'Khác';

    if (!deptStats[dept]) {
      deptStats[dept] = { total: 0, onTime: 0, late: 0, hours: 0 };
    }

    deptStats[dept].total += 1;
    if ((record.status || '').toLowerCase() === 'late' || (record.lateMinutes ?? 0) > 0) {
      deptStats[dept].late += 1;
    } else {
      deptStats[dept].onTime += 1;
    }
    deptStats[dept].hours += record.workingHours || 0;
  });

  const handleExportCSV = async () => {
    if (attendanceList.length === 0) {
      Alert.alert('Thông báo', 'Không có dữ liệu chấm công để xuất file.');
      return;
    }

    setExporting(true);
    try {
      const recordsOnly = attendanceList.map(item => ({
        ...item.record,
        timestamp: `${item.date}T${item.record.checkIn || '00:00:00'}`,
      }));

      const csv = generateAttendanceCSV(recordsOnly, empMap);
      await shareCSV(csv, `Bao_Cao_Cham_Cong_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err: any) {
      Alert.alert('Lỗi xuất file', err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading && attendanceList.length === 0) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu báo cáo...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadData}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Top Banner & Export Button */}
      <View style={styles.exportCard}>
        <View style={styles.exportTextCol}>
          <Text style={styles.exportTitle}>Báo cáo & Xuất dữ liệu</Text>
          <Text style={styles.exportDesc}>
            Dữ liệu tổng hợp trực tiếp từ Firebase Realtime Database ({totalRecords} lượt chấm công).
          </Text>
        </View>

        <Button
          title="Xuất CSV"
          variant="primary"
          onPress={handleExportCSV}
          loading={exporting}
          style={styles.exportBtn}
        />
      </View>

      {/* Grid thống kê tổng hợp: Sắp xếp theo 2 hàng ngang đối xứng */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <StatCard
            title="Tỷ lệ đúng giờ"
            value={`${onTimeRate}%`}
            subtitle={`${onTimeRecords} / ${totalRecords} lượt đúng giờ`}
            color={COLORS.success}
            iconText="🎯"
            style={styles.statCard}
          />
          <StatCard
            title="Tổng phút đi muộn"
            value={`${totalLateMinutes}p`}
            subtitle={`${lateRecords} lượt đi muộn`}
            color={COLORS.warning}
            iconText="⚠️"
            style={styles.statCard}
          />
        </View>

        <View style={styles.metricsRow}>
          <StatCard
            title="Tổng giờ làm"
            value={`${Math.round(totalWorkingHours * 10) / 10}h`}
            subtitle="Toàn bộ hệ thống"
            color={COLORS.primary}
            iconText="⏳"
            style={styles.statCard}
          />
          <StatCard
            title="Tổng giờ tăng ca"
            value={`${Math.round(totalOvertime * 10) / 10}h`}
            subtitle="Giờ làm ngoài chuẩn"
            color={COLORS.info}
            iconText="🔥"
            style={styles.statCard}
          />
        </View>
      </View>

      {/* Phân tích theo phòng ban */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hiệu suất theo phòng ban</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.colHeader, { flex: 1.5 }]}>Phòng ban</Text>
          <Text style={[styles.colHeader, styles.colCenter]}>Lượt</Text>
          <Text style={[styles.colHeader, styles.colCenter]}>Đúng giờ</Text>
          <Text style={[styles.colHeader, styles.colRight]}>Tổng giờ</Text>
        </View>

        {Object.keys(deptStats).length === 0 ? (
          <Text style={styles.emptyText}>Chưa có dữ liệu theo phòng ban.</Text>
        ) : (
          Object.entries(deptStats).map(([dept, stats]) => {
            const deptRate = stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0;
            return (
              <View key={dept} style={styles.tableRow}>
                <Text style={[styles.rowText, styles.deptName, { flex: 1.5 }]}>{dept}</Text>
                <Text style={[styles.rowText, styles.colCenter]}>{stats.total}</Text>
                <Text
                  style={[
                    styles.rowText,
                    styles.colCenter,
                    { color: deptRate >= 80 ? COLORS.success : COLORS.warning, fontWeight: '700' },
                  ]}
                >
                  {deptRate}%
                </Text>
                <Text style={[styles.rowText, styles.colRight]}>
                  {Math.round(stats.hours * 10) / 10}h
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Ghi chú Data Contract */}
      <View style={styles.complianceBox}>
        <Text style={styles.complianceTitle}>🔒 Tuân thủ Data Contract:</Text>
        <Text style={styles.complianceText}>
          Báo cáo được tính toán trực tiếp in-memory từ node `attendance` và `employees`. Tuyệt đối không tạo node `/reports` giả mạo trên Firebase RTDB.
        </Text>
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
  exportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  exportTextCol: {
    flex: 1,
    marginRight: 12,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: 4,
  },
  exportDesc: {
    fontSize: 12,
    color: COLORS.slate500,
    lineHeight: 16,
  },
  exportBtn: {
    paddingHorizontal: 16,
  },
  metricsContainer: {
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginBottom: 0,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate900,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    paddingBottom: 8,
    marginBottom: 6,
  },
  colHeader: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  colCenter: {
    textAlign: 'center',
  },
  colRight: {
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  rowText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.slate700,
  },
  deptName: {
    fontWeight: '600',
    color: COLORS.slate900,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.slate400,
    textAlign: 'center',
    paddingVertical: 16,
  },
  complianceBox: {
    backgroundColor: COLORS.slate100,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.slate400,
  },
  complianceTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
    marginBottom: 2,
  },
  complianceText: {
    fontSize: 11,
    color: COLORS.slate500,
    lineHeight: 16,
  },
  loadingCenter: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.slate500,
    fontWeight: '500',
  },
});

