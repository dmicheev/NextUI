// API Route: POST /api/servo/calibrate
// Калибровка сервопривода (прокси к ESP32)

import { calibrateServo } from '@/lib/esp32-client';
import { proxyESP32, badRequest } from '@/lib/api-proxy';
import { SERVO_ID_MIN, SERVO_ID_MAX, PWM_MAX_VALUE } from '@/lib/constants';
import type { CalibrateServoRequest } from '@/types';

export async function POST(request: Request) {
  const body: CalibrateServoRequest = await request.json();

  if (typeof body.id !== 'number' || body.id < SERVO_ID_MIN || body.id > SERVO_ID_MAX) {
    return badRequest(`Invalid servo ID (must be ${SERVO_ID_MIN}-${SERVO_ID_MAX})`);
  }

  if (typeof body.min !== 'number' || body.min < 0 || body.min > PWM_MAX_VALUE) {
    return badRequest(`Invalid min PWM (must be 0-${PWM_MAX_VALUE})`);
  }

  if (typeof body.max !== 'number' || body.max < 0 || body.max > PWM_MAX_VALUE) {
    return badRequest(`Invalid max PWM (must be 0-${PWM_MAX_VALUE})`);
  }

  if (body.min >= body.max) {
    return badRequest('min must be less than max');
  }

  return proxyESP32(() => calibrateServo(body), 'Failed to calibrate servo');
}
