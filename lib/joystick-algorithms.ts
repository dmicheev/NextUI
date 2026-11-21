// Алгоритмы управления роботом через джойстик.
// Единственный источник истины по математике движения.
// (Легаси-копия в esp32_S3/data/joystick.js нужна только автономному UI прошивки.)

import type { JoystickPosition, JoystickMode, MotorSpeeds, ServoAngles } from '@/types';

// ===== Конфигурация =====

export const JOYSTICK_CONFIG = {
  deadZone: 10,        // Мёртвая зона джойстика (%)
  maxSpeed: 255,       // Максимальная скорость моторов
  sendIntervalMs: 100, // Минимальный интервал отправки команд на сервер (мс)
} as const;

// ===== Вспомогательные функции =====

/**
 * Ограничение значения диапазоном
 */
export function constrain(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Танковое управление (дифференциальное)
 * Конфигурация: левые моторы - B, C | правые - A, D
 */
export function calculateTankDrive(x: number, y: number): MotorSpeeds {
  const throttle = y / 100;   // Газ/тормоз (-1...1)
  const steering = x / 100;   // Поворот (-1...1)

  const leftSpeed = (throttle - steering) * JOYSTICK_CONFIG.maxSpeed;
  const rightSpeed = (throttle + steering) * JOYSTICK_CONFIG.maxSpeed;

  return {
    motorA: Math.round(constrain(rightSpeed, -255, 255)),  // Правый
    motorB: Math.round(constrain(leftSpeed, -255, 255)),   // Левый
    motorC: Math.round(constrain(leftSpeed, -255, 255)),   // Левый
    motorD: Math.round(constrain(rightSpeed, -255, 255)),  // Правый
  };
}

/**
 * Углы рулевых колёс для заданного отклонения X.
 * Зеркальные пары: servo0 = servo1 = 90 - x, servo2 = servo3 = 180 - target.
 * Не "ломать" эту зеркальность при правках (см. AGENTS.md).
 */
function steeringServoAngles(x: number): ServoAngles {
  const targetAngle = constrain(Math.round(90 - x), 0, 180);
  const mirroredAngle = constrain(180 - targetAngle, 0, 180);

  return {
    servo0: targetAngle,
    servo1: targetAngle,
    servo2: mirroredAngle,
    servo3: mirroredAngle,
  };
}

/**
 * Общий газ для всех моторов (режим mixed)
 */
function uniformMotorSpeeds(y: number): MotorSpeeds {
  const speed = Math.round(constrain((y / 100) * JOYSTICK_CONFIG.maxSpeed, -255, 255));
  return { motorA: speed, motorB: speed, motorC: speed, motorD: speed };
}

/**
 * Расчёт управления джойстиком для выбранного режима:
 * - drive: танковое управление моторами (сервоприводы не трогаются)
 * - servo: только рулевые сервы (моторы не трогаются)
 * - mixed: рулевые сервы по X + общий газ по Y
 */
export function calculateJoystickControl(
  position: JoystickPosition,
  mode: JoystickMode,
): {
  motors?: MotorSpeeds;
  servos?: ServoAngles;
} {
  const { x, y } = position;

  switch (mode) {
    case 'drive':
      return { motors: calculateTankDrive(x, y) };

    case 'servo':
      return { servos: steeringServoAngles(x) };

    case 'mixed':
      return {
        motors: uniformMotorSpeeds(y),
        servos: steeringServoAngles(x),
      };

    default:
      return {};
  }
}
