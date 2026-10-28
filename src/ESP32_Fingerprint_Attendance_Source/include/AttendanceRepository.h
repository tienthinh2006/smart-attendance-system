#pragma once
#include "FirebaseREST.h"
#include <ArduinoJson.h>

class AttendanceRepository {
public:
  AttendanceRepository(FirebaseREST& firebase, const char* deviceId);
  bool logAttendance(uint16_t fingerprintId);

private:
  FirebaseREST& _firebase;
  const char* _deviceId;
};