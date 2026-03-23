#pragma once

#include <Arduino.h>
#include "BackendClient.h"
#include "Config.h"
#include "HardwareContext.h"
#include "Indicators.h"
#include "Sensors.h"
#include "State.h"

inline void rotateToSlot(int slot) {
  if (slot < 1 || slot > SLOT_COUNT) {
    return;
  }

  wheelServo.write(SLOT_ANGLES[slot - 1]);
  deviceState.currentSlot = slot;
  delay(1200);
}

inline void pulseActuatorForSlot(int slot, int offset) {
  wheelServo.write(SLOT_ANGLES[slot - 1] + offset);
  delay(700);
  wheelServo.write(SLOT_ANGLES[slot - 1]);
  delay(500);
}

inline bool waitForPickup(unsigned long timeoutMs) {
  unsigned long startedAt = millis();

  while (millis() - startedAt < timeoutMs) {
    if (pickupConfirmed()) {
      digitalWrite(GREEN_LED_PIN, HIGH);
      sendDeviceEvent("pickup_confirmed", deviceState.currentSlot, "IR + load cell confirmed pickup.");
      delay(1200);
      setIdleLights();
      return true;
    }
    delay(250);
  }

  return false;
}

inline bool dispenseFlow(int slot) {
  deviceState.isDispensing = true;
  pulseBuzzer(2, 160);

  if (!authorizeFingerprint()) {
    digitalWrite(RED_LED_PIN, HIGH);
    pulseBuzzer(4, 220);
    sendDeviceEvent("unauthorized", slot, "Fingerprint authorization failed.");
    deviceState.isDispensing = false;
    delay(1200);
    setIdleLights();
    return false;
  }

  rotateToSlot(slot);
  pulseActuatorForSlot(slot, 10);
  sendDeviceEvent("dispensed", slot, "Primary dispense action completed.");
  pulseBuzzer(3, 140);

  if (waitForPickup(PICKUP_TIMEOUT_MS)) {
    deviceState.isDispensing = false;
    deviceState.activeScheduleIds = "[]";
    return true;
  }

  sendDeviceEvent("stuck_retry", slot, "Pickup not confirmed. Running retry pulse.");
  pulseActuatorForSlot(slot, 12);

  if (waitForPickup(RETRY_TIMEOUT_MS)) {
    deviceState.isDispensing = false;
    deviceState.activeScheduleIds = "[]";
    return true;
  }

  digitalWrite(RED_LED_PIN, HIGH);
  pulseBuzzer(5, 200);
  sendDeviceEvent("missed", slot, "No pickup confirmation after retry.");
  deviceState.isDispensing = false;
  deviceState.activeScheduleIds = "[]";
  delay(1500);
  setIdleLights();
  return false;
}
