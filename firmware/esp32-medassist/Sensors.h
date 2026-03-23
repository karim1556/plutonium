#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include "Config.h"
#include "HardwareContext.h"
#include "Indicators.h"
#include "Pins.h"
#include "State.h"

inline void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

inline void initializeScale() {
  scale.begin(HX711_DOUT_PIN, HX711_SCK_PIN);

  if (scale.is_ready()) {
    scale.set_scale();
    scale.tare();
    deviceState.baselineWeight = scale.get_units(5);
  }
}

inline bool authorizeFingerprint() {
  if (!deviceState.requiresFingerprint) {
    return true;
  }

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
      return true;
    }
  }

  return false;
}

inline bool pickupConfirmed() {
  bool irTriggered = digitalRead(IR_SENSOR_PIN) == HIGH;
  long currentWeight = scale.is_ready() ? scale.get_units(3) : deviceState.baselineWeight;
  bool weightReduced = currentWeight < deviceState.baselineWeight - 2;

  return irTriggered && weightReduced;
}
