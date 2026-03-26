# MedAssist Pro Hardware + Software Integration Guide

This guide is based on the current repository code and firmware in this project.

Use this when you want the full system working end-to-end:
- Next.js app + Supabase backend
- ESP32 firmware (Arduino IDE)
- Two-way integration (app -> device and device -> backend)

## 1. What Actually Connects to What

There are two live paths in this codebase:

1. Web app to ESP32 (dispense trigger)
- UI button calls `POST /api/dispense`
- Backend calls `POST http://DEVICE_IP/dispense?slot=N`

2. ESP32 to web app (hardware events)
- Firmware posts to `POST /api/device/event`
- Header `x-medassist-device-key` is sent if a key is configured in firmware

Relevant code files:
- `app/api/dispense/route.ts`
- `lib/hardware.ts`
- `app/api/device/event/route.ts`
- `firmware/esp32-medassist/BackendClient.h`
- `firmware/esp32-medassist/esp32-medassist.ino`

## 2. Prerequisites

## Hardware
- ESP32 dev board
- DS3231 RTC
- 16x4 I2C LCD
- R307S fingerprint module
- 2 IR sensors (chute + hand pickup)
- 2 servos (wheel + door)
- buzzer
- 2 LEDs + resistors
- 1 momentary switch
- External 5V supply for servos (recommended)

## Software
- Node.js 18+ (or newer LTS)
- pnpm
- Arduino IDE 2.x
- Supabase project

## Arduino libraries to install
- Adafruit Fingerprint Sensor Library
- ESP32Servo
- RTClib
- LiquidCrystal_I2C

## 3. Wiring (Matches Firmware Pins)

From `firmware/esp32-medassist/Pins.h`:

- I2C SDA: GPIO 21
- I2C SCL: GPIO 22
- Wheel servo: GPIO 18
- Door servo: GPIO 19
- IR chute sensor: GPIO 34
- IR hand sensor: GPIO 35
- Buzzer: GPIO 27
- Green LED: GPIO 26
- Red LED: GPIO 25
- Manual switch: GPIO 23 (to GND, uses `INPUT_PULLUP`)
- Fingerprint RX (ESP32 receives): GPIO 16
- Fingerprint TX (ESP32 transmits): GPIO 17

Important safety notes:
- Keep common ground across all modules.
- Do not power servos from ESP32 3.3V.
- Verify LCD/fingerprint signal levels are safe for ESP32 3.3V GPIO.

## 4. Backend Setup (Next.js + Supabase)

From project root:

```bash
pnpm install
```

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
MEDASSIST_HARDWARE_ENABLED=true
MEDASSIST_DEFAULT_DEVICE_IP=192.168.1.40
MEDASSIST_DEVICE_SHARED_KEY=your-shared-key
```

Apply database schema:
- Run SQL in `supabase/schema.sql` on your Supabase project.
- Optional demo data: `supabase/seed.sql`.

Start app:

```bash
pnpm dev
```

Use only one Next process at a time (`dev` or `build`, not both simultaneously).

## 5. Firmware Configuration (Arduino IDE)

Open:
- `firmware/esp32-medassist/esp32-medassist.ino`

Edit `firmware/esp32-medassist/Config.h`:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_EVENT_URL = "http://<YOUR_MAC_LAN_IP>:3000/api/device/event";
const char* DEVICE_ID = "device-prod-1";
const char* DEVICE_SHARED_KEY = "your-shared-key";

constexpr bool SERVO_OUTPUT_ENABLED = false;
constexpr bool REQUIRE_FINGERPRINT = true;
```

Set these correctly:
- `BACKEND_EVENT_URL` must point to your running Next app on LAN IP, not localhost.
- `DEVICE_SHARED_KEY` must match `MEDASSIST_DEVICE_SHARED_KEY` in `.env.local`.
- Keep `SERVO_OUTPUT_ENABLED=false` for first boot and sensor checks.

About fingerprint:
- If `REQUIRE_FINGERPRINT=true`, dispense is blocked unless fingerprint match succeeds.
- The firmware expects templates already enrolled in the sensor module.
- For first mechanical tests, you can temporarily set `REQUIRE_FINGERPRINT=false`.

## 6. Flash ESP32 via Arduino IDE

1. Install ESP32 board package in Arduino IDE.
2. Select your ESP32 board and serial port.
3. Open `firmware/esp32-medassist/esp32-medassist.ino`.
4. Install missing libraries if prompted.
5. Upload sketch.
6. Open Serial Monitor only if you add serial logs (current firmware mainly uses LCD + HTTP status).

## 7. Bring-Up Order (Do This Exactly)

1. Start backend (`pnpm dev`) and keep it running.
2. Power ESP32 and confirm LCD boots.
3. Check device health from your Mac:

