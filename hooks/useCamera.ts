'use client';

import { useState, useEffect } from 'react';
import { getCamera, setCameraPWM, cameraPulse } from '@/lib/esp32-client';
import { CAMERA_STREAM_URL } from '@/lib/esp32-client';

export function useCamera() {
  const [panPWM, setPanPWM] = useState(300);
  const [tiltPWM, setTiltPWM] = useState(300);
  const [panDuration, setPanDuration] = useState(100);
  const [tiltDuration, setTiltDuration] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка состояния камеры
  const loadCamera = async () => {
    try {
      const camera = await getCamera();
      setPanPWM(camera.pan_pwm);
      setTiltPWM(camera.tilt_pwm);
    } catch (error) {
      console.error('[useCamera] Error loading camera:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Установка PWM камеры
  const setPWM = async (pan: number, tilt: number) => {
    try {
      await setCameraPWM({ pan_pwm: pan, tilt_pwm: tilt });
      setPanPWM(pan);
      setTiltPWM(tilt);
    } catch (error) {
      console.error('[useCamera] Error setting PWM:', error);
    }
  };

  // Импульсное управление камерой
  const pulse = async (pan: number, tilt: number, duration: number) => {
    try {
      await cameraPulse({ pan_pwm: pan, tilt_pwm: tilt, duration_ms: duration });
    } catch (error) {
      console.error('[useCamera] Error pulsing camera:', error);
    }
  };

  // Пресеты для камеры
  const applyPreset = async (pan: number, tilt: number, duration: number = 100) => {
    await pulse(pan, tilt, duration);
  };

  // Инициализация при монтировании
  useEffect(() => {
    loadCamera();
  }, []);

  return {
    panPWM,
    tiltPWM,
    panDuration,
    tiltDuration,
    isLoading,
    setPanPWM,
    setTiltPWM,
    setPanDuration,
    setTiltDuration,
    setPWM,
    pulse,
    applyPreset,
    loadCamera,
    streamURL: CAMERA_STREAM_URL,
  };
}
