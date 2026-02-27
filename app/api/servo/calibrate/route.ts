// API Route: POST /api/servo/calibrate
// Калибровка сервопривода (прокси к ESP32)

import { NextResponse } from 'next/server';
import { calibrateServo } from '@/lib/esp32-client';
import type { CalibrateServoRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const body: CalibrateServoRequest = await request.json();
    
    // Валидация
    if (typeof body.id !== 'number' || body.id < 0 || body.id > 15) {
      return NextResponse.json(
        { error: 'Invalid servo ID (must be 0-15)' },
        { status: 400 }
      );
    }
    
    if (typeof body.min !== 'number' || body.min < 0 || body.min > 4095) {
      return NextResponse.json(
        { error: 'Invalid min PWM (must be 0-4095)' },
        { status: 400 }
      );
    }
    
    if (typeof body.max !== 'number' || body.max < 0 || body.max > 4095) {
      return NextResponse.json(
        { error: 'Invalid max PWM (must be 0-4095)' },
        { status: 400 }
      );
    }
    
    if (body.min >= body.max) {
      return NextResponse.json(
        { error: 'min must be less than max' },
        { status: 400 }
      );
    }
    
    const result = await calibrateServo(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error calibrating servo:', error);
    return NextResponse.json(
      { error: 'Failed to calibrate servo' },
      { status: 500 }
    );
  }
}
