'use client';

import { useState } from 'react';
import { RobotProvider } from '@/context/RobotContext';
import { useESP32 } from '@/hooks/useESP32';
import { useRobot } from '@/context/RobotContext';
import { EmergencyStop } from './components/EmergencyStop';
import { StatusBar } from './components/StatusBar';
import { Tabs } from './components/Tabs';
import { ServoCard } from './components/ServoCard';
import { MotorCard } from './components/MotorCard';
import { Joystick } from './components/Joystick';
import { CameraStream } from './components/CameraStream';
import { RoverVisualizer } from './components/RoverVisualizer';
import { stopAllMotors, setMotors } from '@/lib/esp32-client';

type TabName = 'parameters' | 'joystick' | 'camera';

function RobotControlPanel() {
  const [activeTab, setActiveTab] = useState<TabName>('parameters');
  const { isLoading } = useESP32();
  const { motors, servos } = useRobot();

  const handleStopAll = async () => {
    try {
      await stopAllMotors();
    } catch (error) {
      console.error('[Page] Error stopping all motors:', error);
    }
  };

  const handleSetAllMotors = async () => {
    const motorA = parseInt((document.getElementById('all-motorA') as HTMLInputElement)?.value || '0');
    const motorB = parseInt((document.getElementById('all-motorB') as HTMLInputElement)?.value || '0');
    const motorC = parseInt((document.getElementById('all-motorC') as HTMLInputElement)?.value || '0');
    const motorD = parseInt((document.getElementById('all-motorD') as HTMLInputElement)?.value || '0');

    if ([motorA, motorB, motorC, motorD].some(s => s < -255 || s > 255)) {
      alert('Ошибка: скорость должна быть от -255 до 255');
      return;
    }

    try {
      await setMotors({ motorA, motorB, motorC, motorD });
    } catch (error) {
      console.error('[Page] Error setting all motors:', error);
    }
  };

  const validateMotorInput = (value: string, motorId: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return 0;
    return Math.max(-255, Math.min(255, numValue));
  };

  return (
    <div className="max-w-7xl mx-auto py-5 px-4">
      <h1 className="text-center text-4xl mb-8 text-cyan-400" style={{ textShadow: '0 0 10px rgba(0, 217, 255, 0.5)' }}>
        🤖 Robot Control Panel
      </h1>

      <EmergencyStop />

      <StatusBar />

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-pulse text-cyan-400 text-xl">⏳ Загрузка...</div>
        </div>
      ) : (
        <>
          {/* Вкладка 1: Параметры */}
          {activeTab === 'parameters' && (
            <div className="animate-fade-in">
              {/* Сервоприводы */}
              <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                <h2 className="text-cyan-400 text-2xl mb-6 border-b-2 border-cyan-400 pb-3">🔧 Сервоприводы</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <ServoCard id={0} angle={servos.servo0} min={140} max={480} onAngleChange={() => {}} />
                  <ServoCard id={1} angle={servos.servo1} min={140} max={480} onAngleChange={() => {}} />
                  <ServoCard id={2} angle={servos.servo2} min={140} max={480} onAngleChange={() => {}} />
                  <ServoCard id={3} angle={servos.servo3} min={140} max={480} onAngleChange={() => {}} />
                </div>
              </div>

              {/* DC Моторы */}
              <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                <h2 className="text-cyan-400 text-2xl mb-6 border-b-2 border-cyan-400 pb-3">🚗 DC Моторы</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <MotorCard motorId="A" speed={motors.motorA} onSpeedChange={() => {}} />
                  <MotorCard motorId="B" speed={motors.motorB} onSpeedChange={() => {}} />
                  <MotorCard motorId="C" speed={motors.motorC} onSpeedChange={() => {}} />
                  <MotorCard motorId="D" speed={motors.motorD} onSpeedChange={() => {}} />
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={handleStopAll}
                    className="bg-red-500 text-white py-3 px-8 rounded-xl text-lg font-bold cursor-pointer transition-all duration-300 hover:bg-red-400 hover:shadow-lg hover:shadow-red-500/50"
                  >
                    🛑 Остановить все моторы
                  </button>
                </div>
              </div>

              {/* Панель управления всеми моторами */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-cyan-400 text-2xl mb-6 border-b-2 border-cyan-400 pb-3">🎛️ Управление всеми моторами</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Motor A:</label>
                    <input
                      id="all-motorA"
                      type="number"
                      min="-255"
                      max="255"
                      defaultValue="0"
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input === '') {
                          e.target.value = '0';
                        } else {
                          const num = parseInt(input);
                          if (!isNaN(num)) {
                            e.target.value = Math.max(-255, Math.min(255, num)).toString();
                          }
                        }
                      }}
                      className="w-full py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Motor B:</label>
                    <input
                      id="all-motorB"
                      type="number"
                      min="-255"
                      max="255"
                      defaultValue="0"
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input === '') {
                          e.target.value = '0';
                        } else {
                          const num = parseInt(input);
                          if (!isNaN(num)) {
                            e.target.value = Math.max(-255, Math.min(255, num)).toString();
                          }
                        }
                      }}
                      className="w-full py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Motor C:</label>
                    <input
                      id="all-motorC"
                      type="number"
                      min="-255"
                      max="255"
                      defaultValue="0"
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input === '') {
                          e.target.value = '0';
                        } else {
                          const num = parseInt(input);
                          if (!isNaN(num)) {
                            e.target.value = Math.max(-255, Math.min(255, num)).toString();
                          }
                        }
                      }}
                      className="w-full py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm text-gray-400">Motor D:</label>
                    <input
                      id="all-motorD"
                      type="number"
                      min="-255"
                      max="255"
                      defaultValue="0"
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input === '') {
                          e.target.value = '0';
                        } else {
                          const num = parseInt(input);
                          if (!isNaN(num)) {
                            e.target.value = Math.max(-255, Math.min(255, num)).toString();
                          }
                        }
                      }}
                      className="w-full py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base"
                    />
                  </div>
                </div>
                <button onClick={handleSetAllMotors} className="w-full bg-cyan-400 text-gray-900 py-4 rounded-xl text-lg font-bold cursor-pointer transition-all duration-200 hover:bg-cyan-300">
                  🚀 Установить скорость всех моторов
                </button>
              </div>
            </div>
          )}

          {/* Вкладка 2: Джойстик */}
          {activeTab === 'joystick' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              <Joystick />

              {/* Статус моторов */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-cyan-400 text-xl font-bold mb-6 text-center">📊 Статус моторов</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg text-center">
                    <h4 className="text-yellow-400 text-base mb-2">Motor A</h4>
                    <div className="text-2xl font-bold text-green-400">{motors.motorA}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg text-center">
                    <h4 className="text-yellow-400 text-base mb-2">Motor B</h4>
                    <div className="text-2xl font-bold text-green-400">{motors.motorB}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg text-center">
                    <h4 className="text-yellow-400 text-base mb-2">Motor C</h4>
                    <div className="text-2xl font-bold text-green-400">{motors.motorC}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg text-center">
                    <h4 className="text-yellow-400 text-base mb-2">Motor D</h4>
                    <div className="text-2xl font-bold text-green-400">{motors.motorD}</div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <button
                    onClick={handleStopAll}
                    className="bg-red-500 text-white py-4 px-10 rounded-xl text-lg font-bold cursor-pointer transition-all duration-300 hover:bg-red-400 hover:shadow-lg hover:shadow-red-500/50"
                  >
                    🛑 СТОП
                  </button>
                </div>

                {/* Визуализация ровера */}
                <RoverVisualizer />
              </div>
            </div>
          )}

          {/* Вкладка 3: Камера */}
          {activeTab === 'camera' && (
            <div className="animate-fade-in">
              <CameraStream />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <RobotProvider>
      <RobotControlPanel />
    </RobotProvider>
  );
}
