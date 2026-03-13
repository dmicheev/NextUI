// API Route: GET/POST /api/motor
// Управление моторами (прокси к ESP32 с расчётами на сервере)

import { NextResponse } from 'next/server';
import { getMotors, setMotors } from '@/lib/esp32-client';
import { calculateTankDrive, constrain } from '@/lib/joystick-algorithms';
import type { MotorSpeeds, SetMotorRequest } from '@/types';

export async function GET() {
  try {
    console.log('[API Motor] GET /api/motor - Starting request');
    const motors = await getMotors();
    console.log('[API Motor] GET /api/motor - Success:', motors);
    return NextResponse.json(motors);
  } catch (error) {
    console.error('[API Motor] GET /api/motor - Error:', error);
    return NextResponse.json(
      { error: 'Failed to get motors', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[API Motor] POST /api/motor - Starting request');
    const body: SetMotorRequest = await request.json();
    console.log('[API Motor] POST /api/motor - Request body:', body);

    // Валидация скоростей моторов
    const motors: MotorSpeeds = {
      motorA: typeof body.motorA === 'number' ? body.motorA : 0,
      motorB: typeof body.motorB === 'number' ? body.motorB : 0,
      motorC: typeof body.motorC === 'number' ? body.motorC : 0,
      motorD: typeof body.motorD === 'number' ? body.motorD : 0,
    };

    for (const [key, value] of Object.entries(motors)) {
      if (value < -255 || value > 255) {
        console.error('[API Motor] POST /api/motor - Invalid speed for', key, ':', value);
        return NextResponse.json(
          { error: `Invalid ${key} speed (must be -255 to 255)` },
          { status: 400 }
        );
      }
    }

    console.log('[API Motor] POST /api/motor - Sending motors to ESP32:', motors);
    // Отправляем команды на ESP32
    const result = await setMotors(motors);
    console.log('[API Motor] POST /api/motor - Success:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Motor] POST /api/motor - Error:', error);
    return NextResponse.json(
      { error: 'Failed to set motors', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


