// API Route: POST /api/motor/stop
// Остановить все моторы (прокси к ESP32)

import { stopAllMotors } from '@/lib/esp32-client';
import { proxyESP32 } from '@/lib/api-proxy';

export async function POST() {
  return proxyESP32(stopAllMotors, 'Failed to stop motors');
}
