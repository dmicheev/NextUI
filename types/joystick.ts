// Типы для джойстика

export type JoystickMode = 'drive' | 'servo' | 'mixed';

export interface JoystickPosition {
  x: number;  // -100...100
  y: number;  // -100...100
}

export interface JoystickConfig {
  deadZone: number;
  maxSpeed: number;
  servoStep: number;
  updateInterval: number;
}

export interface ServoAngles {
  servo0: number;
  servo1: number;
  servo2: number;
  servo3: number;
}

export interface MovementVector {
  angle: number;
  speed: number;
  normalized: {
    x: number;
    y: number;
  };
}
