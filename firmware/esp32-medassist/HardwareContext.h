#pragma once

#include <Adafruit_Fingerprint.h>
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <WebServer.h>
#include <Wire.h>

extern HardwareSerial FingerSerial;
extern Adafruit_Fingerprint finger;
extern WebServer server;
extern Servo wheelServo;
extern Servo doorServo;
extern Servo flapServo;
extern LiquidCrystal_I2C lcd;
extern LiquidCrystal_I2C lcdFallback;
extern LiquidCrystal_I2C* activeLcd;
extern RTC_DS3231 rtc;
