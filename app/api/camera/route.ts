// API Route: GET/POST /api/camera
// Управление камерой (прокси к ESP32; POST пробрасывается на /api/camera/angle)

import { getCamera, setCamera } from '@/lib/esp32-client';
import { proxyESP32, badRequest } from '@/lib/api-proxy';
import { CAMERA_ANGLE_MAX } from '@/lib/constants';
import type { SetCameraAngleRequest } from '@/types';

export async function GET() {
  return proxyESP32(getCamera, 'Failed to get camera');
}

export async function POST(request: Request) {
  const body: SetCameraAngleRequest = await request.json();

  if (typeof body.pan_angle !== 'number' || body.pan_angle < 0 || body.pan_angle > CAMERA_ANGLE_MAX) {
    return badRequest(`Invalid pan angle (must be 0-${CAMERA_ANGLE_MAX})`);
  }

  if (typeof body.tilt_angle !== 'number' || body.tilt_angle < 0 || body.tilt_angle > CAMERA_ANGLE_MAX) {
    return badRequest(`Invalid tilt angle (must be 0-${CAMERA_ANGLE_MAX})`);
  }

  return proxyESP32(() => setCamera(body), 'Failed to set camera');
}
