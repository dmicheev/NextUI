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

// Экспортируем fetchWithTimeout для использования в API routes
export { fetchWithTimeout };

// Конфигурация подключения к ESP32
// ВАЖНО: Установите переменные окружения для продакшена:
// NEXT_PUBLIC_ESP32_API_BASE=http://192.168.1.108:8080
// NEXT_PUBLIC_CAMERA_STREAM_URL=http://192.168.1.111:81
export const ESP32_API_BASE = process.env.NEXT_PUBLIC_ESP32_API_BASE || 'http://192.168.1.108:8080';
export const CAMERA_STREAM_URL = process.env.NEXT_PUBLIC_CAMERA_STREAM_URL || 'http://192.168.1.111:80';

// Флаг для использования Next.js прокси (по умолчанию true для браузера)
const USE_PROXY = typeof window !== 'undefined';

/**
 * Получить статус системы
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  console.log('[ESP32 Client] getSystemStatus() - Starting request');
  console.log('[ESP32 Client] getSystemStatus() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/status' : `${ESP32_API_BASE}/api/status`;
  console.log('[ESP32 Client] getSystemStatus() - URL:', url);
  const response = await fetchWithTimeout(url);
  console.log('[ESP32 Client] getSystemStatus() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] getSystemStatus() - Error:', response.status, errorText);
    throw new Error(`Failed to get status: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] getSystemStatus() - Success:', result);
  return result;
}

/**
 * Получить все сервоприводы
 */
export async function getServos(): Promise<ServoConfig[]> {
  console.log('[ESP32 Client] getServos() - Starting request');
  console.log('[ESP32 Client] getServos() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/servo' : `${ESP32_API_BASE}/api/servo`;
  console.log('[ESP32 Client] getServos() - URL:', url);
  const response = await fetchWithTimeout(url);
  console.log('[ESP32 Client] getServos() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] getServos() - Error:', response.status, errorText);
    throw new Error(`Failed to get servos: ${response.status}`);
  }
  const data = await response.json();
  console.log('[ESP32 Client] getServos() - Success:', data);
  return data.servos || [];
}

/**
 * Установить угол сервопривода
 */
