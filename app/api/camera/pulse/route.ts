// API Route: POST /api/camera/pulse
// Импульсное управление камерой (прокси к ESP32)

import { NextResponse } from 'next/server';
import { cameraPulse } from '@/lib/esp32-client';
import type { SetCameraPulseRequest } from '@/types';

const MAX_PULSE_DURATION_MS = 5000;

export async function POST(request: Request) {
  try {
    const body: SetCameraPulseRequest = await request.json();
    
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
    
    // Валидация длительности импульса
    const duration = typeof body.duration_ms === 'number' ? body.duration_ms : 100;
    if (duration < 0 || duration > MAX_PULSE_DURATION_MS) {
      return NextResponse.json(
        { error: `Invalid duration (must be 0-${MAX_PULSE_DURATION_MS}ms)` },
        { status: 400 }
      );
    }
    
    const result = await cameraPulse({ ...body, duration_ms: duration });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error pulsing camera:', error);
    return NextResponse.json(
      { error: 'Failed to pulse camera' },
      { status: 500 }
    );
  }
}
