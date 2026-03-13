'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { CAMERA_STREAM_URL } from '@/lib/esp32-client';
import { ObjectDetector } from './ObjectDetector';

// Конфигурация разрешений камеры
const CAMERA_RESOLUTIONS = [
  { value: 'vga', label: 'VGA (640×480)', speed: '📹 Стандарт' },
  { value: 'svga', label: 'SVGA (800×600)', speed: '🔍 Высокое' },
];

// Вспомогательные функции для работы с URL
const buildStreamURL = (baseUrl: string, res: string): string => {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/${res}`;
};

const getBaseUrl = (url: string): string => {
  const match = url.match(/^(https?:\/\/[^\/]+)/);
  return match ? match[1] : url;
};

interface DetectedObject {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export function CameraStream() {
  const { panAngle, tiltAngle, setAngles } = useCamera();
  const [customStreamURL, setCustomStreamURL] = useState(CAMERA_STREAM_URL);
  const [resolution, setResolution] = useState('vga');
  const [isConnected, setIsConnected] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [timestamp, setTimestamp] = useState(Date.now());
  const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  
  const imageRef = useRef<HTMLImageElement>(null);

  // Вычисляем базовый URL из customStreamURL
  const baseUrl = useMemo(() => getBaseUrl(customStreamURL), [customStreamURL]);

  // Добавляем timestamp к URL для принудительной перезагрузки
  const streamURLWithTimestamp = useMemo(() => {
    return `${customStreamURL}?t=${timestamp}`;
  }, [customStreamURL, timestamp]);

  const handleImageLoad = () => {
    setIsConnected(true);
    setImageError(false);
    setIsReconnecting(false);
    setConnectionAttempts(0);
  };

  const handleImageError = () => {
    setIsConnected(false);
    setImageError(true);
  };

  const handleUpdateURL = () => {
    // Сбрасываем все состояния ошибки
    setImageError(false);
    setIsConnected(false);
    setConnectionAttempts(0);
    setIsReconnecting(false);
    
    // Обновляем timestamp для принудительной перезагрузки
    setTimestamp(Date.now());
  };

  const handleResolutionChange = (newResolution: string) => {
    // Сбрасываем состояние ошибки
    setImageError(false);
    setIsConnected(false);
    setConnectionAttempts(0);
    
    // Обновляем разрешение и URL
    setResolution(newResolution);
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    setCustomStreamURL(buildStreamURL(cleanBaseUrl, newResolution));
    
    // Обновляем timestamp для принудительной перезагрузки
    setTimestamp(Date.now());
  };

  const handleObjectsDetected = (objects: DetectedObject[]) => {
    setDetectedObjects(objects);
  };

  const handleBaseUrlChange = (newBaseUrl: string) => {
    // Сбрасываем все состояния ошибки при смене базового URL
    setImageError(false);
    setIsConnected(false);
    setConnectionAttempts(0);
    setIsReconnecting(false);
    
    const cleanBaseUrl = newBaseUrl.replace(/\/$/, '');
    setCustomStreamURL(buildStreamURL(cleanBaseUrl, resolution));
    
    // Обновляем timestamp для принудительной перезагрузки
    setTimestamp(Date.now());
  };

  // Автоматическое переподключение при ошибке
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (imageError && connectionAttempts < 3) {
      setIsReconnecting(true);
      timeoutId = setTimeout(() => {
        setConnectionAttempts(prev => prev + 1);
        setImageError(false);
        setTimestamp(Date.now());
        setIsReconnecting(false);
      }, 2000); // Пауза 2 секунды перед переподключением
    } else if (connectionAttempts >= 3) {
      // Сбрасываем состояние переподключения при достижении лимита
      setIsReconnecting(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [imageError, connectionAttempts]);

  return (
    <div className="bg-white/5 rounded-xl p-8 border border-white/10">
      <h2 className="text-cyan-400 text-xl font-bold mb-6 text-center">📷 Камера</h2>

      {/* Настройка IP адреса и разрешения */}
      <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IP адрес камеры */}
          <div>
            <label className="block mb-3 text-sm text-gray-400">IP адрес камеры:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                className="flex-1 py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base"
                placeholder="http://192.168.1.111:81"
              />
              <button
                onClick={handleUpdateURL}
                className="bg-cyan-400 text-gray-900 px-6 py-3 rounded-lg font-bold cursor-pointer transition-all duration-200 hover:bg-cyan-300"
              >
                Обновить
              </button>
            </div>
          </div>

          {/* Выбор разрешения */}
          <div>
            <label className="block mb-3 text-sm text-gray-400">Разрешение:</label>
            <select
              value={resolution}
              onChange={(e) => handleResolutionChange(e.target.value)}
              className="w-full py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base cursor-pointer"
            >
              {CAMERA_RESOLUTIONS.map((res) => (
                <option key={res.value} value={res.value}>
                  {res.label} — {res.speed}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Индикатор статуса подключения */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Статус:</span>
            {isReconnecting ? (
              <span className="text-yellow-400 animate-pulse">🔄 Переподключение...</span>
            ) : isConnected ? (
              <span className="text-green-400">✅ Подключено</span>
            ) : imageError ? (
              <span className="text-red-400">❌ Ошибка подключения</span>
            ) : (
              <span className="text-blue-400 animate-pulse">⏳ Подключение...</span>
            )}
          </div>
          {connectionAttempts > 0 && (
            <span className="text-gray-400">Попытка: {connectionAttempts}/3</span>
          )}
        </div>

        {/* Переключатель детекции объектов */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">🤖 Детекция объектов:</span>
            <button
              onClick={() => setObjectDetectionEnabled(!objectDetectionEnabled)}
              className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 cursor-pointer ${
                objectDetectionEnabled
                  ? 'bg-green-400 text-gray-900 hover:bg-green-300'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {objectDetectionEnabled ? '✅ Включено' : '❌ Выключено'}
            </button>
          </div>
          {objectDetectionEnabled && detectedObjects.length > 0 && (
            <span className="text-cyan-400 font-bold">
              Обнаружено: {detectedObjects.length}
            </span>
          )}
        </div>

        {/* Информация об обнаруженных объектах */}
        {objectDetectionEnabled && detectedObjects.length > 0 && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-yellow-500 text-base mb-3">📊 Обнаруженные объекты:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {detectedObjects.map((obj, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">{obj.class}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">
                      Уверенность: {Math.round(obj.score * 100)}%
                    </span>
                    <span className="text-gray-400 text-sm">
                      [{Math.round(obj.bbox[0])}, {Math.round(obj.bbox[1])}]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Основной контент: видео слева, управление справа */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Видеопоток */}
        <div className="flex-shrink-0">
          {imageError && connectionAttempts >= 3 ? (
            <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-8 text-center">
              <p className="text-red-400 text-lg mb-2">❌ Не удалось подключиться к камере</p>
              <p className="text-gray-400 text-sm mb-4">URL: {customStreamURL}</p>
              <button
                onClick={handleUpdateURL}
                className="bg-red-400 text-gray-900 px-6 py-3 rounded-lg font-bold cursor-pointer transition-all duration-200 hover:bg-red-300"
              >
                🔄 Попробовать снова
              </button>
            </div>
          ) : (
            <div className="relative bg-black/20 rounded-xl overflow-hidden border-2 border-white/10">
              <img
                ref={imageRef}
                src={streamURLWithTimestamp}
                alt="Camera Stream"
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="block"
                style={{
                  width: resolution === 'vga' ? '640px' : '800px',
                  height: resolution === 'vga' ? '480px' : '600px',
                  objectFit: 'contain'
                }}
              />
              <ObjectDetector
                imageElement={imageRef.current}
                enabled={objectDetectionEnabled && isConnected}
                onObjectsDetected={handleObjectsDetected}
              />
              {isReconnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-white text-lg animate-pulse">🔄 Переподключение...</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Управление углами камеры */}
        <div className="flex-1 w-full space-y-6">
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
    </div>
  );
}
