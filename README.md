# Rover NextUI — Панель управления роботом

Современная веб-панель управления роботом на базе Next.js. Прошивка робота находится в соседнем проекте [`../esp32_S3`](../esp32_S3).

## 🚀 Быстрый старт

```bash
cd NextUI
npm install        # установка зависимостей
npm run dev        # dev-сервер → http://localhost:3000
npm run build      # production-сборка (заодно проверка типов)
npm start          # запуск production-сервера
npm run lint       # линтер
```

## 📋 Стек технологий

- **Next.js 15** (App Router) + **React 18**
- **TypeScript** — strict mode, alias `@/*` → корень проекта
- **Tailwind CSS 3**
- **TensorFlow.js** + COCO-SSD / MobileNet — детекция объектов и классификация
- **onnxruntime-web** — YOLO / DETR детекторы

## 🔌 Интеграция с ESP32

### Настройка адресов

В [``.env.local``](.env.local) (или переменными окружения):

```bash
NEXT_PUBLIC_ESP32_API_BASE=http://192.168.1.108:8080   # REST API прошивки
NEXT_PUBLIC_CAMERA_STREAM_URL=http://192.168.1.111:80  # MJPEG-стрим камеры
```

Значения по умолчанию продублированы в [`lib/esp32-client.ts`](lib/esp32-client.ts).

### Ключевой паттерн: прокси

Браузер **не ходит на ESP32 напрямую** (обход CORS):

```
Браузер → Next.js API route (app/api/*/route.ts) → функции lib/esp32-client.ts → ESP32:8080
```

- В `lib/esp32-client.ts`: `USE_PROXY = typeof window !== 'undefined'` — в браузере запросы идут на относительные `/api/...`, на сервере (внутри route handlers) — напрямую на ESP32.
- **Правило: любые запросы к ESP32 — только через функции `lib/esp32-client.ts`.**
- `emergencyStop()` = стоп моторов + камера в 90/90.

### API маршруты Next.js (прокси)

| Маршрут | Метод | Куда идёт на ESP32 |
|---------|-------|--------------------|
| `/api/status` | GET | `GET /api/status` |
| `/api/servo` | GET/POST | `GET/POST /api/servo` |
| `/api/servo/calibrate` | POST | калибровка серво |
| `/api/motor` | GET/POST | `GET/POST /api/motor` |
| `/api/motor/stop` | POST | `POST /api/motor/stop` |
| `/api/camera` | GET/POST | `GET /api/camera`, `POST /api/camera/angle` |
| `/api/joystick` | POST | расчёт на сервере → моторы + сервы |
| `/api/emergency` | POST | экстренная остановка |

Каждый route валидирует входные данные до отправки на ESP32.

---

## 🛞 Механика робота

4 независимых колеса: каждое поворачивается своим **серво** и крутится своим **мотором**.

| Колесо | Серво (канал PCA9685) | Мотор | Сторона |
|--------|----------------------|-------|---------|
| B | 0 | B | левое |
| A | 1 | A | правое |
| D | 2 | D | правое |
| C | 3 | C | левое |

- Скорость моторов: −255...255; углы серво: 0–180° (прошивка зажимает до 20–160°).
- Камера Pan/Tilt — серво на каналах 14/15, стрим идёт с отдельного устройства (`CAMERA_STREAM_URL`).

## 🕹️ Джойстик — 3 режима

Математика на сервере: [`lib/joystick-algorithms.ts`](lib/joystick-algorithms.ts). Клиент отправляет только `{x, y, mode}` (±100), точка входа — `POST /api/joystick`.

| Режим | Ось X (руление) | Ось Y (тяга) |
|-------|-----------------|--------------|
| 🚗 **drive** — только моторы, танковый | дифференциал: правые A, D ← `(y+x)/100·255`; левые B, C ← `(y−x)/100·255` | газ/назад |
| 🔧 **servo** — только серво | `targetAngle = 90 − x`: серво0 = серво1 = targetAngle; серво2 = серво3 = 180 − targetAngle | — |
| 🎯 **mixed** | руление как в servo | все 4 мотора одной скоростью `y·255/100` |

Детали потока:
- `hooks/useJoystick.ts` — локальный расчёт для мгновенной отрисовки + отправка не чаще раза в 100 мс;
- сервер пересчитывает управление (`calculateJoystickControl`) и шлёт команды на ESP32 (серво — 4 отдельных запроса через `Promise.allSettled`);
- отпускание джойстика: моторы в 0, руля возвращаются в 90°.

