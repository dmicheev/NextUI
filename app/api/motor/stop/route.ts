// API Route: POST /api/motor/stop
// Остановить все моторы (прокси к ESP32)

import { NextResponse } from 'next/server';
import { stopAllMotors } from '@/lib/esp32-client';

export async function POST() {
  try {
    const result = await stopAllMotors();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error stopping motors:', error);
    return NextResponse.json(
      { error: 'Failed to stop motors' },
      { status: 500 }
    );
  }
}
