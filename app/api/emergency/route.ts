// API Route: POST /api/emergency
// Экстренная остановка: все моторы в стоп + камера в 90/90

import { stopAllMotors, setCamera } from '@/lib/esp32-client';
import { proxyESP32 } from '@/lib/api-proxy';

export async function POST() {
  return proxyESP32(
    async () => {
      await Promise.all([
        stopAllMotors(),
        setCamera({ pan_angle: 90, tilt_angle: 90 }),
      ]);
      return { success: true, message: 'Emergency stop executed' };
    },
    'Failed to execute emergency stop',
  );
}
