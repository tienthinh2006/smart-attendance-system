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
  subscribeEmployeeShifts,
  EmployeeShiftRecord,
  EmployeeAssignedShift,
} from '../../services/firebase/employeeAppService';

interface EmployeeShiftsScreenProps {
  employeeId: string;
  uid?: string;
  onBack: () => void;
}

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

export const EmployeeShiftsScreen: React.FC<EmployeeShiftsScreenProps> = ({
  employeeId,
  uid,
  onBack,
}) => {
  const [shifts, setShifts] = useState<EmployeeShiftRecord[]>([]);
  const [assignedShift, setAssignedShift] = useState<EmployeeAssignedShift | null>(null);
  const [defaultShiftName, setDefaultShiftName] = useState<string>('Chưa phân ca');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeEmployeeShifts(
      employeeId,
      (records, defName, shiftObj) => {
        setShifts(records);
        setDefaultShiftName(defName);
        setAssignedShift(shiftObj);
        setLoading(false);
        setErrorMsg('');
      },
      err => {
        setErrorMsg('Lỗi tải dữ liệu ca làm việc: ' + (err?.message || err));
        setLoading(false);
      },
      uid
    );

    return unsub;
  }, [employeeId, uid]);

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const isAssigned = !!assignedShift && defaultShiftName !== 'Chưa phân ca';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Ca làm việc</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Thông tin ca làm việc phân công */}
      {loading ? (
        <View style={styles.defaultShiftCard}>
          <ActivityIndicator size="small" color="#007BFF" />
          <Text style={styles.loadingShiftText}>Đang tải thông tin ca làm việc...</Text>
        </View>
      ) : isAssigned ? (
        <View style={[styles.defaultShiftCard, styles.defaultShiftCardAssigned]}>
          <View style={styles.cardTopRow}>
            <Text style={styles.defaultShiftLabel}>Ca làm việc được phân công</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Đang áp dụng</Text>
            </View>
          </View>

          <Text style={styles.defaultShiftValue}>
            {assignedShift?.name || defaultShiftName}
          </Text>

          {assignedShift?.startTime && assignedShift?.endTime ? (
            <View style={styles.timeHighlightBox}>
              <Text style={styles.timeHighlightText}>
                ⏰ {assignedShift.startTime} – {assignedShift.endTime}
              </Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Mã ca: <Text style={styles.boldText}>{assignedShift?.id}</Text>
            </Text>
            {assignedShift?.gracePeriodMinutes !== undefined && (
              <Text style={styles.metaText}>
                ⏱ Cho phép trễ:{' '}
                <Text style={styles.boldText}>{assignedShift.gracePeriodMinutes} phút</Text>
              </Text>
            )}
          </View>

          {assignedShift?.description ? (
            <Text style={styles.descriptionText}>{assignedShift.description}</Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.defaultShiftCard, styles.defaultShiftCardUnassigned]}>
          <Text style={styles.defaultShiftLabel}>Ca làm việc phân công</Text>
          <Text style={styles.unassignedTitle}>Chưa phân ca</Text>
          <Text style={styles.unassignedSub}>
            Hiện tại bạn chưa được phân công ca làm việc. Vui lòng liên hệ Admin để được xếp ca.
          </Text>
        </View>
      )}

      {errorMsg !== '' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isToday = item.date === todayStart;
            return (
              <View style={[styles.shiftCard, isToday && styles.shiftCardToday]}>
                <Text style={styles.shiftDate}>
                  {formatDate(item.date)}
                  {isToday ? '  •  Hôm nay' : ''}
                </Text>
                <Text style={styles.shiftTime}>
                  {item.startTime} - {item.endTime}
                </Text>
                {item.note ? (
                  <Text style={styles.shiftNote}>{item.note}</Text>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Không có lịch ca làm việc bổ sung nào.
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
  defaultShiftCard: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  defaultShiftLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  defaultShiftValue: {
    fontSize: 22,
    color: '#007BFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  defaultShiftCardAssigned: {
    borderColor: '#b8daff',
    backgroundColor: '#fff',
    borderLeftWidth: 6,
    borderLeftColor: '#007BFF',
    alignItems: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  defaultShiftCardUnassigned: {
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    borderLeftWidth: 6,
    borderLeftColor: '#94a3b8',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeBadge: {
    backgroundColor: '#e6f4ea',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#b7e1cd',
  },
  activeBadgeText: {
    color: '#137333',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingShiftText: {
    marginTop: 10,
    fontSize: 13,
    color: '#666',
  },
  timeHighlightBox: {
    backgroundColor: '#f0f7ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  timeHighlightText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0056b3',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#555',
  },
  boldText: {
    fontWeight: '700',
    color: '#333',
  },
  descriptionText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 6,
  },
  unassignedTitle: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  unassignedSub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
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
  shiftCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  shiftCardToday: {
    borderColor: '#007BFF',
    backgroundColor: '#eef6ff',
    borderWidth: 2,
  },
  shiftDate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 17,
    color: '#007BFF',
    fontWeight: '700',
    marginBottom: 6,
  },
  shiftNote: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontStyle: 'italic',
    fontSize: 14,
  },
});

