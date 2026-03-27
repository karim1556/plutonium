#pragma once

#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include "Config.h"
#include "State.h"

inline String escapeJson(const String& input) {
  String escaped = input;
  escaped.replace("\\", "\\\\");
  escaped.replace("\"", "\\\"");
  escaped.replace("\n", "\\n");
  return escaped;
}

inline String csvToJsonArray(const String& csv) {
  if (csv.length() == 0) {
    return "[]";
  }

  String json = "[";
  int start = 0;

  while (start < csv.length()) {
    int delimiter = csv.indexOf(',', start);
    if (delimiter < 0) {
      delimiter = csv.length();
    }

    String token = csv.substring(start, delimiter);
    token.trim();

    if (token.length() > 0) {
      if (json.length() > 1) {
        json += ",";
      }
      json += "\"";
      json += escapeJson(token);
      json += "\"";
    }

    start = delimiter + 1;
  }

  json += "]";
  return json;
}

inline bool postJson(const String& body) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  HTTPClient http;
  http.begin(BACKEND_EVENT_URL);
  http.addHeader("Content-Type", "application/json");

  if (String(DEVICE_SHARED_KEY).length() > 0) {
    http.addHeader("x-medassist-device-key", DEVICE_SHARED_KEY);
  }

  int statusCode = http.POST(body);
  http.end();

  return statusCode >= 200 && statusCode < 300;
}

inline bool sendDeviceEvent(const char* event, int slotNumber, const String& details) {
  String body = "{";
  body += "\"deviceId\":\"";
  body += DEVICE_ID;
  body += "\",\"event\":\"";
  body += event;
  body += "\",\"slotNumber\":";
  body += slotNumber;
  body += ",\"details\":\"";
  body += escapeJson(details);
  body += "\"";

  if (deviceState.activeScheduleIds.length() > 0 && deviceState.activeScheduleIds != "[]") {
    body += ",\"scheduleIds\":";
    body += deviceState.activeScheduleIds;
  }

  body += "}";
  return postJson(body);
}

inline bool fetchDailySchedule() {
  if (WiFi.status() != WL_CONNECTED) {
    deviceState.lastScheduleSyncOk = false;
    return false;
  }

  HTTPClient http;
  String url = String(BACKEND_SCHEDULE_URL) + "?deviceId=" + String(DEVICE_ID);
  http.begin(url);

  if (String(DEVICE_SHARED_KEY).length() > 0) {
    http.addHeader("x-medassist-device-key", DEVICE_SHARED_KEY);
  }

  int statusCode = http.GET();
  if (statusCode < 200 || statusCode >= 300) {
    http.end();
    deviceState.lastScheduleSyncOk = false;
    return false;
  }

  String response = http.getString();
  http.end();

  // Create temporary copy of previous schedules to remember and preserve processedToday
  ScheduleItem oldSchedules[10];
  int oldScheduleCount = deviceState.activeScheduleCount;
  for (int i = 0; i < oldScheduleCount; i++) {
    oldSchedules[i] = deviceState.activeSchedules[i];
  }

  deviceState.activeScheduleCount = 0;
  
  int index = 0;
  while (index < response.length() && deviceState.activeScheduleCount < 10) {
    int objStart = response.indexOf('{', index);
    if (objStart == -1) break;
    int objEnd = response.indexOf('}', objStart);
    if (objEnd == -1) break;

    String obj = response.substring(objStart, objEnd);
    
    int idKey = obj.indexOf("\"id\":\"");
    String schId = "";
    if (idKey != -1) {
      int idStart = idKey + 6;
      int idEnd = obj.indexOf("\"", idStart);
      schId = obj.substring(idStart, idEnd);
    }
    
    int slotKey = obj.indexOf("\"slot\":");
    int slot = 0;
    if (slotKey != -1) {
      int slotStart = slotKey + 7;
      int slotEnd = obj.indexOf(",", slotStart);
      if (slotEnd == -1 || obj.indexOf("}", slotStart) < slotEnd && obj.indexOf("}", slotStart) != -1) {
        slotEnd = obj.indexOf("}", slotStart);
        if (slotEnd == -1) slotEnd = obj.length();
      }
      slot = obj.substring(slotStart, slotEnd).toInt();
    }
    
    int timeKey = obj.indexOf("\"time\":\"");
    int hour = 0;
    int minute = 0;
    if (timeKey != -1) {
      int timeStart = timeKey + 8;
      int timeEnd = obj.indexOf("\"", timeStart);
      String timeStr = obj.substring(timeStart, timeEnd);
      int colon = timeStr.indexOf(':');
      if (colon != -1) {
        hour = timeStr.substring(0, colon).toInt();
        minute = timeStr.substring(colon + 1).toInt();
      }
    }

    if (slot > 0 && schId.length() > 0) {
      bool alreadyProcessed = false;
      for (int i = 0; i < oldScheduleCount; i++) {
        if (oldSchedules[i].id == schId && oldSchedules[i].processedToday) {
           alreadyProcessed = true;
           break;
        }
      }

      deviceState.activeSchedules[deviceState.activeScheduleCount].id = schId;
      deviceState.activeSchedules[deviceState.activeScheduleCount].slot = slot;
      deviceState.activeSchedules[deviceState.activeScheduleCount].hour = hour;
      deviceState.activeSchedules[deviceState.activeScheduleCount].minute = minute;
      deviceState.activeSchedules[deviceState.activeScheduleCount].processedToday = alreadyProcessed;
      deviceState.activeScheduleCount++;
    }

    index = objEnd + 1;
  }

  deviceState.lastScheduleSyncAt = millis();
  deviceState.lastScheduleSyncOk = true;
  deviceState.lastStatus = "Schedule synced";
  return true;
}
