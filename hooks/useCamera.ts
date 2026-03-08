'use client';

import { useState, useEffect } from 'react';
import { getCamera, setCamera } from '@/lib/esp32-client';
import { CAMERA_STREAM_URL } from '@/lib/esp32-client';

export function useCamera() {
  const [panAngle, setPanAngle] = useState(90);
  const [tiltAngle, setTiltAngle] = useState(90);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка состояния камеры
  const loadCamera = async () => {
    try {
      const camera = await getCamera();
      setPanAngle(camera.pan_angle);
      setTiltAngle(camera.tilt_angle);
    } catch (error) {
      console.error('[useCamera] Error loading camera:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Установка углов камеры
  const setAngles = async (pan: number, tilt: number) => {
    try {
      await setCamera({ pan_angle: pan, tilt_angle: tilt });
      setPanAngle(pan);
      setTiltAngle(tilt);
    } catch (error) {
      console.error('[useCamera] Error setting angles:', error);
    }
  };

  // Инициализация при монтировании
  useEffect(() => {
    loadCamera();
  }, []);

  return {
    panAngle,
    tiltAngle,
    isLoading,
    setPanAngle,
    setTiltAngle,
    setAngles,
    loadCamera,
    streamURL: CAMERA_STREAM_URL,
  };
}
