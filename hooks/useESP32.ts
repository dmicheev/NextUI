'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getSystemStatus, getMotors, getServos } from '@/lib/esp32-client';
import { useRobot } from '@/context/RobotContext';
import type { ServoAngles } from '@/types';

// Поллинг статуса должен быть лёгким: короткий таймаут и без ретраев,
// чтобы офлайн-опросы не накладывались друг на друга
const STATUS_POLL_INTERVAL_MS = 5000;
const STATUS_POLL_TIMEOUT_MS = 3000;

export function useESP32() {
  const { setMotors, setServos, setOnline, setSystemIP } = useRobot();
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка статуса системы
  const loadStatus = useCallback(async () => {
    try {
      const status = await getSystemStatus({ timeoutMs: STATUS_POLL_TIMEOUT_MS, retries: 1 });
      setSystemIP(status.ip);
      setOnline(true);
    } catch (error) {
      console.error('[useESP32] Error loading status:', error);
      setOnline(false);
    }
  }, [setOnline, setSystemIP]);

  // Загрузка скоростей моторов
  const loadMotors = useCallback(async () => {
    try {
      const motors = await getMotors();
      setMotors(motors);
    } catch (error) {
      console.error('[useESP32] Error loading motors:', error);
    }
  }, [setMotors]);

  // Загрузка углов сервоприводов
  const loadServos = useCallback(async () => {
    try {
      const servoConfigs = await getServos();
      const angleOf = (id: number) => servoConfigs.find(s => s.id === id)?.angle ?? 90;
      const servos: ServoAngles = {
        servo0: angleOf(0),
        servo1: angleOf(1),
        servo2: angleOf(2),
        servo3: angleOf(3),
      };
      setServos(servos);
    } catch (error) {
      console.error('[useESP32] Error loading servos:', error);
    }
  }, [setServos]);

  // Инициализация при монтировании + периодическое обновление статуса
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadStatus(), loadMotors(), loadServos()]);
      setIsLoading(false);
    };

    void init();
    intervalRef.current = setInterval(() => void loadStatus(), STATUS_POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadStatus, loadMotors, loadServos]);

  return {
    isLoading,
    loadStatus,
    loadMotors,
    loadServos,
  };
}
