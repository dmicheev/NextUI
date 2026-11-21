// API Route: GET/POST /api/servo
// Управление сервоприводами (прокси к ESP32)

import { getServos, setServo } from '@/lib/esp32-client';
import { proxyESP32, badRequest } from '@/lib/api-proxy';
import { SERVO_ID_MIN, SERVO_ID_MAX, SERVO_ANGLE_MAX } from '@/lib/constants';
import type { SetServoRequest } from '@/types';

export async function GET() {
  return proxyESP32(async () => ({ servos: await getServos() }), 'Failed to get servos');
}

export async function POST(request: Request) {
  const body: SetServoRequest = await request.json();

  if (typeof body.id !== 'number' || body.id < SERVO_ID_MIN || body.id > SERVO_ID_MAX) {
    return badRequest(`Invalid servo ID (must be ${SERVO_ID_MIN}-${SERVO_ID_MAX})`);
  }

  if (typeof body.angle !== 'number' || body.angle < 0 || body.angle > SERVO_ANGLE_MAX) {
    return badRequest(`Invalid angle (must be 0-${SERVO_ANGLE_MAX})`);
  }

  return proxyESP32(() => setServo(body), 'Failed to set servo');
}
