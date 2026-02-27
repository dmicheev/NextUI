'use client';

import { useState, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { CAMERA_STREAM_URL } from '@/lib/esp32-client';

export function CameraStream() {
  const { streamURL, isLoading, panPWM, tiltPWM, setPWM, pulse } = useCamera();
  const [customStreamURL, setCustomStreamURL] = useState(CAMERA_STREAM_URL);
  const [isConnected, setIsConnected] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [panDuration, setPanDuration] = useState(100);
  const [tiltDuration, setTiltDuration] = useState(100);

  // Синхронизация customStreamURL с streamURL
  useEffect(() => {
    setCustomStreamURL(streamURL);
  }, [streamURL]);

  const handleImageLoad = () => {
    setIsConnected(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsConnected(false);
    setImageError(true);
  };

  const handlePWMChange = async () => {
    await setPWM(panPWM, tiltPWM);
  };

  const handleUpdateURL = () => {
    // URL уже обновлен в state, просто обновляем визуализацию
    setCustomStreamURL(customStreamURL);
  };

  const handlePulse = async (pan: number, tilt: number, duration: number) => {
    await pulse(pan, tilt, duration);
  };

  const handlePreset = async (pan: number, tilt: number, duration: number = 100) => {
    await handlePulse(pan, tilt, duration);
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
            <p className="text-gray-400 text-sm mt-2">
              Убедитесь, что камера доступна по адресу <strong className="text-cyan-400">{customStreamURL}</strong>
            </p>
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

      {/* Информация о значениях ШИМ */}
      <div className="mb-8 p-5 bg-white/5 rounded-lg border-l-4 border-cyan-400">
        <h4 className="text-cyan-400 text-base mb-4">📖 Информация о значениях ШИМ (360°)</h4>
        <ul className="text-gray-400 text-sm leading-relaxed pl-5">
          <li className="mb-2"><strong>Тип сервопривода:</strong> 360° непрерывного вращения</li>
          <li className="mb-2"><strong>Диапазон ШИМ:</strong> 200 - 400 (12-bit PCA9685)</li>
          <li className="mb-2"><strong>Центральное положение (стоп):</strong> 300</li>
          <li className="mb-2"><strong>Минимальное значение:</strong> 200 (вращение влево/вниз)</li>
          <li className="mb-2"><strong>Максимальное значение:</strong> 400 (вращение вправо/вверх)</li>
          <li><strong>Режим работы:</strong> Импульс + время (подача импульса на заданное время, затем остановка)</li>
          <li><strong>Примечание:</strong> 360° сервоприводы вращаются непрерывно при отклонении от центра</li>
        </ul>
      </div>

      {/* Управление PWM */}
      <div className="space-y-6">
        {/* Pan Control */}
        <div>
          <label className="block mb-2 text-sm text-gray-400">Pan PWM: <span className="text-cyan-400 font-bold">{panPWM}</span></label>
          <input
            type="range"
            min="200"
            max="400"
            value={panPWM}
            onChange={(e) => setPWM(parseInt(e.target.value), tiltPWM)}
            className="w-full h-2 rounded-lg bg-gray-700 outline-none appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-500 mt-2">
            200 ← влево | 300 = центр (стоп) | 400 вправо →
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              min="200"
              max="400"
              value={panPWM}
              onChange={(e) => setPWM(parseInt(e.target.value) || 300, tiltPWM)}
              className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
            />
            <input
              type="number"
              min="10"
              max="5000"
              value={panDuration}
              onChange={(e) => setPanDuration(parseInt(e.target.value) || 100)}
              placeholder="Duration (ms)"
              className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
            />
            <button
              onClick={() => handlePulse(panPWM, 300, panDuration)}
              className="bg-cyan-400 text-gray-900 px-4 py-2 rounded-lg font-bold cursor-pointer transition-all duration-200 hover:bg-cyan-300"
            >
              Пульс
            </button>
          </div>
        </div>

        {/* Tilt Control */}
        <div>
          <label className="block mb-2 text-sm text-gray-400">Tilt PWM: <span className="text-cyan-400 font-bold">{tiltPWM}</span></label>
          <input
            type="range"
            min="200"
            max="400"
            value={tiltPWM}
            onChange={(e) => setPWM(panPWM, parseInt(e.target.value))}
            className="w-full h-2 rounded-lg bg-gray-700 outline-none appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-500 mt-2">
            200 ← вниз | 300 = центр (стоп) | 400 вверх →
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="number"
              min="200"
              max="400"
              value={tiltPWM}
              onChange={(e) => setPWM(panPWM, parseInt(e.target.value) || 300)}
              className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
            />
            <input
              type="number"
              min="10"
              max="5000"
              value={tiltDuration}
              onChange={(e) => setTiltDuration(parseInt(e.target.value) || 100)}
              placeholder="Duration (ms)"
              className="flex-1 py-2 px-3 border border-white/20 rounded-lg bg-white/10 text-white text-base text-center"
            />
            <button
              onClick={() => handlePulse(300, tiltPWM, tiltDuration)}
              className="bg-cyan-400 text-gray-900 px-4 py-2 rounded-lg font-bold cursor-pointer transition-all duration-200 hover:bg-cyan-300"
            >
              Пульс
            </button>
          </div>
        </div>

        {/* Быстрые пресеты */}
        <div className="pt-4 border-t border-white/10">
          <h4 className="text-yellow-500 text-base mb-4">⚡ Быстрые пресеты (импульс 100мс)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => handlePreset(300, 300)}
              className="bg-green-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-green-400/30 border border-green-400 text-green-400 font-bold"
            >
              🎯 Центр (300, 300)
            </button>
            <button
              onClick={() => handlePreset(250, 300)}
              className="bg-cyan-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-cyan-400/30 border border-cyan-400 text-cyan-400 font-bold"
            >
              ◀ Влево (250, 300)
            </button>
            <button
              onClick={() => handlePreset(350, 300)}
              className="bg-cyan-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-cyan-400/30 border border-cyan-400 text-cyan-400 font-bold"
            >
              ▶ Вправо (350, 300)
            </button>
            <button
              onClick={() => handlePreset(300, 250)}
              className="bg-cyan-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-cyan-400/30 border border-cyan-400 text-cyan-400 font-bold"
            >
              ▼ Вниз (300, 250)
            </button>
            <button
              onClick={() => handlePreset(300, 350)}
              className="bg-cyan-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-cyan-400/30 border border-cyan-400 text-cyan-400 font-bold"
            >
              ▲ Вверх (300, 350)
            </button>
            <button
              onClick={() => handlePreset(250, 250)}
              className="bg-orange-400/20 py-3 px-4 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:bg-orange-400/30 border border-orange-400 text-orange-400 font-bold"
            >
              ⬅️↘️ Лево-Вниз (250, 250)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
