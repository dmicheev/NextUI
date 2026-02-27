'use client';

import { useState } from 'react';
import { setServo as setServoAPI, calibrateServo } from '@/lib/esp32-client';

interface ServoCardProps {
  id: number;
  angle: number;
  min: number;
  max: number;
  onAngleChange: (id: number, angle: number) => void;
}

export function ServoCard({ id, angle, min, max, onAngleChange }: ServoCardProps) {
  const [localAngle, setLocalAngle] = useState(angle);
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await setServoAPI({ id, angle: localAngle });
      onAngleChange(id, localAngle);
    } catch (error) {
      console.error('[ServoCard] Error setting servo:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCalibrate = async () => {
    setIsApplying(true);
    try {
      await calibrateServo({ id, min: localMin, max: localMax });
    } catch (error) {
      console.error('[ServoCard] Error calibrating servo:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-white/8 rounded-xl p-5 border border-white/10">
      <h3 className="text-yellow-400 text-lg font-bold mb-4">Servo {id}</h3>
      
      <div className="mb-4">
        <label className="block mb-2 text-sm text-gray-400">
          Угол: <span className="text-cyan-400 text-2xl font-bold ml-2">{localAngle}</span>°
        </label>
        <input
          type="range"
          min="0"
          max="180"
          value={localAngle}
          onChange={(e) => setLocalAngle(parseInt(e.target.value))}
          className="w-full h-2 rounded-lg bg-gray-700 outline-none appearance-none cursor-pointer"
          style={{
            background: 'linear-gradient(to right, #ff6b6b 0%, #888 50%, #00ff88 100%)',
          }}
        />
      </div>

      <button
        onClick={handleApply}
        disabled={isApplying}
        className="w-full bg-cyan-400 text-gray-900 py-2 rounded-lg font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-300"
      >
        Применить
      </button>

      <div className="mt-4 pt-4 border-t border-white/10">
        <h4 className="text-sm text-gray-400 mb-3">Калибровка</h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localMin}
            onChange={(e) => setLocalMin(parseInt(e.target.value) || 0)}
            className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
          />
          <input
            type="number"
            placeholder="Max"
            value={localMax}
            onChange={(e) => setLocalMax(parseInt(e.target.value) || 0)}
            className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
          />
        </div>
        <button
          onClick={handleCalibrate}
          disabled={isApplying}
          className="w-full mt-3 bg-yellow-400 text-gray-900 py-2 rounded-lg font-bold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300"
        >
          Калибровать
        </button>
      </div>
    </div>
  );
}
