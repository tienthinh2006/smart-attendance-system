#include "Indicator.h"

#include "Config.h"

void Indicator::begin() {
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  off();
}

void Indicator::off() { setLeds(false, false); }

void Indicator::showReady() { beep(60); }

void Indicator::showBusy() { setLeds(true, false); }

void Indicator::showFingerRead() { beep(80); }

void Indicator::showSuccess() {
  setLeds(true, false);
  beep(100);
  delay(100);
  beep(100);
  delay(800);
  off();
}

void Indicator::showFailure() {
  setLeds(false, true);
  beep(700);
  delay(300);
  off();
}

void Indicator::showSensorError() { setLeds(false, true); }

void Indicator::setLeds(bool green, bool red) {
  digitalWrite(PIN_LED_GREEN, green ? HIGH : LOW);
  digitalWrite(PIN_LED_RED, red ? HIGH : LOW);
}

void Indicator::beep(uint16_t durationMs) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(durationMs);
  digitalWrite(PIN_BUZZER, LOW);
}
