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
    console.log('[useCamera] loadCamera() - Starting');
    try {
      const camera = await getCamera();
      console.log('[useCamera] loadCamera() - Success:', camera);
      setPanAngle(camera.pan_angle);
      setTiltAngle(camera.tilt_angle);
    } catch (error) {
      console.error('[useCamera] loadCamera() - Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Установка углов камеры
  const setAngles = async (pan: number, tilt: number) => {
    console.log('[useCamera] setAngles() - Setting angles:', { pan, tilt });
    try {
      await setCamera({ pan_angle: pan, tilt_angle: tilt });
      console.log('[useCamera] setAngles() - Success');
      setPanAngle(pan);
      setTiltAngle(tilt);
    } catch (error) {
      console.error('[useCamera] setAngles() - Error:', error);
    }
  };

  // Инициализация при монтировании
  useEffect(() => {
    console.log('[useCamera] useEffect() - Component mounted, loading camera');
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
