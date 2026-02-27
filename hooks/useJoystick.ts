'use client';

import { useState, useCallback, useRef } from 'react';
import { useRobot } from '@/context/RobotContext';
import { calculateTankDrive, constrain } from '@/lib/joystick-algorithms';

export function useJoystick() {
  const { joystickMode, setMotors, setServos, servos } = useRobot();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastSendTime = useRef(0);
  const SEND_INTERVAL = 100; // мс

  // Расчёт управления локально (для мгновенного обновления визуализации)
  const calculateJoystickControl = (x: number, y: number) => {
    if (joystickMode === 'drive') {
      return {
        motors: calculateTankDrive(x, y),
        servos: null
      };
    } else if (joystickMode === 'servo') {
      const targetAngle = Math.round(90 - x);
      const servoAngles = {
        servo0: constrain(targetAngle, 0, 180),
        servo1: constrain(targetAngle, 0, 180),
        servo3: constrain(180 - targetAngle, 0, 180),
        servo2: constrain(180 - targetAngle, 0, 180)
      };
      return {
        motors: null,
        servos: servoAngles
      };
    } else if (joystickMode === 'mixed') {
      const mixedTargetAngle = Math.round(90 - x);
      const mixedServoAngles = {
        servo0: constrain(mixedTargetAngle, 0, 180),
        servo1: constrain(mixedTargetAngle, 0, 180),
        servo3: constrain(180 - mixedTargetAngle, 0, 180),
        servo2: constrain(180 - mixedTargetAngle, 0, 180)
      };
      const targetSpeed = Math.round(-y * 255 / 100);
      const motors = {
        motorA: targetSpeed,
        motorB: targetSpeed,
        motorC: targetSpeed,
        motorD: targetSpeed
      };
      return {
        motors,
        servos: mixedServoAngles
      };
    }
    return { motors: null, servos: null };
  };

  // Обновление позиции джойстика
  const updatePosition = useCallback((x: number, y: number) => {
    setPosition({ x, y });

    // Сначала обновляем визуализацию локально
    const control = calculateJoystickControl(x, y);
    if (control.motors) {
      setMotors(control.motors);
    }
    if (control.servos) {
      setServos(control.servos);
    }

    // Ограничение частоты отправки команд
    const now = Date.now();
    if (now - lastSendTime.current < SEND_INTERVAL) {
      return;
    }
    lastSendTime.current = now;

    // Отправка команды на сервер (расчёты на сервере)
    sendJoystickCommand(x, y);
  }, [joystickMode, setMotors, setServos]);

  // Отправка команды джойстика на сервер
  const sendJoystickCommand = async (x: number, y: number) => {
    try {
      const response = await fetch('/api/joystick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x,
          y,
          mode: joystickMode,
          currentServoAngles: servos,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Обновляем контекст данными от сервера (для синхронизации)
        if (data.motors) {
          setMotors(data.motors);
        }
        if (data.servos) {
          setServos(data.servos);
        }
      }
    } catch (error) {
      console.error('[useJoystick] Error sending command:', error);
      // Визуализация уже обновлена локально, так что пользователь видит изменения
    }
  };

  // Начало перетаскивания
  const startDrag = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Завершение перетаскивания
  const endDrag = useCallback(() => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    
    // Сначала обновляем визуализацию локально
    setMotors({ motorA: 0, motorB: 0, motorC: 0, motorD: 0 });
    
    // Отправляем команду остановки
    sendJoystickCommand(0, 0);
  }, [setMotors]);

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
