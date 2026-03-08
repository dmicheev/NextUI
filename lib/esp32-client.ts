// Клиент для общения с ESP32

import type {
  ServoConfig,
  MotorSpeeds,
  CameraAngle,
  CameraPWM,
  SystemStatus,
  APIResponse,
  SetServoRequest,
  CalibrateServoRequest,
  SetMotorRequest,
  SetCameraAngleRequest,
  SetCameraPWMRequest,
} from '@/types';
import { fetchWithTimeout } from './fetch-with-timeout';

// Конфигурация подключения к ESP32
// ВАЖНО: Установите переменные окружения для продакшена:
// NEXT_PUBLIC_ESP32_API_BASE=http://192.168.1.108:8080
// NEXT_PUBLIC_CAMERA_STREAM_URL=http://192.168.1.111:81
export const ESP32_API_BASE = process.env.NEXT_PUBLIC_ESP32_API_BASE || 'http://192.168.1.108:8080';
export const CAMERA_STREAM_URL = process.env.NEXT_PUBLIC_CAMERA_STREAM_URL || 'http://192.168.1.111:81';

/**
 * Получить статус системы
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/status`);
  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.status}`);
  }
  return response.json();
}

/**
 * Получить все сервоприводы
 */
export async function getServos(): Promise<ServoConfig[]> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/servo`);
  if (!response.ok) {
    throw new Error(`Failed to get servos: ${response.status}`);
  }
  const data = await response.json();
  return data.servos || [];
}

/**
 * Установить угол сервопривода
 */
export async function setServo(request: SetServoRequest): Promise<APIResponse> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/servo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to set servo: ${response.status}`);
  }
  return response.json();
}

/**
 * Калибровать сервопривод
 */
export async function calibrateServo(request: CalibrateServoRequest): Promise<APIResponse> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/servo/calibrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to calibrate servo: ${response.status}`);
  }
  return response.json();
}

/**
 * Получить скорости моторов
 */
export async function getMotors(): Promise<MotorSpeeds> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/motor`);
  if (!response.ok) {
    throw new Error(`Failed to get motors: ${response.status}`);
  }
  return response.json();
}

/**
 * Установить скорости моторов
 */
export async function setMotors(request: SetMotorRequest): Promise<APIResponse> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/motor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to set motors: ${response.status}`);
  }
  return response.json();
}

/**
 * Остановить все моторы
 */
export async function stopAllMotors(): Promise<APIResponse> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/motor/stop`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to stop motors: ${response.status}`);
  }
  return response.json();
}

/**
 * Получить углы камеры (Pan/Tilt)
 */
export async function getCamera(): Promise<CameraAngle> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/camera`);
  if (!response.ok) {
    throw new Error(`Failed to get camera: ${response.status}`);
  }
  return response.json();
}

/**
 * Установить углы камеры (Pan/Tilt) в градусах (0-180)
 */
export async function setCamera(request: SetCameraAngleRequest): Promise<APIResponse> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/camera/angle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to set camera angles: ${response.status}`);
  }
  return response.json();
}

/**
 * Получить PWM камеры (для обратной совместимости)
 */
export async function getCameraPWM(): Promise<CameraPWM> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/camera/pwm`);
  if (!response.ok) {
    throw new Error(`Failed to get camera PWM: ${response.status}`);
  }
  return response.json();
}

/**
 * Установить PWM камеры (для обратной совместимости)
 */
export async function setCameraPWM(request: SetCameraPWMRequest): Promise<APIResponse> {
  const response = await fetchWithTimeout(`${ESP32_API_BASE}/api/camera/pwm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to set camera PWM: ${response.status}`);
  }
  return response.json();
}

/**
 * Экстренная остановка всех систем
 */
export async function emergencyStop(): Promise<void> {
  await Promise.all([
    stopAllMotors(),
    setCamera({ pan_angle: 90, tilt_angle: 90 }),
  ]);
}
