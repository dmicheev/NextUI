'use client';

import { useRobot } from '@/context/RobotContext';

export function StatusBar() {
  const { isOnline, systemIP } = useRobot();

  return (
    <div className="bg-white/10 p-4 rounded-xl mb-8 flex justify-between items-center flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]' : 'bg-red-500'}`} />
        <span className="text-sm">{isOnline ? 'System Online' : 'System Offline'}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">IP: <strong className="text-cyan-400">{systemIP}</strong></span>
      </div>
      <a
        href="http://192.168.1.108:8080/api/ota"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gradient-to-r from-cyan-400 to-green-400 text-gray-900 px-4 py-2 rounded-lg text-sm font-bold no-underline transition-all duration-200 shadow-lg shadow-cyan-400/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-400/50"
      >
        🔄 OTA Update
      </a>
    </div>
  );
}
