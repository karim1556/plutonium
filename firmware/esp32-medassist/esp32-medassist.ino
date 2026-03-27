#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <Adafruit_Fingerprint.h>

#include "BackendClient.h"
#include "Config.h"
#include "DispenseFlow.h"
#include "HardwareContext.h"
#include "Indicators.h"
#include "Pins.h"
#include "ScheduleRunner.h"
#include "Sensors.h"
#include "State.h"

HardwareSerial FingerSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&FingerSerial);
WebServer server(80);
Servo wheelServo;
Servo doorServo;
Servo flapServo;
LiquidCrystal_I2C lcd(LCD_I2C_ADDRESS, LCD_COLUMNS, LCD_ROWS);
LiquidCrystal_I2C lcdFallback(LCD_I2C_FALLBACK_ADDRESS, LCD_COLUMNS, LCD_ROWS);
LiquidCrystal_I2C* activeLcd = &lcd;
RTC_DS3231 rtc;
DeviceState deviceState;

void handleHealth() {
  String body = "{";
  body += "\"deviceId\":\"";
  body += DEVICE_ID;
  body += "\",\"status\":\"";
  body += deviceState.isDispensing ? "dispensing" : "online";
  body += "\",\"slot\":";
  body += deviceState.currentSlot;
  body += ",\"wifiConnected\":";
  body += deviceState.wifiConnected ? "true" : "false";
  body += ",\"rtcReady\":";
  body += deviceState.rtcReady ? "true" : "false";
  body += ",\"fingerprintReady\":";
  body += deviceState.fingerprintReady ? "true" : "false";
  body += ",\"lcdReady\":";
  body += deviceState.lcdReady ? "true" : "false";
  body += ",\"lcdAddress\":\"";
  char lcdAddressHex[7];
  snprintf(lcdAddressHex, sizeof(lcdAddressHex), "0x%02X", deviceState.lcdAddress);
  body += lcdAddressHex;
  body += "\"";
  body += ",\"servoEnabled\":";
  body += SERVO_OUTPUT_ENABLED ? "true" : "false";
  body += ",\"wheelAttached\":";
  body += deviceState.wheelAttached ? "true" : "false";
  body += ",\"doorAttached\":";
  body += deviceState.doorAttached ? "true" : "false";
  body += ",\"flapAttached\":";
  body += deviceState.flapAttached ? "true" : "false";
  body += ",\"flapEnabled\":";
  body += FLAP_SERVO_ENABLED ? "true" : "false";
  body += ",\"flapOpen\":";
  body += deviceState.flapOpen ? "true" : "false";
  body += ",\"activeScheduleCount\":";
  body += deviceState.activeScheduleCount;
  body += ",\"lastScheduleSyncOk\":";
  body += deviceState.lastScheduleSyncOk ? "true" : "false";
  body += ",\"chute\":";
  body += chuteSensorTriggered() ? "true" : "false";
  body += ",\"hand\":";
  body += handSensorTriggered() ? "true" : "false";
  body += ",\"switch\":";
  body += manualSwitchPressed() ? "true" : "false";
  body += ",\"time\":\"";
  body += timeLabel();
  body += "\"";
  body += ",\"note\":\"";
  body += deviceState.lastStatus;
  body += "\"";
  body += "}";

  server.send(200, "application/json", body);
}

void handleDispense() {
  if (!server.hasArg("slot")) {
    server.send(400, "application/json", "{\"error\":\"slot query parameter required\"}");
    return;
  }

  int slot = server.arg("slot").toInt();
  deviceState.activeScheduleIds = server.hasArg("scheduleIds") ? csvToJsonArray(server.arg("scheduleIds")) : "[]";

  bool success = dispenseFlow(slot);
  server.send(
    success ? 200 : 409,
    "application/json",
    success ? "{\"status\":\"dispensed\"}" : "{\"status\":\"blocked_or_failed\"}"
  );
}

void handleManualLog() {
  String details = server.hasArg("details") ? server.arg("details") : "Manual log from device.";
  sendDeviceEvent("heartbeat", deviceState.currentSlot, details);

  String body = "{";
  body += "\"deviceId\":\"";
  body += DEVICE_ID;
  body += "\",\"slot\":";
  body += deviceState.currentSlot;
  body += ",\"message\":\"Manual heartbeat sent to backend.\"}";

  server.send(200, "application/json", body);
}

