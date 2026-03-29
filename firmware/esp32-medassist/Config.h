  #pragma once

#include <Arduino.h>

const char* WIFI_SSID = "rohan";
const char* WIFI_PASSWORD = "iambatman";
const char* BACKEND_EVENT_URL = "http://10.121.128.233:3000/api/device/event";
const char* BACKEND_SCHEDULE_URL = "http://10.121.128.233:3000/api/device/schedule";
const char* DEVICE_ID = "71deb4a9-fa30-469e-ae92-731cf4516b52";
const char* DEVICE_SHARED_KEY = "e6fc750b9dd41f2a6b956bc2e7baaa80a2c970ed856bb273";

// Keep servo motion disabled for first bring-up. Turn this on only after:
// 1. the wheel angles are calibrated
// 2. the door angles are calibrated
// 3. the servos have a stable external supply
constexpr bool SERVO_OUTPUT_ENABLED = true;
constexpr bool FLAP_SERVO_ENABLED = true;
constexpr bool REQUIRE_FINGERPRINT = true;
constexpr bool AUTO_SET_RTC_FROM_BUILD_TIME = false;
constexpr bool RTC_SYNC_FROM_NTP_ON_BOOT = true;
constexpr bool ENABLE_LOCAL_LONG_PRESS_DISPENSE = true;

const char* NTP_SERVER_1 = "pool.ntp.org";
const char* NTP_SERVER_2 = "time.google.com";
constexpr long NTP_GMT_OFFSET_SEC = 19800; // IST (UTC+5:30)
constexpr int NTP_DAYLIGHT_OFFSET_SEC = 0;
constexpr unsigned long NTP_SYNC_TIMEOUT_MS = 15000;

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
constexpr unsigned long FINGERPRINT_TIMEOUT_MS = 60000; // 1 Full Minute waiting for patient to scan finger
constexpr unsigned long CHUTE_TIMEOUT_MS = 4000;
constexpr unsigned long PICKUP_TIMEOUT_MS = 15000;
constexpr unsigned long HEARTBEAT_INTERVAL_MS = 30000;
constexpr unsigned long SCHEDULE_SYNC_INTERVAL_MS = 10000;
constexpr unsigned long SCHEDULE_SYNC_RETRY_INTERVAL_MS = 10000;
constexpr unsigned long WIFI_RECONNECT_INTERVAL_MS = 15000;
constexpr unsigned long DISPLAY_REFRESH_MS = 1000;
constexpr unsigned long MANUAL_SWITCH_LONG_PRESS_MS = 2500;
constexpr unsigned long WHEEL_SETTLE_MS = 900;
constexpr unsigned long DOOR_TRAVEL_MS = 650;
constexpr unsigned long AUTO_DISPENSE_RETRY_COOLDOWN_MS = 12000;
constexpr unsigned long AUTO_DISPENSE_MIN_GAP_MS = 45000;
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
constexpr int WHEEL_RESET_ANGLE = WHEEL_HOME_ANGLE;
constexpr int DOOR_CLOSED_ANGLE = 50;
constexpr int DOOR_OPEN_ANGLE = 110;
constexpr int FLAP_CLOSED_ANGLE = 40;
constexpr int FLAP_OPEN_ANGLE = 120;
constexpr unsigned long FLAP_TRAVEL_MS = 200;
constexpr unsigned long SLOT_ALIGN_SETTLE_MS = 500;
constexpr unsigned long FLAP_RELEASE_OPEN_MS = 150;

// Intentionally held at home until the real mechanism is calibrated.
const int SLOT_ANGLES[SLOT_COUNT] = {
  10,
  50,
  90,
  130,
  170
};
