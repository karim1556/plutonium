#pragma once

#include <Arduino.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_EVENT_URL = "http://192.168.1.10:3000/api/device/event";
const char* DEVICE_ID = "device-prod-1";
const char* DEVICE_SHARED_KEY = "set-this-in-firmware";

constexpr int SLOT_COUNT = 5;
constexpr unsigned long FINGERPRINT_TIMEOUT_MS = 10000;
constexpr unsigned long PICKUP_TIMEOUT_MS = 15000;
constexpr unsigned long RETRY_TIMEOUT_MS = 6000;
constexpr unsigned long HEARTBEAT_INTERVAL_MS = 30000;

const int SLOT_ANGLES[SLOT_COUNT] = {15, 50, 85, 120, 155};
