#pragma once
#include <Arduino.h>

#include "FirebaseREST.h"
#include "Types.h"

// Truy cập /enrollment_requests theo đúng Data Contract.
// Toàn bộ tên node / field / giá trị status của Firebase nằm ở lớp này.
class EnrollmentRepository {
 public:
  EnrollmentRepository(FirebaseREST& firebase, const char* deviceId);

  // Tìm request cũ nhất có `status` = wanted VÀ deviceId trùng thiết bị này
  bool findFirst(EnrollmentStatus wanted, EnrollmentRequest& out);

  // Đọc status hiện tại của 1 request (Unknown nếu lỗi mạng / dữ liệu)
  EnrollmentStatus readStatus(const String& requestId);

  // PENDING -> PROCESSING. Kiểm tra lại status ngay trước khi ghi
  // để không bao giờ đè lên CANCELLED.
  bool markProcessing(const String& requestId);

  // SUCCESS + fingerprintId (number)
  bool markSuccess(const String& requestId, uint16_t fingerprintId);

  // FAILED + fingerprintId = null
  bool markFailed(const String& requestId, const char* errorMessage);

 private:
  FirebaseREST& _firebase;
  const char* _deviceId;
};
