// API Route: GET/POST /api/motor
// Управление моторами (прокси к ESP32)

import { getMotors, setMotors } from '@/lib/esp32-client';
import { proxyESP32, badRequest } from '@/lib/api-proxy';
import { MOTOR_SPEED_MIN, MOTOR_SPEED_MAX } from '@/lib/constants';
import { toFullMotorSpeeds } from '@/types';
import type { SetMotorRequest } from '@/types';

export async function GET() {
  return proxyESP32(getMotors, 'Failed to get motors');
}

export async function POST(request: Request) {
  const body: SetMotorRequest = await request.json();

  // Отсутствующие поля трактуем как 0 и валидируем весь набор до отправки
  const motors = toFullMotorSpeeds({
    motorA: body.motorA,
    motorB: body.motorB,
    motorC: body.motorC,
    motorD: body.motorD,
  });

  for (const [key, value] of Object.entries(motors)) {
    if (value < MOTOR_SPEED_MIN || value > MOTOR_SPEED_MAX) {
      return badRequest(`Invalid ${key} speed (must be ${MOTOR_SPEED_MIN} to ${MOTOR_SPEED_MAX})`);
    }
  }

  return proxyESP32(() => setMotors(motors), 'Failed to set motors');
}
