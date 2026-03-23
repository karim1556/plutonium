#pragma once

#include <Arduino.h>

struct DeviceState {
  int currentSlot = 1;
  bool requiresFingerprint = true;
  bool isDispensing = false;
  long baselineWeight = 0;
  unsigned long lastHeartbeatAt = 0;
  String activeScheduleIds = "[]";
};

extern DeviceState deviceState;
