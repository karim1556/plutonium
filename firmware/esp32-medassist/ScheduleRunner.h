#pragma once

#include <Arduino.h>
#include <RTClib.h>
#include "State.h"
#include "Indicators.h"
#include "DispenseFlow.h"

extern RTC_DS3231 rtc;

inline void checkAndRunSchedules() {
  if (!deviceState.rtcReady || deviceState.activeScheduleCount == 0 || deviceState.isDispensing) {
    return;
  }

  DateTime now = rtc.now();
  const int nowMinuteOfDay = now.hour() * 60 + now.minute();

  // Reset processed flags at midnight
  if (deviceState.lastProcessedDay != now.day()) {
    for (int i = 0; i < deviceState.activeScheduleCount; i++) {
      deviceState.activeSchedules[i].processedToday = false;
    }
    deviceState.lastProcessedDay = now.day();
    deviceState.lastAutoDispenseAt = 0;
    deviceState.lastAutoDispenseAttemptScheduleId = "";
    deviceState.lastAutoDispenseAttemptAt = 0;
    // Also force a sync if it's a new day
    deviceState.lastScheduleSyncAt = 0;
  }

  // Prevent random back-to-back automatic activations when multiple schedules are near due.
  if (deviceState.lastAutoDispenseAt != 0 &&
      millis() - deviceState.lastAutoDispenseAt < AUTO_DISPENSE_MIN_GAP_MS) {
    return;
  }

  int candidateIndex = -1;
  int bestMinuteDelta = 9999;

  // Check schedules
  for (int i = 0; i < deviceState.activeScheduleCount; i++) {
    ScheduleItem& item = deviceState.activeSchedules[i];
    if (item.processedToday) {
      continue;
    }

    const int itemMinuteOfDay = item.hour * 60 + item.minute;
    const int minuteDelta = nowMinuteOfDay - itemMinuteOfDay;

    if (minuteDelta >= 0 && minuteDelta <= SCHEDULE_TRIGGER_GRACE_MINUTES && minuteDelta < bestMinuteDelta) {
      candidateIndex = i;
      bestMinuteDelta = minuteDelta;
    }
  }

  if (candidateIndex < 0) {
    return;
  }

  ScheduleItem& item = deviceState.activeSchedules[candidateIndex];

  // It is time to dispense
  deviceState.lastStatus = "Auto dispense";

  // If the same schedule was just attempted and failed, allow a controlled retry only after cooldown.
  if (deviceState.lastAutoDispenseAttemptScheduleId == item.id &&
      millis() - deviceState.lastAutoDispenseAttemptAt < AUTO_DISPENSE_RETRY_COOLDOWN_MS) {
    return;
  }

  // Set the activeScheduleIds so the backend event gets correctly linked to the schedule
  deviceState.activeScheduleIds = "[\"" + item.id + "\"]";
  deviceState.lastAutoDispenseAttemptScheduleId = item.id;
  deviceState.lastAutoDispenseAttemptAt = millis();

  const bool success = dispenseFlow(item.slot);
  deviceState.lastAutoDispenseAt = millis();

  // Mark processed regardless of success to prevent repeated auto-triggering on hardware test benches
  item.processedToday = true;

  if (success) {
    deviceState.lastStatus = "Schedule ok";
  } else {
    deviceState.lastStatus = "Schedule fail";
  }

  deviceState.activeScheduleIds = "[]";
}
