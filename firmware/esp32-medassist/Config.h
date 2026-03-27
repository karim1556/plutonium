  #pragma once

#include <Arduino.h>

const char* WIFI_SSID = "rohan";
const char* WIFI_PASSWORD = "iambatman";
const char* BACKEND_EVENT_URL = "http://10.237.160.233:3000/api/device/event";
const char* BACKEND_SCHEDULE_URL = "http://10.237.160.233:3000/api/device/schedule";
const char* DEVICE_ID = "71deb4a9-fa30-469e-ae92-731cf4516b52";
const char* DEVICE_SHARED_KEY = "e6fc750b9dd41f2a6b956bc2e7baaa80a2c970ed856bb273";

// Keep servo motion disabled for first bring-up. Turn this on only after:
// 1. the wheel angles are calibrated
// 2. the door angles are calibrated
// 3. the servos have a stable external supply
constexpr bool SERVO_OUTPUT_ENABLED = true;
constexpr bool FLAP_SERVO_ENABLED = false;
constexpr bool REQUIRE_FINGERPRINT = false;
constexpr bool AUTO_SET_RTC_FROM_BUILD_TIME = true;
constexpr bool ENABLE_LOCAL_LONG_PRESS_DISPENSE = true;

constexpr uint8_t LCD_I2C_ADDRESS = 0x27;
constexpr uint8_t LCD_I2C_FALLBACK_ADDRESS = 0x3F;
constexpr uint8_t LCD_COLUMNS = 16;
constexpr uint8_t LCD_ROWS = 2;

const char* LCD_BOOT_LINE1 = "MedAssist Pro";
const char* LCD_BOOT_LINE2 = "System Starting";
const char* LCD_BOOT_LINE3 = "ESP32 Online";
const char* LCD_BOOT_LINE4 = "Sensors + Servo";

constexpr int SLOT_COUNT = 5;
constexpr unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;
constexpr unsigned long FINGERPRINT_TIMEOUT_MS = 10000;
constexpr unsigned long CHUTE_TIMEOUT_MS = 4000;
constexpr unsigned long PICKUP_TIMEOUT_MS = 15000;
constexpr unsigned long HEARTBEAT_INTERVAL_MS = 30000;
constexpr unsigned long SCHEDULE_SYNC_INTERVAL_MS = 60000;
constexpr unsigned long SCHEDULE_SYNC_RETRY_INTERVAL_MS = 10000;
constexpr unsigned long WIFI_RECONNECT_INTERVAL_MS = 15000;
constexpr unsigned long DISPLAY_REFRESH_MS = 1000;
constexpr unsigned long MANUAL_SWITCH_LONG_PRESS_MS = 2500;
constexpr unsigned long WHEEL_SETTLE_MS = 900;
constexpr unsigned long DOOR_TRAVEL_MS = 650;
constexpr int SCHEDULE_TRIGGER_GRACE_MINUTES = 2;

// Many IR obstacle sensors pull LOW when blocked.
constexpr int SENSOR_ACTIVE_STATE = LOW;
// The guide below uses INPUT_PULLUP and a switch wired to GND.
constexpr int SWITCH_ACTIVE_STATE = LOW;

constexpr int WHEEL_SERVO_MIN_ANGLE = 10;
constexpr int WHEEL_SERVO_MAX_ANGLE = 170;
constexpr int DOOR_SERVO_MIN_ANGLE = 20;
constexpr int DOOR_SERVO_MAX_ANGLE = 160;
constexpr int FLAP_SERVO_MIN_ANGLE = 10;
constexpr int FLAP_SERVO_MAX_ANGLE = 170;

constexpr int WHEEL_HOME_ANGLE = 90;
constexpr int DOOR_CLOSED_ANGLE = 50;
constexpr int DOOR_OPEN_ANGLE = 110;
constexpr int FLAP_CLOSED_ANGLE = 40;
constexpr int FLAP_OPEN_ANGLE = 120;
constexpr unsigned long FLAP_TRAVEL_MS = 450;

// Intentionally held at home until the real mechanism is calibrated.
const int SLOT_ANGLES[SLOT_COUNT] = {
  10,
  50,
  90,
  130,
  170
};
