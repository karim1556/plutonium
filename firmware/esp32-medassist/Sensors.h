#pragma once

#include <Arduino.h>
#include <time.h>
#include <WiFi.h>
#include <Wire.h>
#include "Config.h"
#include "HardwareContext.h"
#include "Indicators.h"
#include "Pins.h"
#include "State.h"

inline String fitToLcd(const String& input) {
  String line = input;

  while (line.length() < LCD_COLUMNS) {
    line += ' ';
  }

  return line.substring(0, LCD_COLUMNS);
}

inline void printDisplayLine(uint8_t row, const String& text) {
  if (!deviceState.lcdReady || row >= LCD_ROWS) {
    return;
  }

  activeLcd->setCursor(0, row);
  activeLcd->print(fitToLcd(text));
}

inline void renderDisplay(
  const String& line1,
  const String& line2 = "",
  const String& line3 = "",
  const String& line4 = ""
) {
  if (!deviceState.lcdReady) {
    return;
  }

  printDisplayLine(0, line1);
  printDisplayLine(1, line2);
  printDisplayLine(2, line3);
  printDisplayLine(3, line4);
}

inline bool signalIsActive(int pin) {
  return digitalRead(pin) == SENSOR_ACTIVE_STATE;
}

inline bool chuteSensorTriggered() {
  return signalIsActive(IR_CHUTE_SENSOR_PIN);
}

inline bool handSensorTriggered() {
  return signalIsActive(IR_HAND_SENSOR_PIN);
}

inline bool manualSwitchPressed() {
  return digitalRead(MANUAL_SWITCH_PIN) == SWITCH_ACTIVE_STATE;
}

inline String timeLabel() {
  if (!deviceState.rtcReady) {
    return "--:--";
  }

  const DateTime now = rtc.now();
  char buffer[6];
  snprintf(buffer, sizeof(buffer), "%02d:%02d", now.hour(), now.minute());
  return String(buffer);
}

inline void refreshIdleDisplay() {
  if (deviceState.isDispensing) {
    return;
  }

  const String line1 = "MedAssist " + timeLabel();
  const String line2 = "Slot " + String(deviceState.currentSlot) + (SERVO_OUTPUT_ENABLED ? " Ready" : " Bench");
  const String line3 = String(deviceState.wifiConnected ? "WiFi ON" : "WiFi OFF") + " " +
    String(deviceState.fingerprintReady ? "FP ON" : "FP OFF");
  const String line4 = "C" + String(chuteSensorTriggered() ? 1 : 0) +
    " H" + String(handSensorTriggered() ? 1 : 0) +
    " S" + String(manualSwitchPressed() ? 1 : 0);

  renderDisplay(line1, line2, line3, line4);
}

inline void connectWiFi() {
  if (String(WIFI_SSID).length() == 0 || String(WIFI_PASSWORD).length() == 0) {
    deviceState.wifiConnected = false;
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long startedAt = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    delay(250);
  }

  deviceState.wifiConnected = WiFi.status() == WL_CONNECTED;
}

inline void initializeI2cBus() {
  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
}

