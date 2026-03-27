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

  // Reset processed flags at midnight
  if (deviceState.lastProcessedDay != now.day()) {
    for (int i = 0; i < deviceState.activeScheduleCount; i++) {
      deviceState.activeSchedules[i].processedToday = false;
    }
    deviceState.lastProcessedDay = now.day();
    // Also force a sync if it's a new day
    deviceState.lastScheduleSyncAt = 0;
  }

  // Check schedules
  for (int i = 0; i < deviceState.activeScheduleCount; i++) {
    ScheduleItem& item = deviceState.activeSchedules[i];

    const int nowMinuteOfDay = now.hour() * 60 + now.minute();
    const int itemMinuteOfDay = item.hour * 60 + item.minute;
    const bool inDispenseWindow =
      nowMinuteOfDay >= itemMinuteOfDay &&
      nowMinuteOfDay <= itemMinuteOfDay + SCHEDULE_TRIGGER_GRACE_MINUTES;

    if (!item.processedToday && inDispenseWindow) {
      // It is time to dispense
      deviceState.lastStatus = "Auto dispense";
      // Set the activeScheduleIds so the backend event gets correctly linked to the schedule
      deviceState.activeScheduleIds = "[\"" + item.id + "\"]";
      
      const bool success = dispenseFlow(item.slot);
      
      if (success) {
        item.processedToday = true;
        deviceState.lastStatus = "Schedule ok";
      } else {
        deviceState.lastStatus = "Schedule fail";
      }

      deviceState.activeScheduleIds = "[]";
      // Only process one per loop iteration to avoid blocking
      break; 
    }
  }
}
