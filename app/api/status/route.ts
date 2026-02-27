// API Route: GET /api/status
// Получить статус системы (прокси к ESP32)

import { NextResponse } from 'next/server';
import { getSystemStatus } from '@/lib/esp32-client';

export async function GET() {
  try {
    const status = await getSystemStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[API] Error getting status:', error);
    return NextResponse.json(
      { error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}
