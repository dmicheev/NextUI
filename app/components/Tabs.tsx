'use client';

export type TabName = 'parameters' | 'joystick' | 'camera' | 'test';

const TABS: Array<{ name: TabName; label: string }> = [
  { name: 'parameters', label: '🎛️ Параметры' },
  { name: 'joystick', label: '🕹️ Джойстик' },
  { name: 'camera', label: '📷 Камера' },
  { name: 'test', label: '🧪 Тест ИИ' },
];

interface TabsProps {
  onTabChange: (tab: TabName) => void;
  activeTab: TabName;
}

export function Tabs({ onTabChange, activeTab }: TabsProps) {
  return (
    <div className="mb-5">
      <div className="flex gap-3 bg-white/5 p-3 rounded-xl">
        {TABS.map(({ name, label }) => (
          <button
            key={name}
            onClick={() => onTabChange(name)}
            className={`flex-1 py-4 px-8 rounded-lg text-base font-bold cursor-pointer transition-all duration-300 border-2 ${
              activeTab === name
                ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.3)]'
                : 'bg-white/10 border-transparent text-gray-400 hover:bg-white/15 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
