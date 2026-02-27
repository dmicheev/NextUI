'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { MotorSpeeds, ServoAngles, JoystickMode } from '@/types';

interface RobotState {
  motors: MotorSpeeds;
  servos: ServoAngles;
  joystickMode: JoystickMode;
  isOnline: boolean;
  systemIP: string;
}

interface RobotContextType extends RobotState {
  setMotors: (motors: MotorSpeeds) => void;
  setServo: (id: number, angle: number) => void;
  setServos: (servos: ServoAngles) => void;
  setJoystickMode: (mode: JoystickMode) => void;
  setOnline: (online: boolean) => void;
  setSystemIP: (ip: string) => void;
  stopAllMotors: () => void;
}

const RobotContext = createContext<RobotContextType | undefined>(undefined);

export function RobotProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RobotState>({
    motors: { motorA: 0, motorB: 0, motorC: 0, motorD: 0 },
    servos: { servo0: 90, servo1: 90, servo2: 90, servo3: 90 },
    joystickMode: 'drive',
    isOnline: false,
    systemIP: 'Loading...',
  });

  const setMotors = useCallback((motors: MotorSpeeds) => {
    setState(prev => ({ ...prev, motors }));
  }, []);

  const setServo = useCallback((id: number, angle: number) => {
    setState(prev => ({
      ...prev,
      servos: { ...prev.servos, [`servo${id}`]: angle } as ServoAngles
    }));
  }, []);

  const setServos = useCallback((servos: ServoAngles) => {
    setState(prev => ({ ...prev, servos }));
  }, []);

  const setJoystickMode = useCallback((mode: JoystickMode) => {
    setState(prev => ({ ...prev, joystickMode: mode }));
  }, []);

  const setOnline = useCallback((online: boolean) => {
    setState(prev => ({ ...prev, isOnline: online }));
  }, []);

  const setSystemIP = useCallback((ip: string) => {
    setState(prev => ({ ...prev, systemIP: ip }));
  }, []);

  const stopAllMotors = useCallback(() => {
    setState(prev => ({
      ...prev,
      motors: { motorA: 0, motorB: 0, motorC: 0, motorD: 0 }
    }));
  }, []);

  return (
    <RobotContext.Provider value={{
      ...state,
      setMotors,
      setServo,
      setServos,
      setJoystickMode,
      setOnline,
      setSystemIP,
      stopAllMotors,
    }}>
      {children}
    </RobotContext.Provider>
  );
}

export function useRobot() {
  const context = useContext(RobotContext);
  if (context === undefined) {
    throw new Error('useRobot must be used within a RobotProvider');
  }
  return context;
}
