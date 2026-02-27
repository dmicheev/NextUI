// API Route: GET/POST /api/motor
// Управление моторами (прокси к ESP32 с расчётами на сервере)

import { NextResponse } from 'next/server';
import { getMotors, setMotors } from '@/lib/esp32-client';
import { calculateTankDrive, constrain } from '@/lib/joystick-algorithms';
import type { MotorSpeeds, SetMotorRequest } from '@/types';

export async function GET() {
  try {
    const motors = await getMotors();
    return NextResponse.json(motors);
  } catch (error) {
    console.error('[API] Error getting motors:', error);
    return NextResponse.json(
      { error: 'Failed to get motors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: SetMotorRequest = await request.json();
    
    // Валидация скоростей моторов
    const motors: MotorSpeeds = {
      motorA: typeof body.motorA === 'number' ? body.motorA : 0,
      motorB: typeof body.motorB === 'number' ? body.motorB : 0,
      motorC: typeof body.motorC === 'number' ? body.motorC : 0,
      motorD: typeof body.motorD === 'number' ? body.motorD : 0,
    };
    
    for (const [key, value] of Object.entries(motors)) {
      if (value < -255 || value > 255) {
        return NextResponse.json(
          { error: `Invalid ${key} speed (must be -255 to 255)` },
          { status: 400 }
        );
      }
    }
    
    // Отправляем команды на ESP32
    const result = await setMotors(motors);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error setting motors:', error);
    return NextResponse.json(
      { error: 'Failed to set motors' },
      { status: 500 }
    );
  }
}