inline bool i2cAddressPresent(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

inline String scanI2cBusJson() {
  String json = "[";

  for (uint8_t address = 1; address < 127; address += 1) {
    Wire.beginTransmission(address);

    if (Wire.endTransmission() == 0) {
      if (json.length() > 1) {
        json += ",";
      }

      char hexAddress[7];
      snprintf(hexAddress, sizeof(hexAddress), "0x%02X", address);
      json += "\"";
      json += hexAddress;
      json += "\"";
    }
  }

  json += "]";
  return json;
}

inline void initializeDisplay() {
  const bool primaryPresent = i2cAddressPresent(LCD_I2C_ADDRESS);
  const bool fallbackPresent = i2cAddressPresent(LCD_I2C_FALLBACK_ADDRESS);

  if (!primaryPresent && !fallbackPresent) {
    deviceState.lcdReady = false;
    deviceState.lcdAddress = 0;
    deviceState.lastStatus = "LCD not found";
    return;
  }

  if (primaryPresent) {
    activeLcd = &lcd;
    deviceState.lcdAddress = LCD_I2C_ADDRESS;
  } else {
    activeLcd = &lcdFallback;
    deviceState.lcdAddress = LCD_I2C_FALLBACK_ADDRESS;
  }

  activeLcd->init();
  activeLcd->backlight();
  activeLcd->clear();
  deviceState.lcdReady = true;

  char lcdAddressLine[17];
  snprintf(lcdAddressLine, sizeof(lcdAddressLine), "LCD 0x%02X", deviceState.lcdAddress);
  renderDisplay(LCD_BOOT_LINE1, LCD_BOOT_LINE2, LCD_BOOT_LINE3, String(lcdAddressLine));
}

inline void initializeRtc() {
  deviceState.rtcReady = rtc.begin();

  if (!deviceState.rtcReady) {
    deviceState.lastStatus = "RTC init fail";
    return;
  }

  if (deviceState.rtcReady && AUTO_SET_RTC_FROM_BUILD_TIME) {
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }
}

inline bool syncRtcFromNtp() {
  if (!RTC_SYNC_FROM_NTP_ON_BOOT || !deviceState.rtcReady || WiFi.status() != WL_CONNECTED) {
    return false;
  }

  configTime(NTP_GMT_OFFSET_SEC, NTP_DAYLIGHT_OFFSET_SEC, NTP_SERVER_1, NTP_SERVER_2);

  struct tm timeInfo;
  const bool synced = getLocalTime(&timeInfo, NTP_SYNC_TIMEOUT_MS);
  if (!synced) {
    deviceState.lastStatus = "NTP sync fail";
    return false;
  }

  rtc.adjust(DateTime(
    timeInfo.tm_year + 1900,
    timeInfo.tm_mon + 1,
    timeInfo.tm_mday,
    timeInfo.tm_hour,
    timeInfo.tm_min,
    timeInfo.tm_sec
  ));

  deviceState.lastStatus = "RTC synced NTP";
  return true;
}

inline void initializeFingerprint() {
  delay(500); // Give sensor a half-second to boot before pinging it

  FingerSerial.begin(57600);
  finger.begin(57600);
  delay(100);
  
  if (finger.verifyPassword()) {
    deviceState.fingerprintReady = true;
    return;
  }

  // Fallback 1: Some clones use 9600 baud out of the box
  FingerSerial.begin(9600);
  if (finger.verifyPassword()) {
    deviceState.fingerprintReady = true;
    return;
  }

  // Fallback 2: Some use 115200 baud
  FingerSerial.begin(115200);
  if (finger.verifyPassword()) {
    deviceState.fingerprintReady = true;
    return;
  }

  // If all fail, it's not detected
  deviceState.fingerprintReady = false;
}

inline bool authorizeFingerprint() {
  if (!deviceState.requiresFingerprint) {
    renderDisplay("Access Granted", "Fingerprint off", "Bench/test mode", "");
    return true;
  }

  if (!deviceState.fingerprintReady) {
    deviceState.lastStatus = "Fingerprint offline";
    renderDisplay("Fingerprint err", "Module offline", "", "Check wiring");
    return false;
  }

  renderDisplay("Machine Ready", "Dose waiting...", "Scan Fingerprint", "Timeout 60 sec");
  unsigned long startedAt = millis();

  while (millis() - startedAt < FINGERPRINT_TIMEOUT_MS) {
    if (finger.getImage() != FINGERPRINT_OK) {
      delay(100);
      continue;
    }

    if (finger.image2Tz() != FINGERPRINT_OK) {
      continue;
    }

    if (finger.fingerFastSearch() == FINGERPRINT_OK) {
      deviceState.lastStatus = "Fingerprint ok";
      renderDisplay("Access Granted", "Fingerprint OK", "Preparing dose", "");
      delay(900);
      return true;
    }
  }

  deviceState.lastStatus = "Fingerprint fail";
  renderDisplay("Access Denied", "Fingerprint Fail", "Dose blocked", "");
  return false;
}

inline bool pickupConfirmed() {
  return handSensorTriggered();
}
