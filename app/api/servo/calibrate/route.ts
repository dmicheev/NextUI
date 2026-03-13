// API Route: POST /api/servo/calibrate
// Калибровка сервопривода (прокси к ESP32)

import { NextResponse } from 'next/server';
import { calibrateServo } from '@/lib/esp32-client';
import type { CalibrateServoRequest } from '@/types';

export async function POST(request: Request) {
  try {
    console.log('[API Servo Calibrate] POST /api/servo/calibrate - Starting request');
    const body: CalibrateServoRequest = await request.json();
    console.log('[API Servo Calibrate] POST /api/servo/calibrate - Request body:', body);

    // Валидация
    if (typeof body.id !== 'number' || body.id < 0 || body.id > 15) {
      console.error('[API Servo Calibrate] POST /api/servo/calibrate - Invalid servo ID:', body.id);
      return NextResponse.json(
        { error: 'Invalid servo ID (must be 0-15)' },
        { status: 400 }
      );
    }

    if (typeof body.min !== 'number' || body.min < 0 || body.min > 4095) {
      console.error('[API Servo Calibrate] POST /api/servo/calibrate - Invalid min PWM:', body.min);
      return NextResponse.json(
        { error: 'Invalid min PWM (must be 0-4095)' },
        { status: 400 }
      );
    }

    if (typeof body.max !== 'number' || body.max < 0 || body.max > 4095) {
      console.error('[API Servo Calibrate] POST /api/servo/calibrate - Invalid max PWM:', body.max);
      return NextResponse.json(
        { error: 'Invalid max PWM (must be 0-4095)' },
        { status: 400 }
      );
    }

    if (body.min >= body.max) {
      console.error('[API Servo Calibrate] POST /api/servo/calibrate - min >= max:', body.min, body.max);
      return NextResponse.json(
        { error: 'min must be less than max' },
        { status: 400 }
      );
    }

    console.log('[API Servo Calibrate] POST /api/servo/calibrate - Sending calibration to ESP32');
    const result = await calibrateServo(body);
    console.log('[API Servo Calibrate] POST /api/servo/calibrate - Success:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Servo Calibrate] POST /api/servo/calibrate - Error:', error);
    return NextResponse.json(
      { error: 'Failed to calibrate servo', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
