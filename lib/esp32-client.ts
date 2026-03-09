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

// Флаг для использования Next.js прокси (по умолчанию true для браузера)
const USE_PROXY = typeof window !== 'undefined';

/**
 * Получить статус системы
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const url = USE_PROXY ? '/api/status' : `${ESP32_API_BASE}/api/status`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.status}`);
  }
  return response.json();
}

/**
 * Получить все сервоприводы
 */
export async function getServos(): Promise<ServoConfig[]> {
  const url = USE_PROXY ? '/api/servo' : `${ESP32_API_BASE}/api/servo`;
  const response = await fetchWithTimeout(url);
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
  const url = USE_PROXY ? '/api/servo' : `${ESP32_API_BASE}/api/servo`;
  const response = await fetchWithTimeout(url, {
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
  const url = USE_PROXY ? '/api/servo/calibrate' : `${ESP32_API_BASE}/api/servo/calibrate`;
  const response = await fetchWithTimeout(url, {
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
  const url = USE_PROXY ? '/api/motor' : `${ESP32_API_BASE}/api/motor`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Failed to get motors: ${response.status}`);
  }
  return response.json();
}

/**
 * Установить скорости моторов
 */
export async function setMotors(request: SetMotorRequest): Promise<APIResponse> {
  const url = USE_PROXY ? '/api/motor' : `${ESP32_API_BASE}/api/motor`;
  const response = await fetchWithTimeout(url, {
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
  const url = USE_PROXY ? '/api/motor/stop' : `${ESP32_API_BASE}/api/motor/stop`;
  const response = await fetchWithTimeout(url, {
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
  const url = USE_PROXY ? '/api/camera' : `${ESP32_API_BASE}/api/camera`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Failed to get camera: ${response.status}`);
  }
  return response.json();
}

/**
 * Установить углы камеры (Pan/Tilt) в градусах (0-180)
 */
export async function setCamera(request: SetCameraAngleRequest): Promise<APIResponse> {
  const url = USE_PROXY ? '/api/camera/angle' : `${ESP32_API_BASE}/api/camera/angle`;
  const response = await fetchWithTimeout(url, {
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
  const url = USE_PROXY ? '/api/camera/pwm' : `${ESP32_API_BASE}/api/camera/pwm`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Failed to get camera PWM: ${response.status}`);
  }
  return response.json();
}

/**
 * Установить PWM камеры (для обратной совместимости)
 */
export async function setCameraPWM(request: SetCameraPWMRequest): Promise<APIResponse> {
  const url = USE_PROXY ? '/api/camera/pwm' : `${ESP32_API_BASE}/api/camera/pwm`;
  const response = await fetchWithTimeout(url, {
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
