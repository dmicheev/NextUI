'use client';

import { useRef, useEffect } from 'react';
import { useJoystick } from '@/hooks/useJoystick';
import { useRobot } from '@/context/RobotContext';

export function Joystick() {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const { position, isDragging, updatePosition, startDrag, endDrag, reset } = useJoystick();
  const { joystickMode, setJoystickMode } = useRobot();
  const maxRadius = 70;

  // Обработка событий мыши и тач
  useEffect(() => {
    const container = containerRef.current;
    const knob = knobRef.current;
    if (!container || !knob) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > maxRadius) {
        const angle = Math.atan2(dy, dx);
        dx = Math.cos(angle) * maxRadius;
        dy = Math.sin(angle) * maxRadius;
      }

      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

      const x = Math.round((dx / maxRadius) * 100);
      const y = Math.round(-(dy / maxRadius) * 100);
      updatePosition(x, y);
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      startDrag();
      knob.style.transition = 'none';
    };

    const handleEnd = () => {
      endDrag();
      knob.style.transition = 'transform 0.3s';
      knob.style.transform = 'translate(-50%, -50%)';
    };

    // Mouse events
    knob.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Touch events
    knob.addEventListener('touchstart', handleStart);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      knob.removeEventListener('mousedown', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      knob.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, startDrag, endDrag, updatePosition, maxRadius]);

  return (
    <div className="bg-white/5 rounded-xl p-8 border border-white/10">
      <h2 className="text-cyan-400 text-xl font-bold mb-6 text-center">🕹️ Виртуальный джойстик</h2>

      <div
        ref={containerRef}
        className="relative w-52 h-52 mx-auto bg-white/10 rounded-full border-3 border-cyan-400/30"
        style={{ touchAction: 'none' }}
      >
        <div
          ref={knobRef}
          className="absolute w-16 h-16 bg-gradient-to-br from-cyan-400 to-green-400 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-lg shadow-cyan-400/50 transition-shadow duration-200"
          style={{
            boxShadow: isDragging ? '0 6px 20px rgba(0, 217, 255, 0.8)' : '0 4px 15px rgba(0, 217, 255, 0.5)',
          }}
        />
      </div>

      <div className="mt-6 text-center">
        <div className="text-lg text-green-400 mb-2">
          X: <span className="font-bold">{position.x}</span>
        </div>
        <div className="text-lg text-green-400">
          Y: <span className="font-bold">{position.y}</span>
        </div>
      </div>

      <div className="flex gap-3 mt-6 justify-center">
        <button
          onClick={() => setJoystickMode('drive')}
          className={`py-3 px-5 rounded-lg text-sm font-bold cursor-pointer transition-all duration-200 border-2 ${
            joystickMode === 'drive'
              ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400'
              : 'bg-white/10 border-transparent text-gray-400 hover:bg-white/15 hover:text-white'
          }`}
        >
          🚗 Езда
        </button>
        <button
          onClick={() => setJoystickMode('servo')}
          className={`py-3 px-5 rounded-lg text-sm font-bold cursor-pointer transition-all duration-200 border-2 ${
            joystickMode === 'servo'
              ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400'
              : 'bg-white/10 border-transparent text-gray-400 hover:bg-white/15 hover:text-white'
          }`}
        >
          🔧 Серво
        </button>
        <button
          onClick={() => setJoystickMode('mixed')}
          className={`py-3 px-5 rounded-lg text-sm font-bold cursor-pointer transition-all duration-200 border-2 ${
            joystickMode === 'mixed'
              ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400'
              : 'bg-white/10 border-transparent text-gray-400 hover:bg-white/15 hover:text-white'
          }`}
        >
          🎯 Микс
        </button>
      </div>
    </div>
  );
}
