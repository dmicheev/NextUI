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

export interface SetCameraAngleRequest extends CameraAngle {}

export interface SetCameraPWMRequest extends CameraPWM {}
