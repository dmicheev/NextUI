// API Route: GET /api/status
// Получить статус системы (прокси к ESP32)

import { NextResponse } from 'next/server';
import { getSystemStatus } from '@/lib/esp32-client';

export async function GET() {
  try {
    console.log('[API Status] GET /api/status - Starting request');
    const status = await getSystemStatus();
    console.log('[API Status] GET /api/status - Success:', status);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[API Status] GET /api/status - Error:', error);
    return NextResponse.json(
      { error: 'Failed to get system status', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
