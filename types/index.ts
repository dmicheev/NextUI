// Экспорт всех типов

import type { MotorSpeeds } from './esp32';

export * from './esp32';
export * from './joystick';

// Частичные объекты для моторов
export type PartialMotorSpeeds = {
  motorA?: number;
  motorB?: number;
  motorC?: number;
  motorD?: number;
};

// Конвертер для создания полного объекта MotorSpeeds из PartialMotorSpeeds
export function toFullMotorSpeeds(partial: PartialMotorSpeeds): MotorSpeeds {
  return {
    motorA: partial.motorA ?? 0,
    motorB: partial.motorB ?? 0,
    motorC: partial.motorC ?? 0,
    motorD: partial.motorD ?? 0,
  };
}
