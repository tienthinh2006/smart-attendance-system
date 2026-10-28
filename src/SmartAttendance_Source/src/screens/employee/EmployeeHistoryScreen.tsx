import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  subscribeEmployeeAttendance,
  getAttendanceRangeStart,
  EmployeeAttendanceRecord,
  AttendanceFilterMode,
} from '../../services/firebase/employeeAppService';

interface EmployeeHistoryScreenProps {
  employeeId: string;
  onBack: () => void;
}

const FILTERS: { key: AttendanceFilterMode; label: string }[] = [
  { key: 'TODAY', label: 'Hôm nay' },
  { key: 'WEEK', label: 'Tuần này' },
  { key: 'MONTH', label: 'Tháng này' },
  { key: 'ALL', label: 'Tất cả' },
];

export const EmployeeHistoryScreen: React.FC<EmployeeHistoryScreenProps> = ({
  employeeId,
  onBack,
}) => {
  const [history, setHistory] = useState<EmployeeAttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [filterMode, setFilterMode] = useState<AttendanceFilterMode>('ALL');

  useEffect(() => {
    const unsub = subscribeEmployeeAttendance(
      employeeId,
      records => {
        setHistory(records);
        setLoading(false);
        setErrorMsg('');
      },
      err => {
        setErrorMsg('Lỗi đọc dữ liệu chấm công: ' + err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [employeeId]);

  const startTs = getAttendanceRangeStart(filterMode);
  const filteredRecords =
    startTs !== null
      ? history.filter(r => r.timestamp >= startTs)
      : history;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Lịch sử chấm công</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilterMode(f.key)}
            style={[
              styles.filterChip,
              filterMode === f.key && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                filterMode === f.key && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMsg !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isLate = (item.status || '').toLowerCase() === 'late';
            return (
              <View style={styles.recordItem}>
                <View>
                  <Text style={styles.dateText}>Ngày: {item.dateKey}</Text>
                  <Text
                    style={[
                      styles.statusText,
                      { color: isLate ? '#dc3545' : '#28a745' },
                    ]}
                  >
                    Trạng thái: {isLate ? 'Đi trễ' : 'Đúng giờ'}
                  </Text>
                </View>
                <View style={styles.timesCol}>
                  <Text style={styles.checkInText}>
                    VÀO: {item.checkIn || '--:--:--'}
                  </Text>
                  <Text style={styles.checkOutText}>
                    RA: {item.checkOut || '--:--:--'}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Không có dữ liệu chấm công trong khoảng thời gian này.
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterRow: {
    flexDirection: 'row',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  errorBox: {
    padding: 12,
    backgroundColor: '#ffcccc',
    marginBottom: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 13,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dateText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  timesCol: {
    alignItems: 'flex-end',
  },
  checkInText: {
    color: '#28a745',
    fontWeight: 'bold',
    fontSize: 14,
  },
  checkOutText: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontStyle: 'italic',
    fontSize: 14,
  },
});

