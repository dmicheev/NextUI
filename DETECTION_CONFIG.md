# Настройка детекции объектов

## Обзор

В этом проекте реализована детекция объектов с использованием YOLO и DETR моделей. Для улучшения безопасности и гибкости были внесены следующие изменения:

1. **Исправлена критическая уязвимость безопасности** - WASM файлы теперь загружаются из локальных директорий с фоллбэком на CDN
2. **Добавлены настраиваемые параметры** - порог уверенности, максимальное количество объектов, интервал детекции
3. **Создан конфигурационный файл** - централизованные настройки для всех детекторов
4. **Упрощен код** - удалены ненужные паттерны с ref для callbacks

## Настройка WASM файлов

### Проблема безопасности

Ранее WASM файлы загружались напрямую из CDN без проверки целостности (SRI - Subresource Integrity). Это создавало риск атаки через подмену CDN-ресурсов.

### Решение

Теперь система сначала пытается загрузить WASM файлы из локальной директории `public/wasm/`. Если локальные файлы недоступны, используется фоллбэк на CDN.

### Инструкции по установке

1. **Создайте директорию для WASM файлов:**
   ```bash
   mkdir -p public/wasm
   ```

2. **Скачайте WASM файлы:**
   ```bash
   cd public/wasm
   
   # Скачайте файлы из CDN
   curl -O https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm.wasm
   curl -O https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd.wasm
   curl -O https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-threaded.wasm
   curl -O https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd-threaded.wasm
   ```

3. **Проверьте целостность файлов (опционально):**
   ```bash
   # Вычислите SHA-256 хеши
   shasum -a 256 *.wasm
   ```

4. **Добавьте SRI хеши (опционально):**
   Для дополнительной безопасности можно добавить SRI хеши в HTML:
   ```html
   <script src="/wasm/ort-wasm.wasm" 
           integrity="sha256-ВАШ_ХЕШ_SHA256" 
           crossorigin="anonymous"></script>
   ```

### Конфигурация путей

Пути к WASM файлам настраиваются в [`lib/detection-config.ts`](lib/detection-config.ts):

```typescript
export const ONNX_RUNTIME_CONFIG = {
  // Локальные пути (безопасно)
  wasmPaths: {
    'ort-wasm.wasm': '/wasm/ort-wasm.wasm',
    'ort-wasm-simd.wasm': '/wasm/ort-wasm-simd.wasm',
    'ort-wasm-threaded.wasm': '/wasm/ort-wasm-threaded.wasm',
    'ort-wasm-simd-threaded.wasm': '/wasm/ort-wasm-simd-threaded.wasm',
  },
  // Фоллбэк на CDN (для разработки)
  fallbackCDN: {
    'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm.wasm',
    // ... остальные файлы
  },
} as const;
```

## Настраиваемые параметры детекции

### YOLO Детектор

Параметры настраиваются через проп `config` в компоненте [`YOLODetector`](app/components/YOLODetector.tsx):

```typescript
<YOLODetector
  imageRef={imageRef}
  enabled={enabled}
  modelType="yolov8n"
  onObjectsDetected={handleObjectsDetected}
  config={{
    confidenceThreshold: 0.5,    // Порог уверенности (0.0 - 1.0)
    maxDetections: 20,            // Максимальное количество объектов
    detectionInterval: 3000,       // Интервал детекции в мс
    inputSize: 640,               // Размер входного изображения
  }}
/>
```

#### Параметры:

| Параметр | Тип | По умолчанию | Описание |
|----------|------|--------------|-----------|
| `confidenceThreshold` | `number` | `0.5` | Минимальная уверенность для детекции объекта (0.0 - 1.0). Более высокие значения уменьшают количество ложных срабатываний, но могут пропустить некоторые объекты. |
| `maxDetections` | `number` | `20` | Максимальное количество отображаемых объектов. Ограничивает количество bounding boxes на экране для производительности. |
| `detectionInterval` | `number` | `3000` | Интервал между детекциями в миллисекундах. Более высокие значения снижают нагрузку на CPU, но уменьшают частоту обновлений. |
| `inputSize` | `number` | `640` | Размер входного изображения для модели (обычно 640 для YOLO). Изменение может повлиять на точность и скорость. |

