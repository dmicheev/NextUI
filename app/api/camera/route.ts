// API Route: GET/POST /api/camera
// Управление камерой (прокси к ESP32)

import { NextResponse } from 'next/server';
import { getCamera, fetchWithTimeout, ESP32_API_BASE } from '@/lib/esp32-client';
import type { SetCameraAngleRequest } from '@/types';

export async function GET() {
  try {
    console.log('[API Camera] GET /api/camera - Starting request');
    const camera = await getCamera();
    console.log('[API Camera] GET /api/camera - Success:', camera);
    return NextResponse.json(camera);
  } catch (error) {
    console.error('[API Camera] GET /api/camera - Error:', error);
    return NextResponse.json(
      { error: 'Failed to get camera' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[API Camera] POST /api/camera - Starting request');
    const body: SetCameraAngleRequest = await request.json();
    console.log('[API Camera] POST /api/camera - Request body:', body);

    // Валидация углов (0-180)
    if (typeof body.pan_angle !== 'number' || body.pan_angle < 0 || body.pan_angle > 180) {
      console.error('[API Camera] POST /api/camera - Invalid pan angle:', body.pan_angle);
      return NextResponse.json(
        { error: 'Invalid pan angle (must be 0-180)' },
        { status: 400 }
      );
    }

    if (typeof body.tilt_angle !== 'number' || body.tilt_angle < 0 || body.tilt_angle > 180) {
      console.error('[API Camera] POST /api/camera - Invalid tilt angle:', body.tilt_angle);
      return NextResponse.json(
        { error: 'Invalid tilt angle (must be 0-180)' },
        { status: 400 }
      );
    }

    console.log('[API Camera] POST /api/camera - Sending request to ESP32:', ESP32_API_BASE + '/api/camera/angle');
    const response = await fetchWithTimeout(ESP32_API_BASE + '/api/camera/angle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Camera] POST /api/camera - ESP32 returned error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to set camera', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('[API Camera] POST /api/camera - Success:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Camera] POST /api/camera - Exception:', error);
    return NextResponse.json(
      { error: 'Failed to set camera', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
