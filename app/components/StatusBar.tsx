'use client';

import { useRobot } from '@/context/RobotContext';
import { ESP32_API_BASE } from '@/lib/esp32-client';

export function StatusBar() {
  const { isOnline, systemIP } = useRobot();

  return (
    <div className="bg-white/10 p-4 rounded-xl mb-8 flex justify-between items-center flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'bg-red-500'} ${!isOnline ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-semibold">
          {isOnline ? '✅ System Online' : '❌ System Offline'}
        </span>
        {!isOnline && (
          <span className="text-xs text-red-400 ml-2">
            (Проверьте подключение к ESP32)
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">IP: <strong className="text-cyan-400">{systemIP}</strong></span>
      </div>
      <a
        href={`${ESP32_API_BASE}/api/ota`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-cyan-400 to-green-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold no-underline transition-all duration-200 shadow-lg shadow-cyan-400/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-400/50"
      >
        🔄 OTA Update
      </a>
    </div>
  );
}
