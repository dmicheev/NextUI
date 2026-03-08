'use client';

import { useState, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { CAMERA_STREAM_URL } from '@/lib/esp32-client';

export function CameraStream() {
  const { panAngle, tiltAngle, setAngles } = useCamera();
  const [customStreamURL, setCustomStreamURL] = useState(CAMERA_STREAM_URL);
  const [isConnected, setIsConnected] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setCustomStreamURL(CAMERA_STREAM_URL);
  }, []);

  const handleImageLoad = () => {
    setIsConnected(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsConnected(false);
    setImageError(true);
  };

  const handleUpdateURL = () => {
    setCustomStreamURL(customStreamURL);
  };

  return (
    <div className="bg-white/5 rounded-xl p-8 border border-white/10">
      <h2 className="text-cyan-400 text-xl font-bold mb-6 text-center">📷 Камера</h2>

      {/* Настройка IP адреса камеры */}
      <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
        <label className="block mb-3 text-sm text-gray-400">IP адрес камеры:</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={customStreamURL}
            onChange={(e) => setCustomStreamURL(e.target.value)}
            className="flex-1 py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base"
            placeholder="http://192.168.1.111:81/"
          />
          <button
            onClick={handleUpdateURL}
            className="bg-cyan-400 text-gray-900 px-6 py-3 rounded-lg font-bold cursor-pointer transition-all duration-200 hover:bg-cyan-300"
          >
            Обновить
          </button>
        </div>
      </div>

      {/* Видеопоток */}
      <div className="mb-8">
        {imageError ? (
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-8 text-center">
            <p className="text-red-400 text-lg mb-2">❌ Ошибка подключения к камере</p>
            <p className="text-gray-400 text-sm">URL: {customStreamURL}</p>
          </div>
        ) : (
          <div className="relative bg-black/20 rounded-xl overflow-hidden border-2 border-white/10">
            <img
              src={customStreamURL}
              alt="Camera Stream"
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="w-full h-auto block"
              style={{ minHeight: '300px' }}
            />
            {!isConnected && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-lg animate-pulse">⏳ Загрузка...</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Управление углами камеры */}
      <div className="space-y-6">
        {/* Pan Control */}
        <div>
          <label className="block mb-2 text-sm text-gray-400">
            Pan (горизонтально): <span className="text-cyan-400 font-bold">{panAngle}°</span>
          </label>
          <input
            type="range"
            min="0"
            max="180"
            value={panAngle}
            onChange={(e) => setAngles(parseInt(e.target.value), tiltAngle)}
            className="w-full h-2 rounded-lg bg-gray-700 outline-none appearance-none cursor-pointer"
          />
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              min="0"
              max="180"
              value={panAngle}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setAngles(Math.max(0, Math.min(180, val)), tiltAngle);
              }}
              className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
            />
          </div>
        </div>

        {/* Tilt Control */}
        <div>
          <label className="block mb-2 text-sm text-gray-400">
            Tilt (вертикально): <span className="text-cyan-400 font-bold">{tiltAngle}°</span>
          </label>
          <input
            type="range"
            min="0"
            max="180"
            value={tiltAngle}
            onChange={(e) => setAngles(panAngle, parseInt(e.target.value))}
            className="w-full h-2 rounded-lg bg-gray-700 outline-none appearance-none cursor-pointer"
          />
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              min="0"
              max="180"
              value={tiltAngle}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setAngles(panAngle, Math.max(0, Math.min(180, val)));
              }}
              className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
            />
          </div>
        </div>

        {/* Быстрые пресеты */}
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-yellow-500 text-base mb-4">⚡ Быстрые пресеты</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              onClick={() => setAngles(90, 90)}
              className="bg-green-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-green-400/30 border border-green-400 text-green-400 font-bold"
            >
              🎯 Центр (90°, 90°)
            </button>
            <button
              onClick={() => setAngles(0, 90)}
              className="bg-cyan-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-cyan-400/30 border border-cyan-400 text-cyan-400 font-bold"
            >
              ◀ Лево (0°, 90°)
            </button>
            <button
              onClick={() => setAngles(180, 90)}
              className="bg-cyan-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-cyan-400/30 border border-cyan-400 text-cyan-400 font-bold"
            >
              ▶ Право (180°, 90°)
            </button>
            <button
              onClick={() => setAngles(90, 0)}
              className="bg-cyan-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-cyan-400/30 border border-cyan-400 text-cyan-400 font-bold"
            >
              ▼ Низ (90°, 0°)
            </button>
            <button
              onClick={() => setAngles(90, 180)}
              className="bg-cyan-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-cyan-400/30 border border-cyan-400 text-cyan-400 font-bold"
            >
              ▲ Верх (90°, 180°)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
