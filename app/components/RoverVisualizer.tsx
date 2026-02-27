'use client';

import { useRobot } from '@/context/RobotContext';

export function RoverVisualizer() {
  const { motors, servos } = useRobot();

  const getArrowRotation = (servoAngle: number, side: 'left' | 'right') => {
    // Для левых колёс стрелка направлена влево, для правых - вправо
    // servoAngle - 90 = стрелка вверх, servoAngle < 90 = влево, servoAngle > 90 = вправо
    const rotation = servoAngle - 180;
    return side === 'left' ? rotation : -rotation;
  };

  const getArrowLength = (speed: number) => {
    const absSpeed = Math.abs(speed);
    const minArrowLength = 8;
    const maxArrowLength = 40;
    const length = Math.max(minArrowLength, (absSpeed / 255) * maxArrowLength);
    return length;
  };

  const getArrowDirection = (speed: number, side: 'left' | 'right') => {
    const direction = speed >= 0 ? 1 : -1;
    return side === 'left' ? direction : -direction;
  };

  return (
    <div className="flex justify-center mb-8">
      <svg viewBox="0 0 260 380" className="w-full max-w-80 h-auto bg-black/20 rounded-xl border border-white/10">
        {/* Корпус ровера */}
        <rect x="105" y="160" width="50" height="80" rx="8" fill="rgba(0, 217, 255, 0.15)" stroke="#00d9ff" strokeWidth="2" />

        {/* Метка переда */}
        <polygon points="130,145 125,155 135,155" fill="#00ff88" />
        <text x="130" y="140" textAnchor="middle" fill="#00ff88" fontSize="14" fontWeight="bold">▲</text>

        {/* Колесо B (переднее левое) */}
        <g transform="translate(70, 170)">
          {/* Колесо */}
          <ellipse cx="0" cy="0" rx="18" ry="22" fill="rgba(255, 107, 107, 0.2)" stroke="#ff6b6b" strokeWidth="2" className="wheel" />
          
          {/* Стрелка поворота серво (угол) */}
          <g transform={`rotate(${getArrowRotation(servos.servo0, 'left')})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="#ffcc00" strokeWidth="3" strokeLinecap="round" />
            <polygon points="18,-4 22,0 18,4" fill="#ffcc00" />
            <text x="-14" y="4" fill="#ffcc00" fontSize="8" fontWeight="bold" className="servo-angle-text">
              {servos.servo0}°
            </text>
          </g>
          
          {/* Стрелка скорости */}
          <g transform={`translate(-35, 0)`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={getArrowDirection(motors.motorB, 'left') * getArrowLength(motors.motorB)}
              stroke="#ff6b6b"
              strokeWidth="6"
              strokeLinecap="round"
              className="speed-arrow-line"
            />
            <text x="0" y="-4" textAnchor="middle" fill="#ff6b6b" fontSize="9" fontWeight="bold" className="speed-text">
              {Math.abs(motors.motorB)}
            </text>
          </g>
          
          {/* Метка */}
          <text x="-50" y="4" fill="#ff6b6b" fontSize="11" fontWeight="bold">B</text>
        </g>

        {/* Колесо C (заднее левое) */}
        <g transform="translate(70, 225)">
          {/* Колесо */}
          <ellipse cx="0" cy="0" rx="18" ry="22" fill="rgba(255, 107, 107, 0.2)" stroke="#ff6b6b" strokeWidth="2" className="wheel" />
          
          {/* Стрелка поворота серво (угол) */}
          <g transform={`rotate(${getArrowRotation(servos.servo3, 'left')})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="#ffcc00" strokeWidth="3" strokeLinecap="round" />
            <polygon points="18,-4 22,0 18,4" fill="#ffcc00" />
            <text x="-14" y="4" fill="#ffcc00" fontSize="8" fontWeight="bold" className="servo-angle-text">
              {servos.servo3}°
            </text>
          </g>
          
          {/* Стрелка скорости */}
          <g transform={`translate(-35, 0)`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={getArrowDirection(motors.motorC, 'left') * getArrowLength(motors.motorC)}
              stroke="#ff6b6b"
              strokeWidth="6"
              strokeLinecap="round"
              className="speed-arrow-line"
            />
            <text x="0" y="-4" textAnchor="middle" fill="#ff6b6b" fontSize="9" fontWeight="bold" className="speed-text">
              {Math.abs(motors.motorC)}
            </text>
          </g>
          
          {/* Метка */}
          <text x="-50" y="4" fill="#ff6b6b" fontSize="11" fontWeight="bold">C</text>
        </g>

        {/* Колесо A (переднее правое) */}
        <g transform="translate(190, 170)">
          {/* Колесо */}
          <ellipse cx="0" cy="0" rx="18" ry="22" fill="rgba(0, 255, 136, 0.2)" stroke="#00ff88" strokeWidth="2" className="wheel" />
          
          {/* Стрелка поворота серво (угол) */}
          <g transform={`rotate(${getArrowRotation(servos.servo1, 'right')})`}>
            <line x1="0" y1="0" x2="-18" y2="0" stroke="#ffcc00" strokeWidth="3" strokeLinecap="round" />
            <polygon points="-18,-4 -22,0 -18,4" fill="#ffcc00" />
            <text x="14" y="4" fill="#ffcc00" fontSize="8" fontWeight="bold" className="servo-angle-text">
              {servos.servo1}°
            </text>
          </g>
          
          {/* Стрелка скорости */}
          <g transform={`translate(35, 0)`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={getArrowDirection(motors.motorA, 'right') * getArrowLength(motors.motorA)}
              stroke="#00ff88"
              strokeWidth="6"
              strokeLinecap="round"
              className="speed-arrow-line"
            />
            <text x="0" y="-4" textAnchor="middle" fill="#00ff88" fontSize="9" fontWeight="bold" className="speed-text">
              {Math.abs(motors.motorA)}
            </text>
          </g>
          
          {/* Метка */}
          <text x="55" y="4" fill="#00ff88" fontSize="11" fontWeight="bold">A</text>
        </g>

        {/* Колесо D (заднее правое) */}
        <g transform="translate(190, 225)">
          {/* Колесо */}
          <ellipse cx="0" cy="0" rx="18" ry="22" fill="rgba(0, 255, 136, 0.2)" stroke="#00ff88" strokeWidth="2" className="wheel" />
          
          {/* Стрелка поворота серво (угол) */}
          <g transform={`rotate(${getArrowRotation(servos.servo2, 'right')})`}>
            <line x1="0" y1="0" x2="-18" y2="0" stroke="#ffcc00" strokeWidth="3" strokeLinecap="round" />
            <polygon points="-18,-4 -22,0 -18,4" fill="#ffcc00" />
            <text x="14" y="4" fill="#ffcc00" fontSize="8" fontWeight="bold" className="servo-angle-text">
              {servos.servo2}°
            </text>
          </g>
          
          {/* Стрелка скорости */}
          <g transform={`translate(35, 0)`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={getArrowDirection(motors.motorD, 'right') * getArrowLength(motors.motorD)}
              stroke="#00ff88"
              strokeWidth="6"
              strokeLinecap="round"
              className="speed-arrow-line"
            />
            <text x="0" y="-4" textAnchor="middle" fill="#00ff88" fontSize="9" fontWeight="bold" className="speed-text">
              {Math.abs(motors.motorD)}
            </text>
          </g>
          
          {/* Метка */}
          <text x="55" y="4" fill="#00ff88" fontSize="11" fontWeight="bold">D</text>
        </g>
      </svg>
    </div>
  );
}
