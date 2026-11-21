'use client';

import { Joystick } from '../Joystick';
import { StopAllButton } from '../StopAllButton';
import { RoverVisualizer } from '../RoverVisualizer';
import { useRobot } from '@/context/RobotContext';
import { MOTOR_IDS } from '@/lib/constants';

export function JoystickTab() {
  const { motors } = useRobot();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <Joystick />

      {/* Визуализация ровера */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <RoverVisualizer />
      </div>

      {/* Статус моторов */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-cyan-400 text-xl font-bold mb-6 text-center">📊 Статус моторов</h2>
        <div className="grid grid-cols-2 gap-4">
          {MOTOR_IDS.map((id) => (
            <div key={id} className="bg-white/5 p-4 rounded-lg text-center">
              <h4 className="text-yellow-400 text-base mb-2">Motor {id}</h4>
              <div className="text-2xl font-bold text-green-400">{motors[`motor${id}` as keyof typeof motors]}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <StopAllButton
            label="🛑 СТОП"
            className="bg-red-500 text-white py-4 px-10 rounded-xl text-lg font-bold cursor-pointer transition-all duration-300 hover:bg-red-400 hover:shadow-lg hover:shadow-red-500/50"
          />
        </div>
      </div>
    </div>
  );
}
