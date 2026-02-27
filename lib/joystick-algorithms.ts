// Алгоритмы управления роботом через джойстик
// Перенесено из joystick.js проекта esp32_S3

import type { JoystickPosition, MotorSpeeds, ServoAngles, MovementVector } from '@/types';

// ===== Конфигурация =====

export const JOYSTICK_CONFIG = {
  deadZone: 10,        // Мёртвая зона джойстика
  maxSpeed: 255,       // Максимальная скорость моторов
  servoStep: 5,        // Шаг изменения сервоприводов
  updateInterval: 50   // Интервал обновления (мс)
} as const;

// ===== Вспомогательные функции =====

/**
 * Проверка мёртвой зоны
 */
export function applyDeadZone(value: number): number {
  if (Math.abs(value) < JOYSTICK_CONFIG.deadZone) {
    return 0;
  }
  return value;
}

/**
 * Ограничение значения
 */
export function constrain(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Плавное изменение скорости (интерполяция)
 */
export function smoothTransition(current: number, target: number, factor: number = 0.3): number {
  return current + (target - current) * factor;
}

/**
 * Расчёт вектора движения
 */
export function calculateMovementVector(x: number, y: number): MovementVector {
  const magnitude = Math.sqrt(x * x + y * y);
  const angle = Math.atan2(y, x) * (180 / Math.PI);
  
  return {
    angle: angle,
    speed: constrain(magnitude, 0, 100),
    normalized: {
      x: magnitude > 0 ? x / magnitude : 0,
      y: magnitude > 0 ? y / magnitude : 0
    }
  };
}

// ===== Алгоритмы движения =====

/**
 * Танковое управление (дифференциальное)
 * Конфигурация: 0-B(лев), 1-A(прав), 2-D(прав), 3-C(лев)
 * Левые моторы: B, C | Правые моторы: A, D
 */
export function calculateTankDrive(x: number, y: number): MotorSpeeds {
  // Нормализуем значения
  const throttle = y / 100;  // Газ/тормоз (-1...1)
  const steering = x / 100;   // Поворот (-1...1)

  // Левые моторы (B, C)
  const leftSpeed = (throttle - steering) * JOYSTICK_CONFIG.maxSpeed;
  // Правые моторы (A, D)
  const rightSpeed = (throttle + steering) * JOYSTICK_CONFIG.maxSpeed;

  return {
    motorA: Math.round(constrain(rightSpeed, -255, 255)),  // Правый
    motorB: Math.round(constrain(leftSpeed, -255, 255)),   // Левый
    motorC: Math.round(constrain(leftSpeed, -255, 255)),   // Левый
    motorD: Math.round(constrain(rightSpeed, -255, 255))   // Правый
  };
}

/**
 * Управление всеми колёсами (синхронное)
 */
export function calculateSyncDrive(x: number, y: number): MotorSpeeds {
  const speed = (y / 100) * JOYSTICK_CONFIG.maxSpeed;
  
  return {
    motorA: Math.round(constrain(speed, -255, 255)),
    motorB: Math.round(constrain(speed, -255, 255)),
    motorC: Math.round(constrain(speed, -255, 255)),
    motorD: Math.round(constrain(speed, -255, 255))
  };
}

/**
 * Управление с поворотом на месте
 */
export function calculateTurnDrive(x: number, y: number): MotorSpeeds {
  const throttle = y / 100;
  const turn = x / 100;
  
  // Если джойстик отклонён только по X - поворот на месте
  if (Math.abs(throttle) < 0.1 && Math.abs(turn) > 0.1) {
    return {
      motorA: Math.round(-turn * JOYSTICK_CONFIG.maxSpeed),
      motorB: Math.round(turn * JOYSTICK_CONFIG.maxSpeed),
      motorC: Math.round(-turn * JOYSTICK_CONFIG.maxSpeed),
      motorD: Math.round(turn * JOYSTICK_CONFIG.maxSpeed)
    };
  }
  
  // Иначе - обычное движение с поворотом
  return calculateTankDrive(x, y);
}

/**
 * Расчёт углов сервоприводов от джойстика
 */
export function calculateServoControl(x: number, y: number, currentAngles: ServoAngles): ServoAngles {
  const angles = { ...currentAngles };
  
  // Серво 0 и 1 - горизонтальное движение
  if (Math.abs(x) > JOYSTICK_CONFIG.deadZone) {
    angles.servo0 = constrain(angles.servo0 + (x / 100) * JOYSTICK_CONFIG.servoStep, 0, 180);
    angles.servo1 = constrain(angles.servo1 - (x / 100) * JOYSTICK_CONFIG.servoStep, 0, 180);
  }
  
  // Серво 2 и 3 - вертикальное движение
  if (Math.abs(y) > JOYSTICK_CONFIG.deadZone) {
    angles.servo2 = constrain(angles.servo2 + (y / 100) * JOYSTICK_CONFIG.servoStep, 0, 180);
    angles.servo3 = constrain(angles.servo3 + (y / 100) * JOYSTICK_CONFIG.servoStep, 0, 180);
  }
  
  return angles;
}

/**
 * Смешанное управление (моторы + серво)
 */
export function calculateMixedControl(x: number, y: number, useServo: boolean = false): {
  motors: MotorSpeeds;
  servos: ServoAngles | null;
} {
  const result = {
    motors: calculateTankDrive(x, y),
    servos: null as ServoAngles | null
  };
  
  if (useServo) {
    result.servos = {
      servo0: 90 + (x / 2),  // Примерное позиционирование
      servo1: 90 - (x / 2),
      servo2: 90,
      servo3: 90
    };
  }
  
  return result;
}

/**
 * Омни-направление (для роботов с омниколёсами)
 */
export function calculateOmniDrive(x: number, y: number, rotation: number = 0): MotorSpeeds {
  const vector = calculateMovementVector(x, y);
  const cos = Math.cos(vector.angle * Math.PI / 180);
  const sin = Math.sin(vector.angle * Math.PI / 180);
  const speed = vector.speed / 100 * JOYSTICK_CONFIG.maxSpeed;
  
  return {
    motorA: Math.round(speed * (cos - sin) + rotation),
    motorB: Math.round(speed * (cos + sin) - rotation),
    motorC: Math.round(speed * (-cos - sin) - rotation),
    motorD: Math.round(speed * (-cos + sin) + rotation)
  };
}

/**
 * Расчёт управления джойстиком для разных режимов
 */
export function calculateJoystickControl(
  position: JoystickPosition,
  mode: 'drive' | 'servo' | 'mixed',
  currentServoAngles: ServoAngles
): {
  motors?: MotorSpeeds;
  servos?: ServoAngles;
} {
  const { x, y } = position;

  switch (mode) {
    case 'drive':
      return {
        motors: calculateTankDrive(x, y)
      };

    case 'servo':
      const targetAngle = Math.round(90 - x);
      const servoAngles: ServoAngles = {
        servo0: constrain(targetAngle, 0, 180),
        servo1: constrain(targetAngle, 0, 180),
        servo3: constrain(180 - targetAngle, 0, 180),
        servo2: constrain(180 - targetAngle, 0, 180)
      };
      return {
        servos: servoAngles
      };

    case 'mixed':
      const mixedTargetAngle = Math.round(90 - x);
      const mixedServoAngles: ServoAngles = {
        servo0: constrain(mixedTargetAngle, 0, 180),
        servo1: constrain(mixedTargetAngle, 0, 180),
        servo3: constrain(180 - mixedTargetAngle, 0, 180),
        servo2: constrain(180 - mixedTargetAngle, 0, 180)
      };
      const targetSpeed = Math.round(-y * 255 / 100);
      const motors: MotorSpeeds = {
        motorA: targetSpeed,
        motorB: targetSpeed,
        motorC: targetSpeed,
        motorD: targetSpeed
      };
      return {
        motors,
        servos: mixedServoAngles
      };

    default:
      return {};
  }
}
