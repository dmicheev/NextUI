// API Route: GET/POST /api/servo
// Управление сервоприводами (прокси к ESP32)

import { NextResponse } from 'next/server';
import { getServos, setServo } from '@/lib/esp32-client';
import type { SetServoRequest } from '@/types';

export async function GET() {
  try {
    console.log('[API Servo] GET /api/servo - Starting request');
    const servos = await getServos();
    console.log('[API Servo] GET /api/servo - Success:', servos);
    return NextResponse.json({ servos });
  } catch (error) {
    console.error('[API Servo] GET /api/servo - Error:', error);
    return NextResponse.json(
      { error: 'Failed to get servos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[API Servo] POST /api/servo - Starting request');
    const body: SetServoRequest = await request.json();
    console.log('[API Servo] POST /api/servo - Request body:', body);

    // Валидация
    if (typeof body.id !== 'number' || body.id < 0 || body.id > 15) {
      console.error('[API Servo] POST /api/servo - Invalid servo ID:', body.id);
      return NextResponse.json(
        { error: 'Invalid servo ID (must be 0-15)' },
        { status: 400 }
      );
    }

    if (typeof body.angle !== 'number' || body.angle < 0 || body.angle > 180) {
      console.error('[API Servo] POST /api/servo - Invalid angle:', body.angle);
      return NextResponse.json(
        { error: 'Invalid angle (must be 0-180)' },
        { status: 400 }
      );
    }

    const result = await setServo(body);
    console.log('[API Servo] POST /api/servo - Success:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Servo] POST /api/servo - Error:', error);
    return NextResponse.json(
      { error: 'Failed to set servo', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