export async function setServo(request: SetServoRequest): Promise<APIResponse> {
  console.log('[ESP32 Client] setServo() - Starting request');
  console.log('[ESP32 Client] setServo() - Request:', request);
  console.log('[ESP32 Client] setServo() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/servo' : `${ESP32_API_BASE}/api/servo`;
  console.log('[ESP32 Client] setServo() - URL:', url);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  console.log('[ESP32 Client] setServo() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] setServo() - Error:', response.status, errorText);
    throw new Error(`Failed to set servo: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] setServo() - Success:', result);
  return result;
}

/**
 * Калибровать сервопривод
 */
export async function calibrateServo(request: CalibrateServoRequest): Promise<APIResponse> {
  console.log('[ESP32 Client] calibrateServo() - Starting request');
  console.log('[ESP32 Client] calibrateServo() - Request:', request);
  console.log('[ESP32 Client] calibrateServo() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/servo/calibrate' : `${ESP32_API_BASE}/api/servo/calibrate`;
  console.log('[ESP32 Client] calibrateServo() - URL:', url);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  console.log('[ESP32 Client] calibrateServo() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] calibrateServo() - Error:', response.status, errorText);
    throw new Error(`Failed to calibrate servo: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] calibrateServo() - Success:', result);
  return result;
}

/**
 * Получить скорости моторов
 */
export async function getMotors(): Promise<MotorSpeeds> {
  console.log('[ESP32 Client] getMotors() - Starting request');
  console.log('[ESP32 Client] getMotors() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/motor' : `${ESP32_API_BASE}/api/motor`;
  console.log('[ESP32 Client] getMotors() - URL:', url);
  const response = await fetchWithTimeout(url);
  console.log('[ESP32 Client] getMotors() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] getMotors() - Error:', response.status, errorText);
    throw new Error(`Failed to get motors: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] getMotors() - Success:', result);
  return result;
}

/**
 * Установить скорости моторов
 */
export async function setMotors(request: SetMotorRequest): Promise<APIResponse> {
  console.log('[ESP32 Client] setMotors() - Starting request');
  console.log('[ESP32 Client] setMotors() - Request:', request);
  console.log('[ESP32 Client] setMotors() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/motor' : `${ESP32_API_BASE}/api/motor`;
  console.log('[ESP32 Client] setMotors() - URL:', url);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  console.log('[ESP32 Client] setMotors() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] setMotors() - Error:', response.status, errorText);
    throw new Error(`Failed to set motors: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] setMotors() - Success:', result);
  return result;
}

/**
 * Остановить все моторы
 */
export async function stopAllMotors(): Promise<APIResponse> {
  console.log('[ESP32 Client] stopAllMotors() - Starting request');
  console.log('[ESP32 Client] stopAllMotors() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/motor/stop' : `${ESP32_API_BASE}/api/motor/stop`;
  console.log('[ESP32 Client] stopAllMotors() - URL:', url);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
  });
  console.log('[ESP32 Client] stopAllMotors() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] stopAllMotors() - Error:', response.status, errorText);
    throw new Error(`Failed to stop motors: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] stopAllMotors() - Success:', result);
  return result;
}

/**
 * Получить углы камеры (Pan/Tilt)
 */
export async function getCamera(): Promise<CameraAngle> {
  console.log('[ESP32 Client] getCamera() - Starting request');
  console.log('[ESP32 Client] getCamera() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/camera' : `${ESP32_API_BASE}/api/camera`;
  console.log('[ESP32 Client] getCamera() - URL:', url);
  const response = await fetchWithTimeout(url);
  console.log('[ESP32 Client] getCamera() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] getCamera() - Error:', response.status, errorText);
    throw new Error(`Failed to get camera: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] getCamera() - Success:', result);
  return result;
}

/**
 * Установить углы камеры (Pan/Tilt) в градусах (0-180)
 */
export async function setCamera(request: SetCameraAngleRequest): Promise<APIResponse> {
  console.log('[ESP32 Client] setCamera() - Starting request');
  console.log('[ESP32 Client] setCamera() - Request:', request);
  console.log('[ESP32 Client] setCamera() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/camera' : `${ESP32_API_BASE}/api/camera/angle`;
  console.log('[ESP32 Client] setCamera() - URL:', url);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  console.log('[ESP32 Client] setCamera() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] setCamera() - Error:', response.status, errorText);
    throw new Error(`Failed to set camera angles: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] setCamera() - Success:', result);
  return result;
}

/**
 * Получить PWM камеры (для обратной совместимости)
 */
export async function getCameraPWM(): Promise<CameraPWM> {
  console.log('[ESP32 Client] getCameraPWM() - Starting request');
  console.log('[ESP32 Client] getCameraPWM() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/camera/pwm' : `${ESP32_API_BASE}/api/camera/pwm`;
  console.log('[ESP32 Client] getCameraPWM() - URL:', url);
  const response = await fetchWithTimeout(url);
  console.log('[ESP32 Client] getCameraPWM() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] getCameraPWM() - Error:', response.status, errorText);
    throw new Error(`Failed to get camera PWM: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] getCameraPWM() - Success:', result);
  return result;
}

/**
 * Установить PWM камеры (для обратной совместимости)
 */
export async function setCameraPWM(request: SetCameraPWMRequest): Promise<APIResponse> {
  console.log('[ESP32 Client] setCameraPWM() - Starting request');
  console.log('[ESP32 Client] setCameraPWM() - Request:', request);
  console.log('[ESP32 Client] setCameraPWM() - USE_PROXY:', typeof window !== 'undefined');
  const url = USE_PROXY ? '/api/camera/pwm' : `${ESP32_API_BASE}/api/camera/pwm`;
  console.log('[ESP32 Client] setCameraPWM() - URL:', url);
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  console.log('[ESP32 Client] setCameraPWM() - Response status:', response.status);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ESP32 Client] setCameraPWM() - Error:', response.status, errorText);
    throw new Error(`Failed to set camera PWM: ${response.status}`);
  }
  const result = await response.json();
  console.log('[ESP32 Client] setCameraPWM() - Success:', result);
  return result;
}

/**
 * Экстренная остановка всех систем
 */
export async function emergencyStop(): Promise<void> {
  console.log('[ESP32 Client] emergencyStop() - Starting request');
  try {
    await Promise.all([
      stopAllMotors(),
      setCamera({ pan_angle: 90, tilt_angle: 90 }),
    ]);
    console.log('[ESP32 Client] emergencyStop() - Success');
  } catch (error) {
    console.error('[ESP32 Client] emergencyStop() - Error:', error);
    throw error;
  }
}
