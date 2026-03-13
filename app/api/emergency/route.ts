// API Route: POST /api/emergency
// Экстренная остановка всех систем (прокси к ESP32)

import { NextResponse } from 'next/server';
import { emergencyStop } from '@/lib/esp32-client';

export async function POST() {
  try {
    console.log('[API Emergency] POST /api/emergency - Starting request');
    await emergencyStop();
    console.log('[API Emergency] POST /api/emergency - Success');
    return NextResponse.json({ success: true, message: 'Emergency stop executed' });
  } catch (error) {
    console.error('[API Emergency] POST /api/emergency - Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute emergency stop', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
