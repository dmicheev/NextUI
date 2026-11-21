'use client';

import { useState, useCallback, useRef } from 'react';
import { useRobot } from '@/context/RobotContext';
import { calculateJoystickControl, JOYSTICK_CONFIG } from '@/lib/joystick-algorithms';
import { sendJoystick } from '@/lib/esp32-client';
import type { JoystickPosition, JoystickMode } from '@/types';

export function useJoystick() {
  const { joystickMode, setMotors, setServos } = useRobot();
  const [position, setPosition] = useState<JoystickPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastSendTime = useRef(0);
  const lastRequestId = useRef(0);

  // Отправка команды на сервер (расчёты движения - на сервере).
  // Устаревшие ответы отбрасываются по счётчику запросов.
  const sendJoystickCommand = useCallback(async (x: number, y: number, mode: JoystickMode) => {
    const requestId = ++lastRequestId.current;

    try {
      const data = await sendJoystick({ x, y, mode });
      if (requestId !== lastRequestId.current) return;

      if (data.motors) {
        setMotors(data.motors);
      }
      if (data.servos) {
        setServos(data.servos);
      }
    } catch (error) {
      console.error('[useJoystick] Error sending command:', error);
      // Визуализация уже обновлена локально, пользователь видит изменения
    }
  }, [setMotors, setServos]);

  // Обновление позиции джойстика
  const updatePosition = useCallback((x: number, y: number) => {
    setPosition({ x, y });

    // Мгновенная отрисовка на локальном расчёте
    const control = calculateJoystickControl({ x, y }, joystickMode);
    if (control.motors) setMotors(control.motors);
    if (control.servos) setServos(control.servos);

    // Ограничение частоты отправки команд
    const now = Date.now();
    if (now - lastSendTime.current < JOYSTICK_CONFIG.sendIntervalMs) return;
    lastSendTime.current = now;

    void sendJoystickCommand(x, y, joystickMode);
  }, [joystickMode, setMotors, setServos, sendJoystickCommand]);

  // Начало перетаскивания
  const startDrag = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Завершение перетаскивания: моторы в стоп,
  // в режимах servo/mixed сервер вернёт рули в 90°
  const endDrag = useCallback(() => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    setMotors({ motorA: 0, motorB: 0, motorC: 0, motorD: 0 });
    void sendJoystickCommand(0, 0, joystickMode);
  }, [joystickMode, setMotors, sendJoystickCommand]);

  // Сброс джойстика
  const reset = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  return {
    position,
    isDragging,
    updatePosition,
    startDrag,
    endDrag,
    reset,
  };
}
