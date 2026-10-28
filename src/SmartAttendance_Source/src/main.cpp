/*
 * ESP32 + AS608 - Chấm công & đăng ký vân tay qua Firebase Realtime Database
 *
 * main.cpp chỉ khởi tạo và nối các module với nhau:
 *   Indicator             LED xanh / đỏ + còi
 *   WiFiService           kết nối / nối lại WiFi
 *   NtpClock              giờ thật từ internet (UTC+7)
 *   FirebaseREST          HTTP client cho Firebase RTDB
 *   FingerprintSensor     điều khiển cảm biến AS608
 *   EnrollmentRepository  đọc/ghi /enrollment_requests
 *   EnrollmentService     đăng ký vân tay: PENDING -> PROCESSING -> SUCCESS/FAILED
 *   HrRepository          đọc /employees, /shifts; ghi /attendance/{ngày}/{employeeId}
 *   AttendanceProcessor   nghiệp vụ: vân tay -> nhân viên -> ca -> vào/ra ca, trễ/sớm/tăng ca
 *   AttendanceRepository  nhật ký thô /attendance_logs
 *   AttendanceService     vòng quét chấm công + phản hồi LED/còi
 */

#include <Arduino.h>

#include "AttendanceProcessor.h"
#include "AttendanceRepository.h"
#include "AttendanceRules.h"
#include "AttendanceService.h"
#include "Config.h"
#include "EnrollmentRepository.h"
#include "EnrollmentService.h"
#include "FingerprintSensor.h"
#include "FirebaseREST.h"
#include "HrRepository.h"
#include "Indicator.h"
#include "Log.h"
#include "NtpClock.h"
#include "Settings.h"
#include "WiFiService.h"
#include "DeletionService.h"

namespace {
constexpr char TAG[] = "Main";

Indicator indicator;
WiFiService wifi;
NtpClock ntpClock;
FirebaseREST firebase(FIREBASE_HOST, Settings::FIREBASE_AUTH);
FingerprintSensor sensor(Serial2);

EnrollmentRepository repository(firebase, DEVICE_ID);
EnrollmentService enrollment(repository, sensor, indicator, wifi);

HrRepository hr(firebase);
AttendanceRepository attRepo(firebase, DEVICE_ID);
AttendanceProcessor attendanceProcessor(hr, ntpClock);
AttendanceService attendance(attRepo, attendanceProcessor, sensor, indicator, wifi);
DeletionService deletion(firebase, sensor, indicator, DEVICE_ID);

uint32_t lastPollMs = 0;

// --- THÊM 1: KHAI BÁO CÁC HÀM TIỆN ÍCH CHO SERIAL ---
void checkStoredFingerprints();
void processSerialCommands();
void syncDeletedFingerprints();
// ----------------------------------------------------

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  LOG_I(TAG, "=== ESP32 Fingerprint Attendance ===");
  LOG_I(TAG, "Device ID: %s", DEVICE_ID);

  indicator.begin();

  // 1) Cảm biến vân tay
  sensor.begin(FINGERPRINT_BAUD, PIN_FINGERPRINT_RX, PIN_FINGERPRINT_TX, FINGERPRINT_CAPACITY);
  while (!sensor.probe()) {
    LOG_E(TAG, "Fingerprint sensor not found - check wiring (TX/RX, power)");
    indicator.showSensorError();
    delay(2000);
  }
  indicator.off();
  LOG_I(TAG, "Sensor OK. Capacity=%u, stored templates=%u", (unsigned)sensor.capacity(),
        (unsigned)sensor.storedTemplates());

  // --- THÊM 2: GỌI HÀM KIỂM TRA ID NGAY SAU KHI SENSOR OK ---
  checkStoredFingerprints();
  // ---------------------------------------------------------

  // 2) WiFi + Firebase
  while (!wifi.connect(WIFI_SSID, WIFI_PASSWORD, Settings::WIFI_CONNECT_TIMEOUT_MS)) {
    delay(1000);
  }
  firebase.begin();

  syncDeletedFingerprints(); 
  // 3) Giờ thật (NTP) - cần để tính giờ vào/ra, đi trễ, tăng ca
  ntpClock.begin();
  ntpClock.waitForSync(AttendanceRules::NTP_SYNC_TIMEOUT_MS);

  // 4) Dọn request đăng ký bị kẹt PROCESSING từ lần chạy trước
  if (Settings::FAIL_STALE_PROCESSING_ON_BOOT) {
    enrollment.recoverStaleRequests();
  }

  indicator.showReady();
  LOG_I(TAG, "Ready. Scanning fingerprints + waiting for enrollment requests...");

  // --- THÊM 3: IN MENU HƯỚNG DẪN XÓA SERIAL ---
  Serial.println("\n--- LENH SERIAL ---");
  Serial.println("Nhap -999 de xoa TOAN BO van tay tren cam bien.");
  Serial.println("Nhap so am (VD: -5) de xoa ID so 5.");
  Serial.println("-------------------\n");
  // ---------------------------------------------
}

