/**
 * DATA MAPPERS
 * Ánh xạ dữ liệu từ Firebase schema sang mô hình giao diện (UI)
 * Giữ nguyên giá trị Firebase gốc theo Data Contract mục 5.4
 */
import { COLORS } from '../constants/colors';
import { EnrollmentStatus } from '../types/enrollment';

export interface StatusBadgeInfo {
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Mapper trạng thái chấm công từ Firebase ('on-time', 'late', ...) sang UI
 */
export function mapAttendanceStatus(status?: string | null): StatusBadgeInfo {
  if (!status) {
    return {
      label: 'Chưa rõ',
      color: COLORS.slate500,
      bgColor: COLORS.slate100,
    };
  }

  const normalized = status.toLowerCase().trim();

  switch (normalized) {
    case 'on-time':
    case 'on_time':
      return {
        label: 'Đúng giờ',
        color: COLORS.success,
        bgColor: COLORS.successBg,
      };
    case 'late':
      return {
        label: 'Đi muộn',
        color: COLORS.warning,
        bgColor: COLORS.warningBg,
      };
    case 'absent':
      return {
        label: 'Vắng mặt',
        color: COLORS.danger,
        bgColor: COLORS.dangerBg,
      };
    case 'early_leave':
    case 'early-leave':
      return {
        label: 'Về sớm',
        color: COLORS.warningLight,
        bgColor: COLORS.warningBg,
      };
    default:
      return {
        label: status,
        color: COLORS.slate600,
        bgColor: COLORS.slate100,
      };
  }
}

/**
 * Mapper trạng thái đăng ký vân tay (EnrollmentStatus)
 */
export function mapEnrollmentStatus(status: EnrollmentStatus): StatusBadgeInfo {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Đang chờ ESP32...',
        color: COLORS.warning,
        bgColor: COLORS.warningBg,
      };
    case 'PROCESSING':
      return {
        label: 'Đang quét vân tay...',
        color: COLORS.info,
        bgColor: COLORS.infoBg,
      };
    case 'SUCCESS':
      return {
        label: 'Đăng ký thành công',
        color: COLORS.success,
        bgColor: COLORS.successBg,
      };
    case 'FAILED':
      return {
        label: 'Đăng ký thất bại',
        color: COLORS.danger,
        bgColor: COLORS.dangerBg,
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        color: COLORS.slate500,
        bgColor: COLORS.slate100,
      };
    default:
      return {
        label: status,
        color: COLORS.slate500,
        bgColor: COLORS.slate100,
      };
  }
}

/**
 * Mapper trạng thái hoạt động của nhân viên
 */
export function mapActiveStatus(active: boolean): StatusBadgeInfo {
  return active
    ? {
        label: 'Đang làm việc',
        color: COLORS.success,
        bgColor: COLORS.successBg,
      }
    : {
        label: 'Đã khóa',
        color: COLORS.danger,
        bgColor: COLORS.dangerBg,
      };
}

