// API Route: POST /api/emergency
// Экстренная остановка всех систем (прокси к ESP32)

import { NextResponse } from 'next/server';
import { emergencyStop } from '@/lib/esp32-client';

export async function POST() {
  try {
    await emergencyStop();
    return NextResponse.json({ success: true, message: 'Emergency stop executed' });
  } catch (error) {
    console.error('[API] Error executing emergency stop:', error);
    return NextResponse.json(
      { error: 'Failed to execute emergency stop' },
      { status: 500 }
    );
  }
}
