#pragma once

#include <Arduino.h>
#include "Config.h"

struct ScheduleItem {
  String id;
  int slot;
  int hour;
  int minute;
  bool processedToday;
};

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
  bool flapAttached = false;
  bool doorOpen = false;
  bool flapOpen = false;
  unsigned long lastHeartbeatAt = 0;
  unsigned long lastDisplayRefreshAt = 0;
  unsigned long lastWifiReconnectAt = 0;
  unsigned long lastRtcRetryAt = 0;
  unsigned long switchPressedAt = 0;
  bool longPressHandled = false;
  ScheduleItem activeSchedules[10];
  int activeScheduleCount = 0;
  unsigned long lastScheduleSyncAt = 0;
  bool lastScheduleSyncOk = false;
  int lastProcessedDay = -1;
  unsigned long lastAutoDispenseAt = 0;
  String lastAutoDispenseAttemptScheduleId = "";
  unsigned long lastAutoDispenseAttemptAt = 0;
  String activeScheduleIds = "[]";
  String lastStatus = "Booting";
};

extern DeviceState deviceState;
