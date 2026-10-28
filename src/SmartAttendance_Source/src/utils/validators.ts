/**
 * DATA VALIDATORS
 * Tuân thủ quy định Data Contract & Master Prompt
 */

/**
 * Validate định dạng thời gian HH:mm (24-hour)
 */
export function isValidTime(time: string): boolean {
  if (!time) return false;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time.trim());
}

/**
 * Validate định dạng email
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate số điện thoại (Việt Nam)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^0\d{9,10}$/;
  return phoneRegex.test(phone.trim().replace(/\s+/g, ''));
}

/**
 * Validate Employee ID (chữ, số, gạch dưới)
 */
export function isValidEmployeeId(id: string): boolean {
  if (!id) return false;
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  return idRegex.test(id.trim());
}

/**
 * Loại bỏ triệt để các thuộc tính `undefined` trước khi gửi lên Firebase RTDB
 * Quy tắc: Không ghi undefined vào RTDB
 */
export function cleanPayload<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanPayload(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

