# MedAssist Pro Hardware Wiring Guide

This guide matches the current firmware in `firmware/esp32-medassist/` to the actual hardware set:

- ESP32 dev board (38-pin)
- DS3231 RTC
- 16x4 I2C LCD
- R307S fingerprint sensor
- 2 IR sensors
- 2 servos
- buzzer
- 2 LEDs
- 1 switch

## Safety First

- The firmware keeps `SERVO_OUTPUT_ENABLED=false` by default in [Config.h](/Users/karimshaikh/Desktop/plutonium/firmware/esp32-medassist/Config.h).
- That means first power-up is for logic, display, RTC, and sensor validation only.
- Do not enable live servo motion until wheel and door angles are calibrated.
- Do not power both servos from the ESP32 board.
- If you are only using laptop USB right now, leave the firmware in bench-safe mode and do not expect real dispense motion.

## Library Set

Install these Arduino libraries before compiling:

- `Adafruit Fingerprint Sensor Library`
- `ESP32Servo`
- `RTClib`
- `LiquidCrystal_I2C`

## Pin Map

| Component | ESP32 Pin | Notes |
|---|---:|---|
| LCD SDA | GPIO 21 | Shared I2C bus |
| LCD SCL | GPIO 22 | Shared I2C bus |
| DS3231 SDA | GPIO 21 | Shared with LCD |
| DS3231 SCL | GPIO 22 | Shared with LCD |
| Fingerprint TX | GPIO 16 | Connect module TX to ESP32 RX through level protection if needed |
| Fingerprint RX | GPIO 17 | ESP32 TX to module RX |
| Wheel servo signal | GPIO 18 | Rotation servo |
| Door servo signal | GPIO 19 | Gate open/close servo |
| IR chute sensor output | GPIO 34 | Input-only pin |
| IR hand sensor output | GPIO 35 | Input-only pin |
| Buzzer signal | GPIO 27 | Active or passive buzzer |
| Green LED | GPIO 26 | Use series resistor |
| Red LED | GPIO 25 | Use series resistor |
| Manual switch | GPIO 23 | Wire switch to GND, firmware uses `INPUT_PULLUP` |

Source pin config: [Pins.h](/Users/karimshaikh/Desktop/plutonium/firmware/esp32-medassist/Pins.h)

## Power Guide

### Recommended first bring-up

- ESP32: power from laptop USB
- DS3231: power from ESP32 `3.3V`
- IR sensors: power from ESP32 logic rail if their module supports it
- Buzzer: from ESP32 signal side
- LEDs: from ESP32 GPIO through resistors
- Switch: one side to `GPIO 23`, the other side to `GND`
- LCD: use only if the I2C backpack is safe for ESP32 logic levels
- Fingerprint: connect only after checking UART voltage safety
- Servos: leave motion disabled until separately powered and calibrated

### Important voltage notes

- `DS3231` is fine on 3.3V.
- `R307S` is often powered around 5V, but do not assume its UART TX is 3.3V-safe for the ESP32.
- Many `16x4 I2C LCD backpacks` use pull-ups tied to their supply voltage. If powered from 5V, SDA/SCL may rise to 5V and damage ESP32 GPIO.

If the LCD backpack or fingerprint serial lines are not already 3.3V-safe, add proper level shifting before connecting them to the ESP32.

## Wiring Steps

### 1. Common ground

Connect all grounds together:

- ESP32 `GND`
- RTC `GND`
- LCD `GND`
- fingerprint `GND`
- both IR sensor grounds
- buzzer ground
- LED return ground
- servo ground

### 2. I2C bus

Connect both I2C modules to the same bus:

- ESP32 `GPIO 21` -> LCD `SDA`
- ESP32 `GPIO 22` -> LCD `SCL`
- ESP32 `GPIO 21` -> DS3231 `SDA`
- ESP32 `GPIO 22` -> DS3231 `SCL`

### 3. Fingerprint sensor

- ESP32 `GPIO 16` <- R307S `TX`
- ESP32 `GPIO 17` -> R307S `RX`
- R307S `VCC` -> fingerprint supply
- R307S `GND` -> common ground

If the module TX line is above 3.3V, do not connect it directly to `GPIO 16`.

### 4. Servos

- ESP32 `GPIO 18` -> wheel servo signal
- ESP32 `GPIO 19` -> door servo signal
- servo power -> dedicated servo supply
- servo ground -> common ground

### 5. IR sensors

- ESP32 `GPIO 34` <- chute IR digital output
- ESP32 `GPIO 35` <- hand IR digital output
- IR sensor `VCC` and `GND` according to the module rating

The firmware assumes a common obstacle-sensor style output where detection pulls the line `LOW`. If your sensors behave the opposite way, change `SENSOR_ACTIVE_STATE` in [Config.h](/Users/karimshaikh/Desktop/plutonium/firmware/esp32-medassist/Config.h).

### 6. LEDs and buzzer

- ESP32 `GPIO 26` -> resistor -> green LED anode
- ESP32 `GPIO 25` -> resistor -> red LED anode
- LED cathodes -> GND
- ESP32 `GPIO 27` -> buzzer signal

### 7. Manual switch

- one side of the switch -> `GPIO 23`
- other side -> `GND`

The firmware uses the internal pull-up resistor, so the switch reads `LOW` when pressed.

## What The Firmware Does Now

### Boot behavior

- starts LCD
- starts RTC
- starts fingerprint serial
- attempts Wi-Fi with timeout
- shows status on the 16x4 LCD
- does not move servos on boot

### Dispense behavior

When servo motion is enabled later:

1. request dispense for a slot
2. fingerprint check
3. rotate wheel servo to the selected slot
4. open the door servo
5. wait for the chute IR sensor to detect pill movement
6. close the door servo
7. wait for the hand IR sensor to confirm pickup

### Local switch behavior

- long press on the switch triggers a local dispense for the current slot
- while `SERVO_OUTPUT_ENABLED=false`, this remains a safe logic-only path

## Calibration Endpoints

After you move to a proper servo power setup and set `SERVO_OUTPUT_ENABLED=true`, you can calibrate with:

- `POST /calibrate/wheel?angle=90`
- `POST /calibrate/door?angle=90`

The slot table in [Config.h](/Users/karimshaikh/Desktop/plutonium/firmware/esp32-medassist/Config.h) is intentionally set to the wheel home angle for all slots until you measure the real wheel positions.

## First Bring-up Checklist

1. Flash the firmware with `SERVO_OUTPUT_ENABLED=false`.
2. Power the ESP32 from USB.
3. Verify the LCD turns on.
4. Verify RTC status on the display.
5. Verify fingerprint module initializes.
6. Verify both IR sensors toggle on the LCD status line.
7. Verify switch press toggles the LCD switch state.
8. Only after all of that, move to servo calibration with proper servo power.
