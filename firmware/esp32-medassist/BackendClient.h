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
