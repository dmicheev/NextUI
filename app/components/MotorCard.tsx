'use client';

import { useState } from 'react';
import { setMotors } from '@/lib/esp32-client';
import type { MotorSpeeds } from '@/types';

function toFullMotorSpeeds(partial: Partial<MotorSpeeds>): MotorSpeeds {
  return {
    motorA: partial.motorA ?? 0,
    motorB: partial.motorB ?? 0,
    motorC: partial.motorC ?? 0,
    motorD: partial.motorD ?? 0,
  };
}

interface MotorCardProps {
  motorId: 'A' | 'B' | 'C' | 'D';
  speed: number;
  onSpeedChange: (motorId: 'A' | 'B' | 'C' | 'D', speed: number) => void;
}

export function MotorCard({ motorId, speed, onSpeedChange }: MotorCardProps) {
  const [localSpeed, setLocalSpeed] = useState(speed);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const motorSpeeds: Partial<MotorSpeeds> = { [`motor${motorId}`]: localSpeed };
      await setMotors(toFullMotorSpeeds(motorSpeeds));
      onSpeedChange(motorId, localSpeed);
    } catch (error) {
      console.error('[MotorCard] Error setting motor:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleQuickSpeed = async (speed: number) => {
    setIsApplying(true);
    try {
      await setMotors({ [`motor${motorId}`]: speed } as any);
      setLocalSpeed(speed);
      onSpeedChange(motorId, speed);
    } catch (error) {
      console.error('[MotorCard] Error setting motor:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-white/8 rounded-xl p-5 border border-white/10">
      <h3 className="text-red-400 text-lg font-bold mb-4">Motor {motorId}</h3>
      
      <div className="flex gap-2 items-center mb-4">
        <button
          onClick={() => handleQuickSpeed(-255)}
          disabled={isApplying}
          className="flex-1 py-4 rounded-lg text-2xl cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 text-white hover:bg-red-400"
        >
          ◀
        </button>
        <button
          onClick={() => handleQuickSpeed(0)}
          disabled={isApplying}
          className="flex-0.5 py-4 rounded-lg text-2xl cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-600 text-white hover:bg-gray-500"
        >
          ■
        </button>
        <button
          onClick={() => handleQuickSpeed(255)}
          disabled={isApplying}
          className="flex-1 py-4 rounded-lg text-2xl cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-green-400 text-gray-900 hover:bg-green-300"
        >
          ▶
        </button>
      </div>

      <div className="text-center text-xl font-bold text-green-400 mb-4">
        Скорость: {localSpeed}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <label className="block mb-2 text-sm text-gray-400">Точная настройка скорости:</label>
        <div className="text-center text-lg font-bold text-yellow-400 mb-3">{localSpeed}</div>
        <input
          type="range"
          min="-255"
          max="255"
          value={localSpeed}
          onChange={(e) => setLocalSpeed(parseInt(e.target.value))}
          className="w-full h-3 rounded-lg outline-none appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #ff6b6b 0%, #888 50%, #00ff88 100%)',
          }}
        />
        <div className="flex gap-2 mt-3">
          <input
            type="number"
            min="-255"
            max="255"
            value={localSpeed}
            onChange={(e) => setLocalSpeed(parseInt(e.target.value) || 0)}
            className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
          />
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="bg-cyan-400 text-gray-900 px-4 py-2 rounded-lg font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-300"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
