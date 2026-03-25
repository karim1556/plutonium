#pragma once

#include <Arduino.h>
#include "Pins.h"

inline void setIdleLights() {
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  noTone(BUZZER_PIN);
}

inline void setSuccessLights() {
  digitalWrite(GREEN_LED_PIN, HIGH);
  digitalWrite(RED_LED_PIN, LOW);
}

inline void setErrorLights() {
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, HIGH);
}

inline void pulseBuzzer(int cycles, int durationMs) {
  for (int i = 0; i < cycles; i++) {
    tone(BUZZER_PIN, 2400, durationMs);
    delay(durationMs + 120);
  }
}
