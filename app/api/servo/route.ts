// API Route: GET/POST /api/servo
// Управление сервоприводами (прокси к ESP32)

import { NextResponse } from 'next/server';
import { getServos, setServo } from '@/lib/esp32-client';
import type { SetServoRequest } from '@/types';

export async function GET() {
  try {
    const servos = await getServos();
    return NextResponse.json({ servos });
  } catch (error) {
    console.error('[API] Error getting servos:', error);
    return NextResponse.json(
      { error: 'Failed to get servos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: SetServoRequest = await request.json();
    
    // Валидация
    if (typeof body.id !== 'number' || body.id < 0 || body.id > 15) {
      return NextResponse.json(
        { error: 'Invalid servo ID (must be 0-15)' },
        { status: 400 }
      );
    }
    
    if (typeof body.angle !== 'number' || body.angle < 0 || body.angle > 180) {
      return NextResponse.json(
        { error: 'Invalid angle (must be 0-180)' },
        { status: 400 }
      );
    }
    
    const result = await setServo(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error setting servo:', error);
    return NextResponse.json(
      { error: 'Failed to set servo' },
      { status: 500 }
    );
  }
}
