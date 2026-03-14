// Конфигурация для детекции объектов

// Настройки ONNX Runtime Web
export const ONNX_RUNTIME_CONFIG = {
  // Используем локальные WASM файлы для безопасности (SRI)
  // Для продакшена разместите файлы в public/wasm/
  wasmPaths: {
    'ort-wasm.wasm': '/wasm/ort-wasm.wasm',
    'ort-wasm-simd.wasm': '/wasm/ort-wasm-simd.wasm',
    'ort-wasm-threaded.wasm': '/wasm/ort-wasm-threaded.wasm',
    'ort-wasm-simd-threaded.wasm': '/wasm/ort-wasm-simd-threaded.wasm',
  },
  // Фоллбэк на CDN для разработки (если локальные файлы недоступны)
  fallbackCDN: {
    'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm.wasm',
    'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd.wasm',
    'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-threaded.wasm',
    'ort-wasm-simd-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd-threaded.wasm',
  },
} as const;

// Настройки YOLO детектора
export const YOLO_DETECTION_CONFIG = {
  // Порог уверенности для детекции (0.0 - 1.0)
  confidenceThreshold: 0.5,
  
  // Максимальное количество отображаемых объектов
  maxDetections: 3,
  
  // Интервал детекции в миллисекундах
  detectionInterval: 3000,
  
  // Размер входного изображения для модели
  inputSize: 640,
  
  // Количество классов COCO
  numClasses: 80,
  
  // Количество якорей YOLO
  numAnchors: 8400,
} as const;

// Настройки DETR детектора
export const DETR_DETECTION_CONFIG = {
  // Порог уверенности для детекции (0.0 - 1.0)
  confidenceThreshold: 0.5,
  
  // Максимальное количество отображаемых объектов
  maxDetections: 3,
  
  // Интервал детекции в миллисекундах
  detectionInterval: 3000,
  
  // Размер входного изображения для модели
  inputSize: 640,
  
  // Количество классов COCO
  numClasses: 90,
} as const;

// URL моделей для детекции
export const MODEL_URLS = {
  // YOLO модели
  yolov8n: 'https://huggingface.co/deepghs/yolos/resolve/main/yolov8n/model.onnx',
  yolov10n: 'https://huggingface.co/deepghs/yolos/resolve/main/yolov10n/model.onnx',
  
  // DETR модели
  rtdetr: 'https://huggingface.co/xnorpx/rt-detr2-onnx/resolve/main/rtdetr_r50.onnx',
} as const;

// COCO классы для детекции (90 объектов)
export const COCO_CLASSES: { [key: number]: string } = {
  1: 'person', 2: 'bicycle', 3: 'car', 4: 'motorcycle', 5: 'airplane',
  6: 'bus', 7: 'train', 8: 'truck', 9: 'boat', 10: 'traffic light',
  11: 'fire hydrant', 13: 'stop sign', 14: 'parking meter', 15: 'bench',
  16: 'bird', 17: 'cat', 18: 'dog', 19: 'horse', 20: 'sheep',
  21: 'cow', 22: 'elephant', 23: 'bear', 24: 'zebra', 25: 'giraffe',
  27: 'backpack', 28: 'umbrella', 31: 'handbag', 32: 'tie', 33: 'suitcase',
  34: 'frisbee', 35: 'skis', 36: 'snowboard', 37: 'sports ball', 38: 'kite',
  39: 'baseball bat', 40: 'baseball glove', 41: 'skateboard', 42: 'surfboard',
  43: 'tennis racket', 44: 'bottle', 46: 'wine glass', 47: 'cup', 48: 'fork',
  49: 'knife', 50: 'spoon', 51: 'bowl', 52: 'banana', 53: 'apple',
  54: 'sandwich', 55: 'orange', 56: 'broccoli', 57: 'carrot', 58: 'hot dog',
  59: 'pizza', 60: 'donut', 61: 'cake', 62: 'chair', 63: 'couch',
  64: 'potted plant', 65: 'bed', 66: 'dining table', 67: 'toilet', 68: 'tv',
  69: 'laptop', 70: 'mouse', 71: 'remote', 72: 'keyboard', 73: 'cell phone',
  74: 'microwave', 75: 'oven', 76: 'toaster', 77: 'sink', 78: 'refrigerator',
  79: 'book', 80: 'clock', 81: 'vase', 82: 'scissors', 83: 'teddy bear',
  84: 'hair drier', 85: 'toothbrush', 86: 'fork', 87: 'spoon', 88: 'bowl',
  89: 'banana', 90: 'apple'
} as const;

// Цвета для bounding boxes
export const BOUNDING_BOX_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F39C12', '#E74C3C', '#3498DB', '#9B59B6',
] as const;

// Типы моделей детекции
export type DetectionModelType = 'lite' | 'accurate' | 'yolov8n' | 'yolov10n' | 'rtdetr';

// Интерфейс для детекции
export interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

// Интерфейс для настроек детекции (для переопределения по умолчанию)
export interface DetectionConfig {
  confidenceThreshold?: number;
  maxDetections?: number;
  detectionInterval?: number;
  inputSize?: number;
}
