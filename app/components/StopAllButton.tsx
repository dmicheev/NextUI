'use client';

import { stopAllMotors } from '@/lib/esp32-client';
import { useRobot } from '@/context/RobotContext';
import { useToast } from '@/context/ToastContext';

interface StopAllButtonProps {
  label?: string;
  className?: string;
}

/**
 * Кнопка остановки всех моторов: ESP32 + сброс локального состояния.
 */
export function StopAllButton({ label = '🛑 Остановить все моторы', className }: StopAllButtonProps) {
  const { stopAllMotors: resetMotorsState } = useRobot();
  const { showError, showSuccess } = useToast();

  const handleStopAll = async () => {
    try {
      await stopAllMotors();
      resetMotorsState();
      showSuccess('Все моторы остановлены');
    } catch (error) {
      console.error('[StopAllButton] Error stopping all motors:', error);
      showError('Не удалось остановить моторы: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  return (
    <button onClick={handleStopAll} className={className}>
      {label}
    </button>
  );
}