void loop() {
  if (!wifi.ensureConnected(Settings::WIFI_CONNECT_TIMEOUT_MS)) {
    delay(1000);
    return;
  }

  // --- THÊM 4: LẮNG NGHE LỆNH TỪ SERIAL ---
  processSerialCommands();
  // ---------------------------------------

  const uint32_t now = millis();
  if (now - lastPollMs >= ENROLLMENT_POLL_INTERVAL_MS) {
    lastPollMs = now;
    enrollment.poll();
    deletion.poll();
  }
  attendance.poll();

  delay(10);
}

namespace {
// --- THÊM 5: ĐỊNH NGHĨA CÁC HÀM TIỆN ÍCH SERIAL ---

void checkStoredFingerprints() {
  Serial.println("\n--- KIEM TRA BO NHO CAM BIEN ---");
  
  uint16_t count = sensor.storedTemplates();
  if (count == 0) {
    Serial.println("Bo nho trong! Chua co van tay nao.");
    Serial.println("--------------------------------\n");
    return;
  }

  Serial.print("Dang luu "); Serial.print(count); Serial.println(" van tay.");
  Serial.print("Danh sach ID: ");

  uint16_t found = 0;
  // Quét toàn bộ dung lượng (thường là 127, 256 hoặc 300)
  for (uint16_t id = 1; id <= sensor.capacity(); id++) {
    // Gọi hàm loadTemplate vừa tạo để kiểm tra ID này
    if (sensor.loadTemplate(id)) {
      Serial.print(id);
      Serial.print(" ");
      found++;
      
      // Nếu đã tìm thấy đủ số lượng thì thoát vòng lặp cho nhanh
      if (found >= count) {
        break;
      }
    }
  }
  Serial.println("\n--------------------------------\n");
}

void processSerialCommands() {
  if (Serial.available() > 0) {
    int input = Serial.parseInt();
    while (Serial.available() > 0) {
      Serial.read(); // Xóa buffer
    }

    if (input == -999) {
      LOG_I(TAG, "DANG XOA TOAN BO VAN TAY...");
      // LƯU Ý: Lệnh emptyDatabase() cần được hỗ trợ trong FingerprintSensor.h
      if (sensor.emptyDatabase()) {
        LOG_I(TAG, "Da xoa sach van tay!");
        indicator.showSuccess();
      } else {
        LOG_E(TAG, "Xoa that bai!");
        indicator.showSensorError();
      }
    } else if (input < 0) {
      uint16_t idToDelete = abs(input);
      LOG_I(TAG, "Dang xoa van tay ID #%d", idToDelete);
      // LƯU Ý: Lệnh deleteTemplate(id) cần được hỗ trợ trong FingerprintSensor.h
      if (sensor.deleteTemplate(idToDelete)) {
        LOG_I(TAG, "Da xoa van tay ID #%d thanh cong!", idToDelete);
        indicator.showSuccess();
      } else {
        LOG_E(TAG, "Khong the xoa van tay ID #%d!", idToDelete);
        indicator.showSensorError();
      }
    }
  }
}
// -------------------------------------------------
void syncDeletedFingerprints() {
  LOG_I(TAG, "Dang kiem tra danh sach nhan vien tren Firebase de don dep van tay...");

  const HttpResult res = firebase.get("/employees");
  if (!res.ok()) {
    LOG_W(TAG, "Khong the tai /employees de dong bo: HTTP %d", res.code);
    return;
  }

  JsonDocument doc;
  if (deserializeJson(doc, res.body)) {
    LOG_E(TAG, "Loi parse JSON /employees");
    return;
  }

  // Thu thập tất cả fingerprintId đang còn hiệu lực trên Firebase
  bool activeIds[301] = {false};
  if (doc.is<JsonObject>()) {
    for (JsonPair kv : doc.as<JsonObject>()) {
      JsonObject emp = kv.value().as<JsonObject>();
      if (!emp.isNull() && emp["fingerprintId"].is<int>()) {
        int fid = emp["fingerprintId"].as<int>();
        if (fid >= 1 && fid <= 300) {
          activeIds[fid] = true;
        }
      }
    }
  }

  // Quét từng slot của AS608, slot nào có trên cảm biến mà không có trên Firebase thì xóa
  uint16_t deletedCount = 0;
  for (uint16_t id = 1; id <= sensor.capacity(); id++) {
    if (sensor.loadTemplate(id)) {
      if (!activeIds[id]) {
        LOG_W(TAG, "Van tay ID #%u khong con tren Firebase -> Tu dong xoa!", id);
        if (sensor.deleteTemplate(id)) {
          deletedCount++;
        }
      }
    }
  }

  if (deletedCount > 0) {
    LOG_I(TAG, "Da don dep tong cong %u van tay vo chu!", deletedCount);
  } else {
    LOG_I(TAG, "Bo nho cam bien hoan toan dong bo voi Firebase.");
  }
}

} // kết thúc namespace