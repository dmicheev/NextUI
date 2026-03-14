'use client';

import { useEffect, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';

// Устанавливаем пути к WASM файлам
ort.env.wasm.wasmPaths = {
  'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm.wasm',
  'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-threaded.wasm',
  'ort-wasm-simd-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd-threaded.wasm',
} as any;

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

interface DETRDetectorProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  enabled: boolean;
  modelType?: 'yolov8n' | 'yolov10n' | 'rtdetr';
  onObjectsDetected?: (objects: Detection[]) => void;
}

// URL моделей
const MODEL_URLS = {
  yolov8n: 'https://huggingface.co/deepghs/yolos/resolve/main/yolov8n/model.onnx',
  yolov10n: 'https://huggingface.co/deepghs/yolos/resolve/main/yolov10n/model.onnx',
  rtdetr: 'https://huggingface.co/xnorpx/rt-detr2-onnx/resolve/main/rtdetr_r50.onnx',
};

// COCO классы для DETR (90 объектов)
const COCO_CLASSES: { [key: number]: string } = {
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
  84: 'hair drier', 85: 'toothbrush'
};

// Цвета для классов
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F39C12', '#E74C3C', '#3498DB', '#9B59B6',
  '#1ABC9C', '#E67E22', '#34495E', '#7F8C8D', '#2ECC71',
  '#16A085', '#2980B9', '#F1C40F', '#D35400', '#C0392B'
];

export function DETRDetector({ imageRef, enabled, modelType = 'yolov10n', onObjectsDetected }: DETRDetectorProps) {
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDetectingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка модели
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        console.log('[DETR] Загрузка модели:', modelType);
        
        const url = MODEL_URLS[modelType];
        console.log('[DETR] URL модели:', url);

        const sessionOptions: ort.InferenceSession.SessionOptions = {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
          intraOpNumThreads: 1,
        };

        const loadedSession = await ort.InferenceSession.create(url, sessionOptions);
        console.log('[DETR] Модель загружена, входы:', loadedSession.inputNames, 'выходы:', loadedSession.outputNames);

        if (isMounted) {
          setSession(loadedSession);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[DETR] Ошибка загрузки:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки модели');
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [modelType]);

  // Детекция объектов
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled || !session) {
      console.log('[DETR] Детекция остановлена');
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    console.log('[DETR] Запуск детекции');

    const detect = async () => {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      
      if (isDetectingRef.current || !session || !img || !canvas) return;
      
      isDetectingRef.current = true;

      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Размеры изображения
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;
        
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        // Подготовка изображения
        const inputSize = 640;
        const tensor = await preprocessImage(img, inputSize);

        console.log('[DETR] Запуск инференса...');
        const startTime = performance.now();

        // Инференс
        const feeds: { [key: string]: ort.Tensor } = {};
        feeds[session.inputNames[0]] = tensor;
        
        const results = await session.run(feeds);
        
        const endTime = performance.now();
        console.log('[DETR] Инференс за', (endTime - startTime).toFixed(0), 'мс');

        // Постобработка
        const detections = postprocess(results, imgWidth, imgHeight, inputSize, modelType);
        console.log('[DETR] Обнаружено:', detections.length, 'объектов');

        // Отрисовка
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        detections.forEach((det, idx) => {
          const [x, y, w, h] = det.bbox;
          const color = COLORS[idx % COLORS.length];

          // Рамка
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);

          // Фон
          ctx.fillStyle = color + '33';
          ctx.fillRect(x, y, w, h);

          // Текст
          const text = `${det.class} ${Math.round(det.score * 100)}%`;
          ctx.font = 'bold 16px Arial';
          const textWidth = ctx.measureText(text).width;
          ctx.fillStyle = color;
          ctx.fillRect(x, y - 20, textWidth + 10, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(text, x + 5, y - 5);
        });

        if (onObjectsDetected) {
          onObjectsDetected(detections);
        }
      } catch (err) {
        console.error('[DETR] Ошибка детекции:', err);
      } finally {
        isDetectingRef.current = false;
      }
    };

    detect();
    intervalRef.current = setInterval(detect, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isDetectingRef.current = false;
    };
  }, [enabled, session, imageRef, onObjectsDetected]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-sm">Загрузка RT-DETR модели...</p>
            <p className="text-xs text-gray-400 mt-2">~300MB, может занять время</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 z-10">
          <div className="text-red-400 text-center p-4">
            <p className="text-lg font-bold mb-2">❌ Ошибка</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          display: session && enabled ? 'block' : 'none'
        }}
      />
    </>
  );
}

// Предобработка изображения
async function preprocessImage(
  img: HTMLImageElement,
  inputSize: number
): Promise<ort.Tensor> {
  // Создаём canvas для ресайза
  const canvas = document.createElement('canvas');
  canvas.width = inputSize;
  canvas.height = inputSize;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Нет контекста canvas');
  }

  // Рисуем изображение на canvas
  ctx.drawImage(img, 0, 0, inputSize, inputSize);
  
  // Получаем данные пикселей
  const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
  const data = imageData.data;
  
  // Нормализация и перестановка каналов (HWC -> CHW)
  const tensorData = new Float32Array(3 * inputSize * inputSize);
  
  for (let i = 0; i < inputSize * inputSize; i++) {
    const idx = i * 4;
    // RGB нормализация [0, 1]
    tensorData[i] = data[idx] / 255.0;     // R
    tensorData[i + inputSize * inputSize] = data[idx + 1] / 255.0;  // G
    tensorData[i + inputSize * inputSize * 2] = data[idx + 2] / 255.0;  // B
  }

  return new ort.Tensor('float32', tensorData, [1, 3, inputSize, inputSize]);
}

