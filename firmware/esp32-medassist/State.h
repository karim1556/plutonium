#pragma once

#include <Arduino.h>
#include "Config.h"

struct DeviceState {
  int currentSlot = 1;
  bool requiresFingerprint = REQUIRE_FINGERPRINT;
  bool isDispensing = false;
  bool wifiConnected = false;
  bool rtcReady = false;
  bool lcdReady = false;
  uint8_t lcdAddress = 0;
  bool fingerprintReady = false;
  bool wheelAttached = false;
  bool doorAttached = false;
  bool doorOpen = false;
  unsigned long lastHeartbeatAt = 0;
  unsigned long lastDisplayRefreshAt = 0;
  unsigned long switchPressedAt = 0;
  bool longPressHandled = false;
  String activeScheduleIds = "[]";
  String lastStatus = "Booting";
};

extern DeviceState deviceState;