### DETR Детектор

Параметры настраиваются аналогично через проп `config` в компоненте [`DETRDetector`](app/components/DETRDetector.tsx):

```typescript
<DETRDetector
  imageRef={imageRef}
  enabled={enabled}
  modelType="rtdetr"
  onObjectsDetected={handleObjectsDetected}
  config={{
    confidenceThreshold: 0.5,
    maxDetections: 20,
    detectionInterval: 3000,
    inputSize: 640,
  }}
/>
```

## Глобальная конфигурация

Дефолтные значения для всех детекторов задаются в [`lib/detection-config.ts`](lib/detection-config.ts):

```typescript
// Настройки YOLO детектора
export const YOLO_DETECTION_CONFIG = {
  confidenceThreshold: 0.5,
  maxDetections: 20,
  detectionInterval: 3000,
  inputSize: 640,
  numClasses: 80,
  numAnchors: 8400,
} as const;

// Настройки DETR детектора
export const DETR_DETECTION_CONFIG = {
  confidenceThreshold: 0.5,
  maxDetections: 20,
  detectionInterval: 3000,
  inputSize: 640,
  numClasses: 90,
} as const;
```

## Рекомендации по настройке

### Для быстрой детекции (низкая нагрузка на CPU)
```typescript
config={{
  confidenceThreshold: 0.6,    // Более строгий фильтр
  maxDetections: 10,            // Меньше объектов
  detectionInterval: 5000,       // Реже обновления
}}
```

### Для точной детекции (высокая точность)
```typescript
config={{
  confidenceThreshold: 0.3,    // Менее строгий фильтр
  maxDetections: 50,            // Больше объектов
  detectionInterval: 1000,       // Чаще обновления
}}
```

### Для баланса между скоростью и точностью
```typescript
config={{
  confidenceThreshold: 0.5,    // Средний фильтр
  maxDetections: 20,            // Среднее количество
  detectionInterval: 3000,       // Средний интервал
}}
```

## Компонент для отрисовки bounding boxes

Создан общий компонент [`BoundingBoxRenderer`](app/components/BoundingBoxRenderer.tsx) для отрисовки bounding boxes. Он может использоваться напрямую или через хук `useBoundingBoxRenderer`.

### Пример использования:

```typescript
import { BoundingBoxRenderer } from '@/components/BoundingBoxRenderer';

<BoundingBoxRenderer
  detections={detections}
  canvasRef={canvasRef}
  width={width}
  height={height}
  maxDetections={20}
  lineWidth={3}
  fontSize={14}
  showConfidence={true}
/>
```

### Использование хука:

```typescript
import { useBoundingBoxRenderer } from '@/components/BoundingBoxRenderer';

useBoundingBoxRenderer(
  canvasRef,
  detections,
  width,
  height,
  {
    maxDetections: 20,
    lineWidth: 3,
    fontSize: 14,
    showConfidence: true,
  }
);
```

## Устранение проблем

### WASM файлы не загружаются

1. Проверьте, что файлы находятся в директории `public/wasm/`
2. Проверьте права доступа к файлам
3. Проверьте консоль браузера на наличие ошибок
4. Убедитесь, что сервер разработки обслуживает статические файлы

### Детекция работает медленно

1. Увеличьте `detectionInterval` (например, до 5000 мс)
2. Уменьшите `maxDetections` (например, до 10)
3. Увеличьте `confidenceThreshold` (например, до 0.6)
4. Используйте более легкую модель (yolov8n вместо yolov10n)

### Слишком много ложных срабатываний

1. Увеличьте `confidenceThreshold` (например, до 0.6 или 0.7)
2. Используйте более точную модель (yolov10n вместо yolov8n)

### Пропускаются объекты

1. Уменьшите `confidenceThreshold` (например, до 0.3 или 0.4)
2. Увеличьте `maxDetections` (например, до 50)

## Дополнительные ресурсы

- [ONNX Runtime Web Documentation](https://onnxruntime.ai/docs/api/js/)
- [YOLOv8 Documentation](https://github.com/ultralytics/ultralytics)
- [DETR Documentation](https://github.com/facebookresearch/detr)
- [COCO Dataset](https://cocodataset.org/)
