// Доменные константы, общие для роутов и клиента
// (должны совпадать с валидацией в прошивке esp32_S3/src/api.cpp)

import type { MotorId } from '@/types';

export const SERVO_ID_MIN = 0;
export const SERVO_ID_MAX = 3;      // Рулевые сервы: каналы PCA9685 0-3 (14/15 заняты камерой)
export const SERVO_ANGLE_MAX = 180; // API принимает 0-180; физический ход зажимает прошивка (20-160)
export const MOTOR_SPEED_MIN = -255;
export const MOTOR_SPEED_MAX = 255;
export const CAMERA_ANGLE_MAX = 180;
export const PWM_MAX_VALUE = 4095;

// Идентификаторы моторов ровера
export const MOTOR_IDS: MotorId[] = ['A', 'B', 'C', 'D'];
