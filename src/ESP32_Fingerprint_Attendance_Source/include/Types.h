#pragma once
#include <Arduino.h>
#include <string.h>

// Các giá trị status theo Data Contract. KHÔNG đổi tên chuỗi.
enum class EnrollmentStatus : uint8_t {
  Unknown,
  Pending,
  Processing,
  Success,
  Failed,
  Cancelled
};

inline const char* toString(EnrollmentStatus status) {
  switch (status) {
    case EnrollmentStatus::Pending:    return "PENDING";
    case EnrollmentStatus::Processing: return "PROCESSING";
    case EnrollmentStatus::Success:    return "SUCCESS";
    case EnrollmentStatus::Failed:     return "FAILED";
    case EnrollmentStatus::Cancelled:  return "CANCELLED";
    default:                           return "UNKNOWN";
  }
}

inline EnrollmentStatus parseStatus(const char* text) {
  if (text == nullptr) return EnrollmentStatus::Unknown;
  if (strcmp(text, "PENDING") == 0)    return EnrollmentStatus::Pending;
  if (strcmp(text, "PROCESSING") == 0) return EnrollmentStatus::Processing;
  if (strcmp(text, "SUCCESS") == 0)    return EnrollmentStatus::Success;
  if (strcmp(text, "FAILED") == 0)     return EnrollmentStatus::Failed;
  if (strcmp(text, "CANCELLED") == 0)  return EnrollmentStatus::Cancelled;
  return EnrollmentStatus::Unknown;
}

// Một request đăng ký vân tay (chỉ giữ các field ESP32 cần đọc)
struct EnrollmentRequest {
  String id;          // Firebase key: /enrollment_requests/{id}
  String employeeId;
};
