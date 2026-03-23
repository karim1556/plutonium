#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <HX711.h>
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
HX711 scale;
DeviceState deviceState;

void handleHealth() {
  String body = "{";
  body += "\"deviceId\":\"";
  body += DEVICE_ID;
  body += "\",\"status\":\"";
  body += deviceState.isDispensing ? "dispensing" : "online";
  body += "\",\"slot\":";
  body += deviceState.currentSlot;
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
    success ? "{\"status\":\"dispensed\"}" : "{\"status\":\"missed_or_blocked\"}"
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

void setup() {
  pinMode(IR_SENSOR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);

  setIdleLights();

  wheelServo.attach(SERVO_PIN);
  rotateToSlot(deviceState.currentSlot);

  initializeScale();

  FingerSerial.begin(57600, SERIAL_8N1, FINGERPRINT_RX_PIN, FINGERPRINT_TX_PIN);
  finger.begin(57600);

  connectWiFi();

  server.on("/health", HTTP_GET, handleHealth);
  server.on("/dispense", HTTP_POST, handleDispense);
  server.on("/log", HTTP_POST, handleManualLog);
  server.begin();
}

void loop() {
  server.handleClient();

  if (millis() - deviceState.lastHeartbeatAt >= HEARTBEAT_INTERVAL_MS) {
    sendDeviceEvent("heartbeat", deviceState.currentSlot, "Device online heartbeat.");
    deviceState.lastHeartbeatAt = millis();
  }
}
