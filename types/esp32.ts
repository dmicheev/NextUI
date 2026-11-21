// Типы для ESP32 API

// Тип идентификатора мотора
export type MotorId = 'A' | 'B' | 'C' | 'D';

export interface ServoConfig {
  id: number;
  angle: number;
  // Параметры калибровки ESP32 в ответе /api/servo не отдаёт
  min?: number;
  max?: number;
}

export interface MotorSpeeds {
  motorA: number;
  motorB: number;
  motorC: number;
  motorD: number;
}

export interface CameraAngle {
  pan_angle: number;
  tilt_angle: number;
}

export interface CameraPWM {
  pan_pwm: number;
  tilt_pwm: number;
}

export interface SystemStatus {
  status: string;
  ip: string;
  servos_count: number;
}

// Ответ ESP32 содержит разные наборы полей в зависимости от эндпоинта
export interface APIResponse {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface SetServoRequest {
  id: number;
  angle: number;
}

export interface CalibrateServoRequest {
  id: number;
  min: number;
  max: number;
}

export interface SetMotorRequest extends MotorSpeeds {}

export interface SetCameraAngleRequest extends CameraAngle {}

export interface SetCameraPWMRequest extends CameraPWM {}
