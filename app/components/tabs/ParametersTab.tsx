'use client';

import { useState } from 'react';
import { ServoCard } from '../ServoCard';
import { MotorCard } from '../MotorCard';
import { StopAllButton } from '../StopAllButton';
import { useRobot } from '@/context/RobotContext';
import { useToast } from '@/context/ToastContext';
import { setMotors } from '@/lib/esp32-client';
import { constrain } from '@/lib/joystick-algorithms';
import { MOTOR_IDS, MOTOR_SPEED_MIN, MOTOR_SPEED_MAX } from '@/lib/constants';
import type { MotorId, MotorSpeeds } from '@/types';

const SERVO_IDS = [0, 1, 2, 3];

// Текст полей ввода хранится как строки, чтобы можно было свободно набирать "-255";
// валидация и зажим диапазона выполняются при отправке
const parseSpeed = (text: string): number => {
  const num = parseInt(text, 10);
  return isNaN(num) ? 0 : constrain(num, MOTOR_SPEED_MIN, MOTOR_SPEED_MAX);
};

export function ParametersTab() {
  const { motors, servos } = useRobot();
  const { showError, showSuccess } = useToast();
  const [speedsText, setSpeedsText] = useState<Record<MotorId, string>>({ A: '0', B: '0', C: '0', D: '0' });

  const handleSetAllMotors = async () => {
    const motorsToApply: MotorSpeeds = {
      motorA: parseSpeed(speedsText.A),
      motorB: parseSpeed(speedsText.B),
      motorC: parseSpeed(speedsText.C),
      motorD: parseSpeed(speedsText.D),
    };

    try {
      await setMotors(motorsToApply);
      showSuccess('Скорости моторов установлены');
    } catch (error) {
      console.error('[ParametersTab] Error setting all motors:', error);
      showError('Не удалось установить скорости: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Сервоприводы */}
      <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
        <h2 className="text-cyan-400 text-2xl mb-6 border-b-2 border-cyan-400 pb-3">🔧 Сервоприводы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVO_IDS.map((id) => (
            <ServoCard key={id} id={id} angle={servos[`servo${id}` as keyof typeof servos]} />
          ))}
        </div>
      </div>

      {/* DC Моторы */}
      <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
        <h2 className="text-cyan-400 text-2xl mb-6 border-b-2 border-cyan-400 pb-3">🚗 DC Моторы</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MOTOR_IDS.map((id) => (
            <MotorCard key={id} motorId={id} speed={motors[`motor${id}` as keyof typeof motors]} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <StopAllButton className="bg-red-500 text-white py-3 px-8 rounded-xl text-lg font-bold cursor-pointer transition-all duration-300 hover:bg-red-400 hover:shadow-lg hover:shadow-red-500/50" />
        </div>
      </div>

      {/* Панель управления всеми моторами */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-cyan-400 text-2xl mb-6 border-b-2 border-cyan-400 pb-3">🎛️ Управление всеми моторами</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {MOTOR_IDS.map((id) => (
            <div key={id}>
              <label className="block mb-2 text-sm text-gray-400">Motor {id}:</label>
              <input
                type="number"
                min={MOTOR_SPEED_MIN}
                max={MOTOR_SPEED_MAX}
                value={speedsText[id]}
                onChange={(e) => setSpeedsText(prev => ({ ...prev, [id]: e.target.value }))}
                className="w-full py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSetAllMotors}
          className="w-full bg-cyan-400 text-gray-900 py-4 rounded-xl text-lg font-bold cursor-pointer transition-all duration-200 hover:bg-cyan-300"
        >
          🚀 Установить скорость всех моторов
        </button>
      </div>
    </div>
  );
}
