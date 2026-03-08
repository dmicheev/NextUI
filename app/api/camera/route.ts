// API Route: GET/POST /api/camera
// Управление камерой (прокси к ESP32)

import { NextResponse } from 'next/server';
import { getCamera, setCamera } from '@/lib/esp32-client';
import type { SetCameraAngleRequest } from '@/types';

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
    const body: SetCameraAngleRequest = await request.json();

    // Валидация углов (0-180)
    if (typeof body.pan_angle !== 'number' || body.pan_angle < 0 || body.pan_angle > 180) {
      return NextResponse.json(
        { error: 'Invalid pan angle (must be 0-180)' },
        { status: 400 }
      );
    }

    if (typeof body.tilt_angle !== 'number' || body.tilt_angle < 0 || body.tilt_angle > 180) {
      return NextResponse.json(
        { error: 'Invalid tilt angle (must be 0-180)' },
        { status: 400 }
      );
    }

    const result = await setCamera(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error setting camera:', error);
    return NextResponse.json(
      { error: 'Failed to set camera' },
      { status: 500 }
    );
  }
}