`JOYSTICK_CONFIG`: deadZone 10, maxSpeed 255, servoStep 5. Дополнительные алгоритмы-заделы: `calculateTurnDrive`, `calculateSyncDrive`, `calculateOmniDrive`, `calculateServoControl`.

---

## 📂 Структура проекта

```
NextUI/
├── app/
│   ├── api/                # API routes (прокси к ESP32)
│   │   ├── status/ servo/ motor/ camera/ joystick/ emergency/
│   ├── components/         # React компоненты
│   │   ├── Joystick.tsx, MotorCard.tsx, ServoCard.tsx
│   │   ├── CameraStream.tsx, StatusBar.tsx, Tabs.tsx
│   │   ├── EmergencyStop.tsx, Toast.tsx, RoverVisualizer.tsx
│   │   └── детекторы: YOLODetector, DETRDetector, ObjectDetector,
│   │       MobileNetClassifier, BoundingBoxRenderer, ObjectDetectionTest
│   ├── page.tsx            # Главная страница (вкладки)
│   ├── layout.tsx, globals.css
├── context/RobotContext.tsx   # Глобальное состояние → useRobot()
├── hooks/                  # useESP32, useJoystick, useCamera
├── lib/
│   ├── esp32-client.ts        # ЕДИНСТВЕННАЯ точка общения с ESP32
│   ├── joystick-algorithms.ts # Математика движения (серверная)
│   ├── fetch-with-timeout.ts  # fetch с таймаутом
│   ├── detection-config.ts    # Настройки детекторов
│   └── utils.ts
├── types/                  # esp32.ts, joystick.ts, index.ts
├── scripts/download-wasm.sh  # Локальные WASM-файлы для onnxruntime
└── public/wasm/            # WASM (с фоллбэком на CDN)
```

### Состояние

`context/RobotContext.tsx` → хук `useRobot()`: `motors`, `servos`, `joystickMode` ('drive' | 'servo' | 'mixed'), `isOnline`, `systemIP`.

---

## 🔬 Детекция объектов

- **COCO-SSD** (TensorFlow.js): Lite (~2 МБ, быстрая) и Accurate (~3 МБ, точная), 80 классов — см. [OBJECT_DETECTION.md](OBJECT_DETECTION.md)
- **YOLO / DETR** (onnxruntime-web) — см. [DETECTION_CONFIG.md](DETECTION_CONFIG.md)
- Детекция выполняется каждые 500 мс по кадрам MJPEG-стрима; модель загружается асинхронно при первом использовании
- WASM-файлы сначала ищутся в `public/wasm/` (безопасность, SRI), фоллбэк — CDN:

```bash
bash scripts/download-wasm.sh
```

---

## 🛡️ Безопасность и устойчивость

- Экстренная остановка — красная кнопка и `POST /api/emergency`
- Валидация всех входных данных в API routes (диапазоны, типы)
- Частичный сбой команд джойстика не роняет остальные (`Promise.allSettled`)
- Ошибки подключения показываются пользователю через Toast

## 🐛 Устранение неполадок

| Проблема | Решение |
|----------|---------|
| «ESP32 не отвечает» | Проверьте `NEXT_PUBLIC_ESP32_API_BASE`, робот в той же сети, `curl http://<IP>:8080/api/status` |
| Видеопоток не грузится | Проверьте `NEXT_PUBLIC_CAMERA_STREAM_URL` и отдельную камеру |
| Ошибки типов | `npm run build` — покажет все |
| Детекция не стартует | Загрузите WASM: `bash scripts/download-wasm.sh` (нужен интернет для моделей при первом запуске) |

## 📝 Разработка

**Новый API endpoint:** `app/api/[name]/route.ts` → функции из `lib/esp32-client.ts` → валидация входов.

**Новый компонент:** `app/components/`, состояние через `useRobot()`, хуки из `hooks/`.

**Новый режим джойстика:** тип в `types/joystick.ts` → алгоритм в `lib/joystick-algorithms.ts` → кейс в `calculateJoystickControl()`.

Дополнительные доки: [OBJECT_DETECTION.md](OBJECT_DETECTION.md), [DETECTION_CONFIG.md](DETECTION_CONFIG.md), [CAMERA_IMPROVEMENTS.md](CAMERA_IMPROVEMENTS.md), [UI_FIXES.md](UI_FIXES.md), [CLAUDE.md](CLAUDE.md). Сводная шпаргалка по всему проекту — [`../AGENTS.md`](../AGENTS.md).

## 📄 Лицензия

MIT
