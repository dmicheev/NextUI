// API Route: POST /api/joystick
// Управление через джойстик (расчёты на сервере)

import { NextResponse } from 'next/server';
import { setMotors, setServo } from '@/lib/esp32-client';
import { calculateJoystickControl } from '@/lib/joystick-algorithms';
import type { JoystickPosition, JoystickMode } from '@/types';

interface JoystickRequest {
  x: number;
  y: number;
  mode: JoystickMode;
  currentServoAngles?: {
    servo0: number;
    servo1: number;
    servo2: number;
    servo3: number;
  };
}

export async function POST(request: Request) {
  try {
    console.log('[API Joystick] POST /api/joystick - Starting request');
    const body: JoystickRequest = await request.json();
    console.log('[API Joystick] POST /api/joystick - Request body:', body);

    // Валидация координат
    if (typeof body.x !== 'number' || body.x < -100 || body.x > 100) {
      console.error('[API Joystick] POST /api/joystick - Invalid x value:', body.x);
      return NextResponse.json(
        { error: 'Invalid x value (must be -100 to 100)' },
        { status: 400 }
      );
    }

    if (typeof body.y !== 'number' || body.y < -100 || body.y > 100) {
      console.error('[API Joystick] POST /api/joystick - Invalid y value:', body.y);
      return NextResponse.json(
        { error: 'Invalid y value (must be -100 to 100)' },
        { status: 400 }
      );
    }

    if (!['drive', 'servo', 'mixed'].includes(body.mode)) {
      console.error('[API Joystick] POST /api/joystick - Invalid mode:', body.mode);
      return NextResponse.json(
        { error: 'Invalid mode (must be drive, servo, or mixed)' },
        { status: 400 }
      );
    }

    // Расчёт управления на сервере
    const position: JoystickPosition = { x: body.x, y: body.y };
    const control = calculateJoystickControl(
      position,
      body.mode,
      body.currentServoAngles || { servo0: 90, servo1: 90, servo2: 90, servo3: 90 }
    );

    console.log('[API Joystick] POST /api/joystick - Calculated control:', control);

    // Отправляем команды на ESP32
    const promises: Promise<any>[] = [];

    if (control.motors) {
      console.log('[API Joystick] POST /api/joystick - Sending motors to ESP32:', control.motors);
      promises.push(setMotors(control.motors));
    }

    if (control.servos) {
      console.log('[API Joystick] POST /api/joystick - Sending servos to ESP32:', control.servos);
      // Отправляем команды для всех сервоприводов
      promises.push(setServo({ id: 0, angle: control.servos.servo0 }));
      promises.push(setServo({ id: 1, angle: control.servos.servo1 }));
      promises.push(setServo({ id: 2, angle: control.servos.servo2 }));
      promises.push(setServo({ id: 3, angle: control.servos.servo3 }));
    }

    await Promise.all(promises);

    console.log('[API Joystick] POST /api/joystick - Success');
    return NextResponse.json({
      success: true,
      motors: control.motors,
      servos: control.servos
    });
  } catch (error) {
    console.error('[API Joystick] POST /api/joystick - Error:', error);
    return NextResponse.json(
      { error: 'Failed to process joystick input', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