void handleWheelCalibration() {
  if (!server.hasArg("angle")) {
    server.send(400, "application/json", "{\"error\":\"angle query parameter required\"}");
    return;
  }

  const int angle = server.arg("angle").toInt();
  const bool moved = moveWheelForCalibration(angle);
  server.send(
    moved ? 200 : 409,
    "application/json",
    moved ? "{\"status\":\"wheel_moved\"}" : "{\"status\":\"servo_output_disabled\"}"
  );
}

void handleDoorCalibration() {
  if (!server.hasArg("angle")) {
    server.send(400, "application/json", "{\"error\":\"angle query parameter required\"}");
    return;
  }

  const int angle = server.arg("angle").toInt();
  const bool moved = moveDoorForCalibration(angle);
  server.send(
    moved ? 200 : 409,
    "application/json",
    moved ? "{\"status\":\"door_moved\"}" : "{\"status\":\"servo_output_disabled\"}"
  );
}

void handleFlapCalibration() {
  if (!server.hasArg("angle")) {
    server.send(400, "application/json", "{\"error\":\"angle query parameter required\"}");
    return;
  }

  const int angle = server.arg("angle").toInt();
  const bool moved = moveFlapForCalibration(angle);
  server.send(
    moved ? 200 : 409,
    "application/json",
    moved ? "{\"status\":\"flap_moved\"}" : "{\"status\":\"flap_disabled_or_not_enabled\"}"
  );
}

void handleServoTest() {
  if (!SERVO_OUTPUT_ENABLED) {
    server.send(409, "application/json", "{\"status\":\"servo_output_disabled\"}");
    return;
  }

  attachServosIfEnabled();

  if (!deviceState.wheelAttached && !deviceState.doorAttached) {
    server.send(409, "application/json", "{\"status\":\"servo_attach_failed\"}");
    return;
  }

  renderDisplay("Servo test", "Running pattern", "Check movement", "");

  if (deviceState.wheelAttached) {
    moveWheelToAngle(30);
    moveWheelToAngle(150);
    moveWheelToAngle(WHEEL_RESET_ANGLE);
  }

  if (deviceState.doorAttached) {
    moveDoorToAngle(30);
    moveDoorToAngle(120);
    moveDoorToAngle(DOOR_CLOSED_ANGLE);
  }

  if (FLAP_SERVO_ENABLED && deviceState.flapAttached) {
    moveFlapToAngle(FLAP_CLOSED_ANGLE);
    moveFlapToAngle(FLAP_OPEN_ANGLE);
    moveFlapToAngle(FLAP_CLOSED_ANGLE);
  }

  String body = "{";
  body += "\"status\":\"servo_test_done\"";
  body += ",\"wheelAttached\":";
  body += deviceState.wheelAttached ? "true" : "false";
  body += ",\"doorAttached\":";
  body += deviceState.doorAttached ? "true" : "false";
  body += ",\"flapAttached\":";
  body += deviceState.flapAttached ? "true" : "false";
  body += "}";

  server.send(200, "application/json", body);
}

void handleWheelSweepTest() {
  if (!SERVO_OUTPUT_ENABLED) {
    server.send(409, "application/json", "{\"status\":\"servo_output_disabled\"}");
    return;
  }

  attachServosIfEnabled();
  if (!deviceState.wheelAttached) {
    server.send(409, "application/json", "{\"status\":\"wheel_attach_failed\"}");
    return;
  }

  renderDisplay("Wheel sweep", "Running", "Look at wheel", "");

  for (int i = 0; i < 3; i++) {
    moveWheelToAngle(20);
    moveWheelToAngle(160);
  }
  moveWheelToAngle(WHEEL_RESET_ANGLE);

  server.send(200, "application/json", "{\"status\":\"wheel_sweep_done\"}");
}

void handleI2cScan() {
  String body = "{";
  body += "\"devices\":";
  body += scanI2cBusJson();
  body += "}";

  server.send(200, "application/json", body);
}

