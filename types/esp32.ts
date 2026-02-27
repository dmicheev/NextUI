// Типы для ESP32 API

export interface ServoConfig {
  id: number;
  angle: number;
  min: number;
  max: number;
}

export interface MotorSpeeds {
  motorA: number;
  motorB: number;
  motorC: number;
  motorD: number;
}

export interface CameraPWM {
  pan_pwm: number;
  tilt_pwm: number;
}

export interface CameraPulse {
  pan_pwm: number;
  tilt_pwm: number;
  duration_ms: number;
}

export interface SystemStatus {
  status: string;
  ip: string;
  servos_count: number;
}

export interface APIResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
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

export interface SetCameraPWMRequest extends CameraPWM {}

export interface SetCameraPulseRequest extends CameraPulse {}
