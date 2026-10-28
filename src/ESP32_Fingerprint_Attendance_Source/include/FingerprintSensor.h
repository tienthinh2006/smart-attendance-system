#pragma once
#include <Adafruit_Fingerprint.h>
#include <Arduino.h>

#include <functional>

// Các bước trong quá trình đăng ký (để lớp trên hiển thị hướng dẫn / phản hồi)
enum class EnrollStep : uint8_t {
  PlaceFinger,
  RemoveFinger,
  PlaceFingerAgain,
  FingerCaptured
};

enum class EnrollError : uint8_t {
  None,
  SensorCommunication,
  StorageFull,
  TimeoutFirstScan,
  TimeoutRemoval,
  TimeoutSecondScan,
  ScanMismatch,
  ModelCreationFailed,
  StoreFailed
};

inline const char* toString(EnrollError error) {
  switch (error) {
    case EnrollError::None:                return "OK";
    case EnrollError::SensorCommunication: return "Sensor communication error";
    case EnrollError::StorageFull:         return "Sensor storage is full";
    case EnrollError::TimeoutFirstScan:    return "Timeout on first scan";
    case EnrollError::TimeoutRemoval:      return "Finger was not removed";
    case EnrollError::TimeoutSecondScan:   return "Timeout on second scan";
    case EnrollError::ScanMismatch:        return "Two scans did not match";
    case EnrollError::ModelCreationFailed: return "Cannot create fingerprint model";
    case EnrollError::StoreFailed:         return "Cannot store fingerprint on sensor";
    default:                               return "Unknown error";
  }
}

struct EnrollOutcome {
  EnrollError error = EnrollError::None;
  uint16_t id = 0;  // ID thật do cảm biến lưu (chỉ có ý nghĩa khi ok())
  bool ok() const { return error == EnrollError::None; }
};

// Bọc thư viện Adafruit Fingerprint cho cảm biến AS608.
// Lớp này chỉ làm việc với phần cứng, không biết gì về Firebase.
class FingerprintSensor {
 public:
  bool emptyDatabase();
  bool loadTemplate(uint16_t id);
  bool deleteTemplate(uint16_t id);
  using StepListener = std::function<void(EnrollStep)>;

  explicit FingerprintSensor(HardwareSerial& serial);

  // Mở UART. Gọi một lần trong setup().
  void begin(uint32_t baud, int rxPin, int txPin, uint16_t fallbackCapacity);

  // Kiểm tra cảm biến có phản hồi không (có thể gọi lặp lại), đồng thời đọc thông số
  bool probe();

  uint16_t capacity() const;
  uint16_t storedTemplates() const { return _finger.templateCount; }

  int search();
  
  // Đăng ký 1 vân tay vào slot trống đầu tiên. Chặn cho tới khi xong hoặc lỗi.
  EnrollOutcome enroll(uint32_t stepTimeoutMs, const StepListener& listener);

 private:
  int findFreeSlot();
  bool captureToBuffer(uint8_t bufferId, uint32_t timeoutMs, const StepListener& listener);
  bool waitForRemoval(uint32_t timeoutMs);
  static void notify(const StepListener& listener, EnrollStep step);

  HardwareSerial& _serial;
  Adafruit_Fingerprint _finger;
  uint16_t _fallbackCapacity = 127;
};
