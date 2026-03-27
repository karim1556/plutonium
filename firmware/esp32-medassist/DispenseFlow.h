#pragma once

#include <Arduino.h>
#include "BackendClient.h"
#include "Config.h"
#include "HardwareContext.h"
#include "Indicators.h"
#include "Sensors.h"
#include "State.h"

inline void attachServosIfEnabled() {
  if (!SERVO_OUTPUT_ENABLED) {
    return;
  }

  if (!deviceState.wheelAttached) {
    wheelServo.setPeriodHertz(50);
    const int wheelChannel = wheelServo.attach(WHEEL_SERVO_PIN, 500, 2400);
    deviceState.wheelAttached = wheelChannel >= 0;

    if (!deviceState.wheelAttached) {
      deviceState.lastStatus = "Wheel attach fail";
    }
  }

  if (!deviceState.doorAttached) {
    doorServo.setPeriodHertz(50);
    const int doorChannel = doorServo.attach(DOOR_SERVO_PIN, 500, 2400);
    deviceState.doorAttached = doorChannel >= 0;

    if (!deviceState.doorAttached) {
      deviceState.lastStatus = "Door attach fail";
    }
  }

  if (FLAP_SERVO_ENABLED && !deviceState.flapAttached) {
    flapServo.setPeriodHertz(50);
    const int flapChannel = flapServo.attach(FLAP_SERVO_PIN, 500, 2400);
    deviceState.flapAttached = flapChannel >= 0;

    if (!deviceState.flapAttached) {
      deviceState.lastStatus = "Flap attach fail";
    }
  }
}

inline void moveWheelToAngle(int angle) {
  attachServosIfEnabled();

  if (!deviceState.wheelAttached) {
    return;
  }

  wheelServo.write(constrain(angle, WHEEL_SERVO_MIN_ANGLE, WHEEL_SERVO_MAX_ANGLE));
  delay(WHEEL_SETTLE_MS);
}

inline void moveDoorToAngle(int angle) {
  attachServosIfEnabled();

  if (!deviceState.doorAttached) {
    return;
  }

  doorServo.write(constrain(angle, DOOR_SERVO_MIN_ANGLE, DOOR_SERVO_MAX_ANGLE));
  delay(DOOR_TRAVEL_MS);
}

inline void moveFlapToAngle(int angle) {
  if (!FLAP_SERVO_ENABLED) {
    return;
  }

  attachServosIfEnabled();

  if (!deviceState.flapAttached) {
    return;
  }

  flapServo.write(constrain(angle, FLAP_SERVO_MIN_ANGLE, FLAP_SERVO_MAX_ANGLE));
  delay(FLAP_TRAVEL_MS);
}

inline void rotateToSlot(int slot) {
  if (slot < 1 || slot > SLOT_COUNT) {
    return;
  }

  deviceState.currentSlot = slot;
  moveWheelToAngle(SLOT_ANGLES[slot - 1]);
}

inline void closeDoor() {
  moveDoorToAngle(DOOR_CLOSED_ANGLE);
  deviceState.doorOpen = false;
}

inline void openDoor() {
  moveDoorToAngle(DOOR_OPEN_ANGLE);
  deviceState.doorOpen = true;
}

inline void closeFlap() {
  if (!FLAP_SERVO_ENABLED) {
    return;
  }

  moveFlapToAngle(FLAP_CLOSED_ANGLE);
  deviceState.flapOpen = false;
}

inline void openFlap() {
  if (!FLAP_SERVO_ENABLED) {
    return;
  }

  moveFlapToAngle(FLAP_OPEN_ANGLE);
  deviceState.flapOpen = true;
}

inline bool waitForChuteTrigger(unsigned long timeoutMs) {
  unsigned long startedAt = millis();

  while (millis() - startedAt < timeoutMs) {
    if (chuteSensorTriggered()) {
      return true;
    }

    delay(60);
  }

  return false;
}

inline bool waitForPickup(unsigned long timeoutMs) {
  unsigned long startedAt = millis();

  while (millis() - startedAt < timeoutMs) {
    if (pickupConfirmed()) {
      setSuccessLights();
      sendDeviceEvent("pickup_confirmed", deviceState.currentSlot, "Hand sensor confirmed pickup.");
      renderDisplay("Pickup confirmed", "Slot " + String(deviceState.currentSlot), "Dose completed", "");
      delay(1200);
      setIdleLights();
      return true;
    }

    delay(80);
  }

  return false;
}

