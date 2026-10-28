#pragma once
#include <Arduino.h>
#include "FirebaseREST.h"
#include "FingerprintSensor.h"
#include "Indicator.h"

class DeletionService {
 public:
  DeletionService(FirebaseREST& firebase, FingerprintSensor& sensor, 
                  Indicator& indicator, const char* deviceId);

  // Gọi định kỳ trong loop()
  void poll();

 private:
  FirebaseREST& _firebase;
  FingerprintSensor& _sensor;
  Indicator& _indicator;
  const char* _deviceId;

  bool processRequest(const String& requestId, uint16_t fingerprintId);
};