// Постобработка результатов
function postprocess(
  results: Record<string, ort.Tensor>,
  imgWidth: number,
  imgHeight: number,
  inputSize: number,
  modelType: string
): Detection[] {
  const outputNames = Object.keys(results);
  console.log('[DETR] Выходы модели:', outputNames);

  if (modelType === 'yolov8n' || modelType === 'yolov10n') {
    return postprocessYOLO(results, imgWidth, imgHeight, inputSize, modelType);
  } else {
    return postprocessDETR(results, imgWidth, imgHeight, inputSize);
  }
}

// Постобработка для YOLO
function postprocessYOLO(
  results: Record<string, ort.Tensor>,
  imgWidth: number,
  imgHeight: number,
  inputSize: number,
  modelType: string
): Detection[] {
  const detections: Detection[] = [];
  
  // YOLO выходы: обычно один тензор с формой [1, 84, 8400] или [1, num_boxes, 84]
  // где 84 = 4 (bbox) + 80 (классы)
  const values = Object.values(results);
  if (values.length === 0) {
    console.warn('[YOLO] Нет выходов');
    return [];
  }

  const output = values[0];
  const dims = output.dims;
  console.log('[YOLO] Форма выхода:', dims);

  // Формат [1, 84, 8400] - трансформируем
  let data = output.data as Float32Array;
  
  // Для YOLOv8/v10: [batch, 84, anchors] -> трансформируем к [anchors, 84]
  if (dims.length === 3 && dims[1] === 84) {
    const numAnchors = dims[2];
    const numClasses = 80;
    const scale = Math.max(imgWidth, imgHeight) / inputSize;

    for (let i = 0; i < numAnchors; i++) {
      // Получаем scores для всех классов
      let maxScore = 0;
      let maxClass = 0;
      
      for (let c = 0; c < numClasses; c++) {
        const score = data[4 * numAnchors + c * numAnchors + i];
        if (score > maxScore) {
          maxScore = score;
          maxClass = c;
        }
      }

      // Фильтр по уверенности
      if (maxScore < 0.5) continue;

      // Box: [cx, cy, w, h]
      const cx = data[i] * scale;
      const cy = data[numAnchors + i] * scale;
      const w = data[2 * numAnchors + i] * scale;
      const h = data[3 * numAnchors + i] * scale;

      // Конвертируем к [x, y, w, h]
      const x = (cx - w / 2) * (imgWidth / inputSize);
      const y = (cy - h / 2) * (imgHeight / inputSize);
      const boxW = w * (imgWidth / inputSize);
      const boxH = h * (imgHeight / inputSize);

      detections.push({
        class: COCO_CLASSES[maxClass + 1] || `class_${maxClass}`,
        score: maxScore,
        bbox: [x, y, boxW, boxH]
      });
    }
  }

  return detections;
}

// Постобработка для DETR
function postprocessDETR(
  results: Record<string, ort.Tensor>,
  imgWidth: number,
  imgHeight: number,
  inputSize: number
): Detection[] {
  const detections: Detection[] = [];

  // Получаем выходы модели
  let boxes: Float32Array | null = null;
  let labels: Float32Array | null = null;
  let scores: Float32Array | null = null;

  for (const [name, tensor] of Object.entries(results)) {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('box') || lowerName.includes('bbox')) {
      boxes = tensor.data as Float32Array;
    } else if (lowerName.includes('label') || lowerName.includes('class')) {
      labels = tensor.data as Float32Array;
    } else if (lowerName.includes('score') || lowerName.includes('conf')) {
      scores = tensor.data as Float32Array;
    }
  }

  // Если не нашли по именам, пробуем по порядку
  if (!boxes || !labels || !scores) {
    const values = Object.values(results);
    if (values.length >= 3) {
      boxes = boxes || (values[0].data as Float32Array);
      labels = labels || (values[1].data as Float32Array);
      scores = scores || (values[2].data as Float32Array);
    }
  }

  if (!boxes || !labels || !scores) {
    console.warn('[DETR] Не удалось получить выходы модели');
    return [];
  }

  // Парсим детекции
  const numDetections = labels.length;
  const scale = Math.max(imgWidth, imgHeight) / inputSize;

  for (let i = 0; i < numDetections; i++) {
    const score = scores[i];

    // Фильтр по уверенности
    if (score < 0.5) continue;

    const labelId = Math.round(labels[i]);
    const label = COCO_CLASSES[labelId] || `class_${labelId}`;

    // Box формат: [cx, cy, w, h] -> [x, y, w, h]
    const cx = boxes[i * 4];
    const cy = boxes[i * 4 + 1];
    const w = boxes[i * 4 + 2];
    const h = boxes[i * 4 + 3];

    const x = (cx - w / 2) * scale;
    const y = (cy - h / 2) * scale;
    const boxW = w * scale;
    const boxH = h * scale;

    detections.push({
      class: label,
      score,
      bbox: [x, y, boxW, boxH]
    });
  }

  return detections;
}
