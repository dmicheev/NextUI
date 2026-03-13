'use client';

import { useState } from 'react';

type TabName = 'parameters' | 'joystick' | 'camera' | 'test';

interface TabsProps {
  onTabChange: (tab: TabName) => void;
  activeTab: TabName;
}

export function Tabs({ onTabChange, activeTab }: TabsProps) {
  return (
    <div className="mb-5">
      <div className="flex gap-3 bg-white/5 p-3 rounded-xl">
        <button
          onClick={() => onTabChange('parameters')}
          className={`flex-1 py-4 px-8 rounded-lg text-base font-bold cursor-pointer transition-all duration-300 border-2 ${
            activeTab === 'parameters'
              ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
              : 'bg-white/10 border-transparent text-gray-400 hover:bg-white/15 hover:text-white'
          }`}
        >
          🎛️ Параметры
        </button>
        <button
          onClick={() => onTabChange('joystick')}
          className={`flex-1 py-4 px-8 rounded-lg text-base font-bold cursor-pointer transition-all duration-300 border-2 ${
            activeTab === 'joystick'
              ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
              : 'bg-white/10 border-transparent text-gray-400 hover:bg-white/15 hover:text-white'
          }`}
        >
          🕹️ Джойстик
        </button>
        <button
          onClick={() => onTabChange('camera')}
          className={`flex-1 py-4 px-8 rounded-lg text-base font-bold cursor-pointer transition-all duration-300 border-2 ${
            activeTab === 'camera'
              ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
              : 'bg-white/10 border-transparent text-gray-400 hover:bg-white/15 hover:text-white'
          }`}
        >
          📷 Камера
        </button>
        <button
          onClick={() => onTabChange('test')}
          className={`flex-1 py-4 px-8 rounded-lg text-base font-bold cursor-pointer transition-all duration-300 border-2 ${
            activeTab === 'test'
              ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
              : 'bg-white/10 border-transparent text-gray-400 hover:bg-white/15 hover:text-white'
          }`}
        >
          🧪 Тест ИИ
        </button>
      </div>
    </div>
  );
}
