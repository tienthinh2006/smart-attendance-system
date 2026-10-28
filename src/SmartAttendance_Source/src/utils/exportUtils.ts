/**
 * EXPORT UTILITY FUNCTIONS
 * Xuất dữ liệu báo cáo dạng CSV (có UTF-8 BOM cho Excel) và kích hoạt Native Share
 * Tuân thủ Master Prompt mục 15: trong phạm vi dependency hiện tại.
 */
import { Share, Alert } from 'react-native';
import { AttendanceRecord } from '../types/attendance';
import { Employee } from '../types/employee';

/**
 * Tạo file CSV từ danh sách chấm công kết hợp thông tin nhân viên
 */
export function generateAttendanceCSV(
  records: AttendanceRecord[],
  employeesMap: Record<string, Employee>
): string {
  // UTF-8 BOM để Excel trên Windows hiển thị đúng tiếng Việt
  const BOM = '\uFEFF';
  const headers = [
    'Mã NV',
    'Họ và Tên',
    'Phòng ban',
    'Chức vụ',
    'Ngày',
    'Giờ vào',
    'Giờ ra',
    'Trạng thái',
    'Ca làm',
    'Đi muộn (phút)',
    'Về sớm (phút)',
    'Giờ làm',
    'Tăng ca (giờ)',
    'Ghi chú',
  ];

  const rows = records.map(r => {
    const emp = employeesMap[r.employeeId];
    const name = emp ? emp.name : r.employeeId;
    const dept = emp ? emp.department : '';
    const pos = emp?.position || '';
    const date = r.timestamp ? r.timestamp.slice(0, 10) : '';

    return [
      `"${r.employeeId}"`,
      `"${name.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      `"${pos.replace(/"/g, '""')}"`,
      `"${date}"`,
      `"${r.checkIn || '—'}"`,
      `"${r.checkOut || '—'}"`,
      `"${r.status || '—'}"`,
      `"${r.shiftName || r.shiftId || '—'}"`,
      `"${r.lateMinutes ?? 0}"`,
      `"${r.earlyMinutes ?? 0}"`,
      `"${r.workingHours ?? 0}"`,
      `"${r.overtimeHours ?? 0}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  return BOM + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Kích hoạt chia sẻ tệp/nội dung CSV thông qua React Native Share API
 */
export async function shareCSV(csvContent: string, filename = 'attendance_report.csv'): Promise<void> {
  try {
    await Share.share({
      title: filename,
      message: csvContent,
    });
  } catch (error: any) {
    Alert.alert('Lỗi xuất file', error.message || 'Không thể chia sẻ file báo cáo.');
  }
}

