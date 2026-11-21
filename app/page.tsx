'use client';

import { useState, type ComponentType } from 'react';
import { RobotProvider } from '@/context/RobotContext';
import { ToastProvider } from '@/context/ToastContext';
import { useESP32 } from '@/hooks/useESP32';
import { EmergencyStop } from './components/EmergencyStop';
import { StatusBar } from './components/StatusBar';
import { Toast } from './components/Toast';
import { useToast } from '@/context/ToastContext';
import { Tabs, type TabName } from './components/Tabs';
import { ParametersTab } from './components/tabs/ParametersTab';
import { JoystickTab } from './components/tabs/JoystickTab';
import { CameraTab } from './components/tabs/CameraTab';
import { TestTab } from './components/tabs/TestTab';

const TAB_VIEWS: Record<TabName, ComponentType> = {
  parameters: ParametersTab,
  joystick: JoystickTab,
  camera: CameraTab,
  test: TestTab,
};

function RobotControlPanel() {
  const [activeTab, setActiveTab] = useState<TabName>('parameters');
  const { isLoading } = useESP32();
  const { messages, removeMessage } = useToast();

  const ActiveTabView = TAB_VIEWS[activeTab];

  return (
    <div className="max-w-7xl mx-auto py-5 px-4">
      <h1 className="text-center text-4xl mb-8 text-cyan-400" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.5)' }}>
        🤖 Robot Control Panel
      </h1>

      <EmergencyStop />

      <StatusBar />

      <Toast messages={messages} onRemove={removeMessage} />

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-pulse text-cyan-400 text-xl">⏳ Загрузка...</div>
        </div>
      ) : (
        <ActiveTabView />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <RobotProvider>
      <ToastProvider>
        <RobotControlPanel />
      </ToastProvider>
    </RobotProvider>
  );
}
