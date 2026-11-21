// API Route: POST /api/joystick
// Управление через джойстик (расчёты движения выполняются на сервере)

import { NextResponse } from 'next/server';
import { setMotors, setServo } from '@/lib/esp32-client';
import { calculateJoystickControl } from '@/lib/joystick-algorithms';
import { badRequest } from '@/lib/api-proxy';
import type { JoystickRequest } from '@/types';

export async function POST(request: Request) {
  const body: JoystickRequest = await request.json();

  if (typeof body.x !== 'number' || body.x < -100 || body.x > 100) {
    return badRequest('Invalid x value (must be -100 to 100)');
  }

  if (typeof body.y !== 'number' || body.y < -100 || body.y > 100) {
    return badRequest('Invalid y value (must be -100 to 100)');
  }

  if (!['drive', 'servo', 'mixed'].includes(body.mode)) {
    return badRequest('Invalid mode (must be drive, servo, or mixed)');
  }

  const control = calculateJoystickControl({ x: body.x, y: body.y }, body.mode);

  // Команды на ESP32: моторы одним запросом, рулевые - по одному на серво.
  // allSettled, чтобы сбой одного запроса не ронял остальные.
  const promises: Promise<unknown>[] = [];

  if (control.motors) {
    promises.push(setMotors(control.motors));
  }

  if (control.servos) {
    const { servo0, servo1, servo2, servo3 } = control.servos;
    promises.push(
      setServo({ id: 0, angle: servo0 }),
      setServo({ id: 1, angle: servo1 }),
      setServo({ id: 2, angle: servo2 }),
      setServo({ id: 3, angle: servo3 }),
    );
  }

  const results = await Promise.allSettled(promises);
  const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

  if (failed.length > 0) {
    console.error('[API Joystick] Some commands failed:', failed.map(f => f.reason));
    return NextResponse.json({
      success: false,
      motors: control.motors,
      servos: control.servos,
      errors: failed.map(f => (f.reason instanceof Error ? f.reason.message : String(f.reason))),
    });
  }

  return NextResponse.json({
    success: true,
    motors: control.motors,
    servos: control.servos,
  });
}
