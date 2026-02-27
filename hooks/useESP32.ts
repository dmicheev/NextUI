'use client';

import { useEffect, useState, useRef } from 'react';
import { getSystemStatus, getMotors, getServos } from '@/lib/esp32-client';
import { useRobot } from '@/context/RobotContext';

export function useESP32() {
  const { setMotors, setServos, setOnline, setSystemIP } = useRobot();
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка статуса системы
  const loadStatus = async () => {
    try {
      const status = await getSystemStatus();
      setSystemIP(status.ip);
      setOnline(true);
    } catch (error) {
      console.error('[useESP32] Error loading status:', error);
      setOnline(false);
    }
  };

  // Загрузка скоростей моторов
  const loadMotors = async () => {
    try {
      const motors = await getMotors();
      setMotors(motors);
    } catch (error) {
      console.error('[useESP32] Error loading motors:', error);
    }
  };

  // Загрузка сервоприводов
  const loadServos = async () => {
    try {
      const servosData = await getServos();
      const servos = {
        servo0: servosData.find(s => s.id === 0)?.angle || 90,
        servo1: servosData.find(s => s.id === 1)?.angle || 90,
        servo2: servosData.find(s => s.id === 2)?.angle || 90,
        servo3: servosData.find(s => s.id === 3)?.angle || 90,
      };
      setServos(servos);
    } catch (error) {
      console.error('[useESP32] Error loading servos:', error);
    }
  };

  // Инициализация при монтировании
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([
        loadStatus(),
        loadMotors(),
        loadServos(),
      ]);
      setIsLoading(false);
    };

    init();

    // Периодическое обновление статуса
    intervalRef.current = setInterval(loadStatus, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    loadStatus,
    loadMotors,
    loadServos,
  };
}
