// API Route: GET /api/status
// Статус системы (прокси к ESP32)

import { getSystemStatus } from '@/lib/esp32-client';
import { proxyESP32 } from '@/lib/api-proxy';

export async function GET() {
  return proxyESP32(getSystemStatus, 'Failed to get system status');
}
