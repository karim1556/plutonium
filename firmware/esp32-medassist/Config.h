  #pragma once

#include <Arduino.h>

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_EVENT_URL = "http://192.168.1.10:3000/api/device/event";
const char* DEVICE_ID = "device-prod-1";
const char* DEVICE_SHARED_KEY = "set-this-in-firmware";

// Keep servo motion disabled for first bring-up. Turn this on only after:
// 1. the wheel angles are calibrated
// 2. the door angles are calibrated
// 3. the servos have a stable external supply
constexpr bool SERVO_OUTPUT_ENABLED = false;
constexpr bool REQUIRE_FINGERPRINT = true;
constexpr bool AUTO_SET_RTC_FROM_BUILD_TIME = false;
constexpr bool ENABLE_LOCAL_LONG_PRESS_DISPENSE = true;

constexpr uint8_t LCD_I2C_ADDRESS = 0x27;
constexpr uint8_t LCD_COLUMNS = 16;
constexpr uint8_t LCD_ROWS = 4;

constexpr int SLOT_COUNT = 5;
constexpr unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;
constexpr unsigned long FINGERPRINT_TIMEOUT_MS = 10000;
constexpr unsigned long CHUTE_TIMEOUT_MS = 4000;
constexpr unsigned long PICKUP_TIMEOUT_MS = 15000;
constexpr unsigned long HEARTBEAT_INTERVAL_MS = 30000;
constexpr unsigned long DISPLAY_REFRESH_MS = 1000;
constexpr unsigned long MANUAL_SWITCH_LONG_PRESS_MS = 2500;
constexpr unsigned long WHEEL_SETTLE_MS = 900;
constexpr unsigned long DOOR_TRAVEL_MS = 650;

// Many IR obstacle sensors pull LOW when blocked.
constexpr int SENSOR_ACTIVE_STATE = LOW;
// The guide below uses INPUT_PULLUP and a switch wired to GND.
constexpr int SWITCH_ACTIVE_STATE = LOW;

constexpr int WHEEL_SERVO_MIN_ANGLE = 10;
constexpr int WHEEL_SERVO_MAX_ANGLE = 170;
constexpr int DOOR_SERVO_MIN_ANGLE = 20;
constexpr int DOOR_SERVO_MAX_ANGLE = 160;

constexpr int WHEEL_HOME_ANGLE = 90;
constexpr int DOOR_CLOSED_ANGLE = 50;
constexpr int DOOR_OPEN_ANGLE = 110;

// Intentionally held at home until the real mechanism is calibrated.
const int SLOT_ANGLES[SLOT_COUNT] = {
  WHEEL_HOME_ANGLE,
  WHEEL_HOME_ANGLE,
  WHEEL_HOME_ANGLE,
  WHEEL_HOME_ANGLE,
  WHEEL_HOME_ANGLE
};
