#pragma once

#include <Adafruit_Fingerprint.h>
#include <ESP32Servo.h>
#include <HX711.h>
#include <WebServer.h>

extern HardwareSerial FingerSerial;
extern Adafruit_Fingerprint finger;
extern WebServer server;
extern Servo wheelServo;
extern HX711 scale;
