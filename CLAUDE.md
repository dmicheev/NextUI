отвечай ВСЕГДА на русском языке

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rover NextUI is a Next.js 15 web control panel for a robot controlled via ESP32. The app provides real-time control of 4 DC motors, 4 servos, a camera stream, and includes object detection using TensorFlow.js.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## ESP32 Connection Configuration

Configure ESP32 addresses in `lib/esp32-client.ts`:

```typescript
export const ESP32_API_BASE = process.env.NEXT_PUBLIC_ESP32_API_BASE || 'http://192.168.1.108:8080';
export const CAMERA_STREAM_URL = process.env.NEXT_PUBLIC_CAMERA_STREAM_URL || 'http://192.168.1.111:80';
```

For production, set environment variables:
- `NEXT_PUBLIC_ESP32_API_BASE` - ESP32 API base URL
- `NEXT_PUBLIC_CAMERA_STREAM_URL` - MJPEG camera stream URL

## Architecture

### API Proxy Pattern

The browser uses Next.js API routes (`app/api/*/route.ts`) as a proxy to the ESP32 to avoid CORS issues. The client library (`lib/esp32-client.ts`) automatically routes requests:
- Browser calls `/api/servo` → API route forwards to `${ESP32_API_BASE}/api/servo`
- `USE_PROXY = typeof window !== 'undefined'` determines routing

**Important:** When working with the ESP32 client, always use the functions from `lib/esp32-client.ts` - they handle the proxy routing automatically.

### State Management

Global state is managed via React Context:
- **RobotContext** (`context/RobotContext.tsx`) - holds motors, servos, joystick mode, online status
- Use `useRobot()` hook to access state and setters

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router - pages, API routes, components |
| `app/api/` | API routes that proxy to ESP32 |
| `app/components/` | React UI components |
| `context/` | React Context providers |
| `hooks/` | Custom React hooks (useESP32, useJoystick, useCamera) |
| `lib/` | Business logic (esp32-client, joystick-algorithms, utils) |
| `types/` | TypeScript type definitions |

### Joystick Control System

Joystick movement algorithms are server-side in `lib/joystick-algorithms.ts`:
- `calculateTankDrive(x, y)` - Differential drive (tank steering)
- `calculateSyncDrive(x, y)` - All wheels sync
- `calculateTurnDrive(x, y)` - Turn-in-place
- `calculateServoControl(x, y, angles)` - Servo control
- `calculateMixedControl(x, y, useServo)` - Motors + servos together

**Motor configuration:** 0-B(left), 1-A(right), 2-D(right), 3-C(left)

Joystick modes (`JoystickMode`): `'drive' | 'servo' | 'mixed'`

### Object Detection

Uses TensorFlow.js with COCO-SSD model:
- **COCO-SSD Lite** - Fast, ~2MB, for weak devices
- **COCO-SSD Accurate** - More precise, ~3MB, for powerful devices

Detection runs every 500ms on camera stream. Model loads asynchronously on first use.

### API Endpoints (Next.js Proxy)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/status` | GET | System status |
| `/api/servo` | GET/POST | Get/set servos |
| `/api/servo/calibrate` | POST | Calibrate servo |
| `/api/motor` | GET/POST | Get/set motors |
| `/api/motor/stop` | POST | Stop all motors |
| `/api/camera` | GET/POST | Get/set camera angles |
| `/api/joystick` | POST | Joystick control |

### TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` → root directory
- Module resolution: `bundler`

## Important Notes

1. **Server-side calculations:** Joystick algorithms calculate movement server-side; client only sends intentions (e.g., "move forward")
2. **Motor speed range:** -255 to 255
3. **Servo angle range:** 0 to 180 degrees
4. **PWM values:** Servo min/max PWM configurable (default 140-480)
5. **Emergency stop:** Available via red button or API endpoint
6. **Language:** Code comments and UI are primarily in Russian

## Adding New Features

### New API Endpoint
1. Create file in `app/api/[name]/route.ts`
2. Use functions from `lib/esp32-client.ts` to talk to ESP32
3. Add input validation

### New Component
1. Create in `app/components/`
2. Use `useRobot()` for state access
3. Use custom hooks from `hooks/` as needed

### New Joystick Mode
1. Add to `JoystickMode` type in `types/joystick.ts`
2. Implement algorithm in `lib/joystick-algorithms.ts`
3. Update `calculateJoystickControl()` switch statement
