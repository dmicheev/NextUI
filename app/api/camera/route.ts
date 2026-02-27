// API Route: GET/POST /api/camera
// Управление камерой (прокси к ESP32)

import { NextResponse } from 'next/server';
import { getCamera, setCameraPWM } from '@/lib/esp32-client';
import type { SetCameraPWMRequest } from '@/types';

export async function GET() {
  try {
    const camera = await getCamera();
    return NextResponse.json(camera);
  } catch (error) {
    console.error('[API] Error getting camera:', error);
    return NextResponse.json(
      { error: 'Failed to get camera' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: SetCameraPWMRequest = await request.json();
    
    // Валидация PWM значений
    if (typeof body.pan_pwm !== 'number' || body.pan_pwm < 0 || body.pan_pwm > 4095) {
      return NextResponse.json(
        { error: 'Invalid pan PWM (must be 0-4095)' },
        { status: 400 }
      );
    }
    
    if (typeof body.tilt_pwm !== 'number' || body.tilt_pwm < 0 || body.tilt_pwm > 4095) {
      return NextResponse.json(
        { error: 'Invalid tilt PWM (must be 0-4095)' },
        { status: 400 }
      );
    }
    
    const result = await setCameraPWM(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error setting camera:', error);
    return NextResponse.json(
      { error: 'Failed to set camera' },
      { status: 500 }
    );
  }
}
