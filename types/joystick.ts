// Типы для джойстика

import type { MotorSpeeds } from './esp32';

export type JoystickMode = 'drive' | 'servo' | 'mixed';

export interface JoystickPosition {
  x: number;  // -100...100
  y: number;  // -100...100
}

// Тело запроса POST /api/joystick (расчёты движения выполняет сервер)
export interface JoystickRequest {
  x: number;      // -100...100
  y: number;      // -100...100
  mode: JoystickMode;
}

// Ответ POST /api/joystick
export interface JoystickResponse {
  success: boolean;
  motors?: MotorSpeeds;
  servos?: ServoAngles;
  errors?: unknown[];
}

export interface ServoAngles {
  servo0: number;
  servo1: number;
  servo2: number;
  servo3: number;
}