void updateLongPressDispense() {
  if (!ENABLE_LOCAL_LONG_PRESS_DISPENSE || deviceState.isDispensing) {
    return;
  }

  if (manualSwitchPressed()) {
    if (deviceState.switchPressedAt == 0) {
      deviceState.switchPressedAt = millis();
      deviceState.longPressHandled = false;
    }

    if (!deviceState.longPressHandled && millis() - deviceState.switchPressedAt >= MANUAL_SWITCH_LONG_PRESS_MS) {
      deviceState.longPressHandled = true;
      deviceState.lastStatus = "Local trigger";
      renderDisplay("Local dispense", "Hold detected", "Slot " + String(deviceState.currentSlot), "");
      const bool success = dispenseFlow(deviceState.currentSlot);
      deviceState.lastStatus = success ? "Local success" : "Local failed";
    }

    return;
  }

  deviceState.switchPressedAt = 0;
  deviceState.longPressHandled = false;
}

void setup() {
  pinMode(IR_CHUTE_SENSOR_PIN, INPUT);
  pinMode(IR_HAND_SENSOR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(MANUAL_SWITCH_PIN, INPUT_PULLUP);

  setIdleLights();
  initializeI2cBus();
  initializeDisplay();
  initializeRtc();
  initializeFingerprint();
  connectWiFi();

  if (SERVO_OUTPUT_ENABLED) {
    attachServosIfEnabled();
    closeFlap();
    moveWheelToAngle(WHEEL_RESET_ANGLE);
    closeDoor();
  }

  deviceState.lastStatus = SERVO_OUTPUT_ENABLED ? "Ready for calibration" : "Bench-safe mode";
  refreshIdleDisplay();

  server.on("/health", HTTP_GET, handleHealth);
  server.on("/dispense", HTTP_POST, handleDispense);
  server.on("/log", HTTP_POST, handleManualLog);
  server.on("/calibrate/wheel", HTTP_POST, handleWheelCalibration);
  server.on("/calibrate/door", HTTP_POST, handleDoorCalibration);
  server.on("/calibrate/flap", HTTP_POST, handleFlapCalibration);
  server.on("/servo/test", HTTP_POST, handleServoTest);
  server.on("/servo/test/wheel-sweep", HTTP_POST, handleWheelSweepTest);
  server.on("/i2c/scan", HTTP_GET, handleI2cScan);
  server.begin();
}

void loop() {
  server.handleClient();
  updateLongPressDispense();

  deviceState.wifiConnected = WiFi.status() == WL_CONNECTED;

  if (!deviceState.wifiConnected && millis() - deviceState.lastWifiReconnectAt >= WIFI_RECONNECT_INTERVAL_MS) {
    connectWiFi();
    deviceState.lastWifiReconnectAt = millis();
  }

  if (!deviceState.rtcReady && millis() - deviceState.lastRtcRetryAt >= SCHEDULE_SYNC_RETRY_INTERVAL_MS) {
    initializeRtc();
    deviceState.lastRtcRetryAt = millis();
  }

  if (!deviceState.isDispensing && millis() - deviceState.lastDisplayRefreshAt >= DISPLAY_REFRESH_MS) {
    refreshIdleDisplay();
    deviceState.lastDisplayRefreshAt = millis();
  }

  if (millis() - deviceState.lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
    sendDeviceEvent("heartbeat", deviceState.currentSlot, "Device online heartbeat.");
    deviceState.lastHeartbeatAt = millis();
  }
  
  if (deviceState.rtcReady && deviceState.wifiConnected) {
    const unsigned long syncInterval =
      deviceState.activeScheduleCount == 0 ? SCHEDULE_SYNC_RETRY_INTERVAL_MS : SCHEDULE_SYNC_INTERVAL_MS;

    if (deviceState.lastScheduleSyncAt == 0 || millis() - deviceState.lastScheduleSyncAt >= syncInterval) {
      if (!fetchDailySchedule() && deviceState.activeScheduleCount == 0) {
        deviceState.lastStatus = "Schedule sync fail";
      }
    }
  }
  
  checkAndRunSchedules();
}
