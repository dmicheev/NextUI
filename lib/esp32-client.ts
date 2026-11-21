// Клиент для общения с ESP32.
// В браузере запросы идут через Next.js прокси (относительные /api/...),
// на сервере (внутри route handlers) - напрямую на ESP32.

import type {
  ServoConfig,
  MotorSpeeds,
  CameraAngle,
  CameraPWM,
  SystemStatus,
  APIResponse,
  JoystickRequest,
  JoystickResponse,
  SetServoRequest,
  CalibrateServoRequest,
  SetMotorRequest,
  SetCameraAngleRequest,
  SetCameraPWMRequest,
} from '@/types';
import { fetchWithTimeout } from './fetch-with-timeout';

export { fetchWithTimeout };

// Конфигурация подключения к ESP32
// ВАЖНО: для продакшена установите переменные окружения
// NEXT_PUBLIC_ESP32_API_BASE и NEXT_PUBLIC_CAMERA_STREAM_URL
export const ESP32_API_BASE = process.env.NEXT_PUBLIC_ESP32_API_BASE || 'http://192.168.1.108:8080';
export const CAMERA_STREAM_URL = process.env.NEXT_PUBLIC_CAMERA_STREAM_URL || 'http://192.168.1.111:80';

// В браузере - через прокси, на сервере - напрямую
const USE_PROXY = typeof window !== 'undefined';

// Команды управления не ретраятся: задержка движения хуже одного потерянного запроса.
// Чтение статуса спокойно можно повторять.
const COMMAND_TIMEOUT_MS = 3000;
const READ_TIMEOUT_MS = 5000;
const READ_RETRIES = 3;

function buildURL(path: string): string {
  return USE_PROXY ? path : `${ESP32_API_BASE}${path}`;
}

async function esp32Fetch<T>(
  path: string,
  init: RequestInit = {},
  options: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const response = await fetchWithTimeout(buildURL(path), { ...init, ...options });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`ESP32 ${init.method || 'GET'} ${path} failed: ${response.status}${errorText ? ` - ${errorText}` : ''}`);
  }

  return response.json() as Promise<T>;
}

// Чтение состояния (с ретраями)
function read<T>(path: string): Promise<T> {
  return esp32Fetch<T>(path, undefined, { timeoutMs: READ_TIMEOUT_MS, retries: READ_RETRIES });
}

// Команда с JSON-телом (без ретраев)
function command<T>(path: string, body: unknown): Promise<T> {
  return esp32Fetch<T>(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    { timeoutMs: COMMAND_TIMEOUT_MS },
  );
}

// Команда без тела (без ретраев)
function commandNoBody<T>(path: string): Promise<T> {
  return esp32Fetch<T>(path, { method: 'POST' }, { timeoutMs: COMMAND_TIMEOUT_MS });
}

// ===== Статус =====

export async function getSystemStatus(
  options: { timeoutMs?: number; retries?: number } = {},
): Promise<SystemStatus> {
  return esp32Fetch<SystemStatus>('/api/status', undefined, options);
}

// ===== Сервоприводы =====

export async function getServos(): Promise<ServoConfig[]> {
  const data = await read<{ servos?: ServoConfig[] }>('/api/servo');
  return data.servos || [];
}

export async function setServo(request: SetServoRequest): Promise<APIResponse> {
  return command<APIResponse>('/api/servo', request);
}

export async function calibrateServo(request: CalibrateServoRequest): Promise<APIResponse> {
  return command<APIResponse>('/api/servo/calibrate', request);
}

// ===== Моторы =====

export async function getMotors(): Promise<MotorSpeeds> {
  return read<MotorSpeeds>('/api/motor');
}

export async function setMotors(request: SetMotorRequest): Promise<APIResponse> {
  return command<APIResponse>('/api/motor', request);
}

export async function stopAllMotors(): Promise<APIResponse> {
  return commandNoBody<APIResponse>('/api/motor/stop');
}

// ===== Камера =====

export async function getCamera(): Promise<CameraAngle> {
  return read<CameraAngle>('/api/camera');
}

export async function setCamera(request: SetCameraAngleRequest): Promise<APIResponse> {
  return command<APIResponse>('/api/camera/angle', request);
}

// Легаси PWM-эндпоинты
export async function getCameraPWM(): Promise<CameraPWM> {
  return read<CameraPWM>('/api/camera/pwm');
}

export async function setCameraPWM(request: SetCameraPWMRequest): Promise<APIResponse> {
  return command<APIResponse>('/api/camera/pwm', request);
}

// ===== Джойстик (расчёты движения на сервере) =====

export async function sendJoystick(request: JoystickRequest): Promise<JoystickResponse> {
  return command<JoystickResponse>('/api/joystick', request);
}

// ===== Экстренная остановка =====

/**
 * Экстренная остановка: моторы в стоп + камера в 90/90 (компонует Next.js роут).
 */
export async function emergencyStop(): Promise<APIResponse> {
  return commandNoBody<APIResponse>('/api/emergency');
}
