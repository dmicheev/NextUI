// API Route: POST /api/motor/stop
// Остановить все моторы (прокси к ESP32)

import { NextResponse } from 'next/server';
import { stopAllMotors } from '@/lib/esp32-client';

export async function POST() {
  try {
    console.log('[API Motor Stop] POST /api/motor/stop - Starting request');
    const result = await stopAllMotors();
    console.log('[API Motor Stop] POST /api/motor/stop - Success:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Motor Stop] POST /api/motor/stop - Error:', error);
    return NextResponse.json(
      { error: 'Failed to stop motors', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