inline bool moveWheelForCalibration(int angle) {
  if (!SERVO_OUTPUT_ENABLED) {
    return false;
  }

  moveWheelToAngle(angle);
  renderDisplay("Wheel calibrate", "Angle " + String(angle), "", "");
  return true;
}

inline bool moveDoorForCalibration(int angle) {
  if (!SERVO_OUTPUT_ENABLED) {
    return false;
  }

  moveDoorToAngle(angle);
  renderDisplay("Door calibrate", "Angle " + String(angle), "", "");
  return true;
}

inline bool moveFlapForCalibration(int angle) {
  if (!SERVO_OUTPUT_ENABLED || !FLAP_SERVO_ENABLED) {
    return false;
  }

  moveFlapToAngle(angle);
  renderDisplay("Flap calibrate", "Angle " + String(angle), "", "");
  return true;
}

inline void finishDispenseCycle() {
  closeDoor();
  closeFlap();
  moveWheelToAngle(WHEEL_RESET_ANGLE);
  deviceState.isDispensing = false;
  deviceState.activeScheduleIds = "[]";
}

inline bool dispenseFlow(int slot) {
  if (slot < 1 || slot > SLOT_COUNT) {
    deviceState.lastStatus = "Bad slot";
    return false;
  }

  if (!SERVO_OUTPUT_ENABLED) {
    deviceState.lastStatus = "Servo disabled";
    renderDisplay("Bench mode only", "Servo motion off", "", "Edit Config.h");
    return false;
  }

  deviceState.isDispensing = true;
  pulseBuzzer(2, 120);
  renderDisplay("Dose Requested", "Preparing slot " + String(slot), "", "");

  attachServosIfEnabled();
  if (!deviceState.wheelAttached || !deviceState.doorAttached || (FLAP_SERVO_ENABLED && !deviceState.flapAttached)) {
    setErrorLights();
    pulseBuzzer(3, 160);
    deviceState.lastStatus = FLAP_SERVO_ENABLED ? "Servo/flap attach fail" : "Servo attach fail";
    deviceState.isDispensing = false;
    renderDisplay("Dispensing Fail", "Servo attach fail", "Check power/pins", "");
    return false;
  }

  if (!authorizeFingerprint()) {
    setErrorLights();
    pulseBuzzer(4, 180);
    sendDeviceEvent("unauthorized", slot, "Fingerprint authorization failed.");
    deviceState.isDispensing = false;
    renderDisplay("Access denied", "Fingerprint fail", "", "");
    delay(1200);
    setIdleLights();
    return false;
  }

  closeFlap();
  renderDisplay("Dispensing", "Rotating wheel", "Slot " + String(slot), "");
  rotateToSlot(slot);
  delay(SLOT_ALIGN_SETTLE_MS);

  renderDisplay("Dispensing", "Flap open", "Release 1 pill", "");
  openFlap();
  delay(FLAP_RELEASE_OPEN_MS);
  closeFlap();

  renderDisplay("Dispensing", "Wheel reset", "Returning home", "");
  moveWheelToAngle(WHEEL_RESET_ANGLE);

  renderDisplay("Dispensing", "Opening gate", "Watch chute IR", "");
  openDoor();
  const bool chuteSeen = waitForChuteTrigger(CHUTE_TIMEOUT_MS);
  closeDoor();

  if (!chuteSeen) {
    setErrorLights();
    pulseBuzzer(3, 200);
    sendDeviceEvent("missed", slot, "Door cycled but chute sensor did not trigger.");
    finishDispenseCycle();
    renderDisplay("Dispensing Fail", "No pill detected", "Check slot path", "");
    delay(1500);
    setIdleLights();
    return false;
  }

  sendDeviceEvent("dispensed", slot, "Door cycled and chute sensor triggered.");
  pulseBuzzer(2, 100);
  renderDisplay("Dispensing", "Pills Released", "Waiting pickup", "");

  if (waitForPickup(PICKUP_TIMEOUT_MS)) {
    finishDispenseCycle();
    deviceState.lastStatus = "Dispense ok";
    return true;
  }

  setErrorLights();
  pulseBuzzer(5, 180);
  sendDeviceEvent("missed", slot, "Dispensed but hand sensor did not confirm pickup.");
  finishDispenseCycle();
  renderDisplay("Pickup Timeout", "Dose not taken", "", "");
  delay(1500);
  setIdleLights();
  return false;
}
