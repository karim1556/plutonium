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
#include "Sensors.h"
#include "State.h"

HardwareSerial FingerSerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&FingerSerial);
WebServer server(80);
Servo wheelServo;
Servo doorServo;
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
  body += ",\"servoEnabled\":";
  body += SERVO_OUTPUT_ENABLED ? "true" : "false";
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
  deviceState.lastStatus = SERVO_OUTPUT_ENABLED ? "Ready for calibration" : "Bench-safe mode";
  refreshIdleDisplay();

  server.on("/health", HTTP_GET, handleHealth);
  server.on("/dispense", HTTP_POST, handleDispense);
  server.on("/log", HTTP_POST, handleManualLog);
  server.on("/calibrate/wheel", HTTP_POST, handleWheelCalibration);
  server.on("/calibrate/door", HTTP_POST, handleDoorCalibration);
  server.on("/i2c/scan", HTTP_GET, handleI2cScan);
  server.begin();
}

void loop() {
  server.handleClient();
  updateLongPressDispense();

  if (!deviceState.isDispensing && millis() - deviceState.lastDisplayRefreshAt >= DISPLAY_REFRESH_MS) {
    refreshIdleDisplay();
    deviceState.lastDisplayRefreshAt = millis();
  }

  if (millis() - deviceState.lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
    sendDeviceEvent("heartbeat", deviceState.currentSlot, "Device online heartbeat.");
    deviceState.lastHeartbeatAt = millis();
  }
}