```bash
curl "http://<ESP32_IP>/health"
```

You should see fields like `status`, `wifiConnected`, `rtcReady`, `fingerprintReady`, `servoEnabled`, `chute`, `hand`, `switch`.

4. Check event callback path manually from ESP32 side:

```bash
curl -X POST "http://<ESP32_IP>/log?details=manual-test"
```

This triggers firmware `sendDeviceEvent("heartbeat", ...)` to backend.

5. In web app, sign in and register device at `/device`:
- Save patient device IP and firmware version.
- This creates/updates device and ensures slot rows 1..5 exist.

## 8. Web App Functional Flow (Real Use)

1. Patient account and caregiver account signup.
2. Link caregiver to patient using `/connections` invite flow.
3. Register device in `/device` (caregiver view).
4. Import medication plan (`/upload`) and save.
5. Generate and save schedule (`/schedule`).
6. Trigger supervised dose from `/caregiver` or `/device`.

What happens on trigger:
- App calls `/api/dispense`.
- Backend forwards to ESP32 `/dispense?slot=N`.
- ESP32 runs dispense flow and posts hardware events back to `/api/device/event`.

## 9. Servo Calibration and Mechanical Activation

Calibration endpoints exist in firmware:
- `POST /calibrate/wheel?angle=90`
- `POST /calibrate/door?angle=90`

Important:
- These return `servo_output_disabled` unless `SERVO_OUTPUT_ENABLED=true`.
- Enable servo output only after safe wiring and external servo power are ready.

Suggested calibration sequence:
1. Set `SERVO_OUTPUT_ENABLED=true` and reflash.
2. Use small angle steps to find safe wheel and door ranges.
3. Update `SLOT_ANGLES[]`, `DOOR_CLOSED_ANGLE`, `DOOR_OPEN_ANGLE` in `Config.h`.
4. Reflash and retest.

Examples:

```bash
curl -X POST "http://<ESP32_IP>/calibrate/wheel?angle=90"
curl -X POST "http://<ESP32_IP>/calibrate/door?angle=110"
```

## 10. End-to-End Verification Checklist

Software checks:
- `pnpm typecheck` passes.
- App login works.
- `/device` page shows registered device and slots.

Network checks:
- Mac can reach `http://<ESP32_IP>/health`.
- ESP32 can reach `http://<MAC_IP>:3000/api/device/event`.

Security checks:
- `MEDASSIST_DEVICE_SHARED_KEY` equals firmware `DEVICE_SHARED_KEY`.
- `/api/device/event` accepts valid key and rejects invalid key.

Hardware checks:
- IR sensors change state in `/health` (`chute`, `hand`).
- Switch state changes in `/health` (`switch`).
- Fingerprint ready status is true if required.
- Dispense flow returns success only when sensors and auth pass.

Data checks:
- New rows appear in `hardware_logs` after heartbeat/dispense/pickup.
- If `scheduleIds` are sent with `pickup_confirmed` or `missed`, `logs` rows are auto-inserted.

## 11. Common Issues and Fixes

1. Dispense always simulated
- Cause: `MEDASSIST_HARDWARE_ENABLED` is not `true`.
- Fix: set `MEDASSIST_HARDWARE_ENABLED=true`, restart Next app.

2. ESP32 posts events but backend rejects
- Cause: shared key mismatch.
- Fix: align `.env.local` `MEDASSIST_DEVICE_SHARED_KEY` and firmware `DEVICE_SHARED_KEY`.

3. No device events reach backend
- Cause: `BACKEND_EVENT_URL` uses wrong IP/port.
- Fix: use your Mac LAN IP and ensure same Wi-Fi network.

4. Dispense blocked with fingerprint failure
- Cause: no enrolled templates or sensor not ready.
- Fix: enroll prints in module, check wiring, or temporarily set `REQUIRE_FINGERPRINT=false` for bench testing.

5. Calibration endpoint returns `servo_output_disabled`
- Cause: `SERVO_OUTPUT_ENABLED=false`.
- Fix: set true, reflash, retry.

6. Next.js random module/chunk errors after switching commands
- Cause: stale `.next` artifacts.
- Fix: stop app, remove `.next`, then run only one of `pnpm dev` or `pnpm build`.

## 12. Recommended Production Hardening

- Put backend behind HTTPS and reverse proxy.
- Add API auth for `/dispense` device calls if exposing beyond LAN.
- Add retries and backoff for firmware event posting.
- Move secrets to secure provisioning flow (not hardcoded in firmware for production).
- Add OTA firmware update path.
- Add watchdog + offline queueing on device.

---

If you want, the next step can be an exact per-angle calibration worksheet for your physical wheel geometry so slot 1..5 aligns perfectly with your mechanism.
