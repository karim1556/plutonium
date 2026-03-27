#include <ESP32Servo.h>

Servo wheelServo;
Servo doorServo;

const int WHEEL_SERVO_PIN = 18;
const int DOOR_SERVO_PIN = 19;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Allocate timers properly for ESP32
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  
  // Standard servo pulse usually between 500 and 2400 ms
  wheelServo.setPeriodHertz(50);
  doorServo.setPeriodHertz(50);
  
  Serial.println("Attaching Wheel Servo (Pin 18)...");
  wheelServo.attach(WHEEL_SERVO_PIN, 500, 2400);

  Serial.println("Attaching Door Servo (Pin 19)...");
  doorServo.attach(DOOR_SERVO_PIN, 500, 2400);

  Serial.println("Centering both servos at 90 degrees...");
  wheelServo.write(90);
  doorServo.write(90);
  delay(3000);
}

void loop() {
  Serial.println("--- Testing Wheel (Pin 18) ---");
  Serial.println("Wheel to 10");
  wheelServo.write(10);
  delay(2000);
  Serial.println("Wheel to 170");
  wheelServo.write(170);
  delay(2000);
  Serial.println("Wheel to 90 (Home)");
  wheelServo.write(90);
  delay(2000);

  Serial.println("--- Testing Door (Pin 19) ---");
  Serial.println("Door to 30");
  doorServo.write(30);
  delay(2000);
  Serial.println("Door to 150");
  doorServo.write(150);
  delay(2000);
  Serial.println("Door to 90 (Home)");
  doorServo.write(90);
  delay(4000); // Wait 4 seconds before restarting the whole loop
}
