'use client';

import { useState } from 'react';
import { useRobot } from '@/context/RobotContext';
import { stopAllMotors as stopAllMotorsAPI } from '@/lib/esp32-client';

export function EmergencyStop() {
  const { stopAllMotors: stopAllMotorsState } = useRobot();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleEmergencyStop = async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    try {
      // Останавливаем все моторы на ESP32
      await stopAllMotorsAPI();
      // Обновляем состояние
      stopAllMotorsState();
    } catch (error) {
      console.error('[EmergencyStop] Error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-6 mb-8 text-center">
      <h2 className="text-red-500 text-2xl font-bold mb-4">🚨 ЭКСТРЕННАЯ ОСТАНОВКА</h2>
      <button
        onClick={handleEmergencyStop}
        disabled={isExecuting}
        className="bg-gradient-to-r from-red-500 to-red-700 text-white border-none px-10 py-5 rounded-xl text-xl font-bold cursor-pointer transition-all duration-300 shadow-lg shadow-red-500/50 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-600 hover:to-red-800 hover:shadow-xl hover:shadow-red-500/70 hover:scale-105 active:scale-95"
      >
        🛑 СТОП ВСЁ
      </button>
    </div>
  );
}
