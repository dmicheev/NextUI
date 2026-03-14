'use client';

import { useEffect, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';

ort.env.wasm.wasmPaths = {
  'ort-wasm.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm.wasm',
  'ort-wasm-simd.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-threaded.wasm',
  'ort-wasm-simd-threaded.wasm': 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort-wasm-simd-threaded.wasm',
} as any;

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface YOLODetectorProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  enabled: boolean;
  modelType?: 'yolov8n' | 'yolov10n';
  onObjectsDetected?: (objects: Detection[]) => void;
}

const MODEL_URLS = {
  yolov8n: 'https://huggingface.co/deepghs/yolos/resolve/main/yolov8n/model.onnx',
  yolov10n: 'https://huggingface.co/deepghs/yolos/resolve/main/yolov10n/model.onnx',
};

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

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F39C12', '#E74C3C', '#3498DB', '#9B59B6',
];

export function YOLODetector({ imageRef, enabled, modelType = 'yolov8n', onObjectsDetected }: YOLODetectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const isDetectingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onObjectsDetectedRef = useRef(onObjectsDetected);

  useEffect(() => {
    onObjectsDetectedRef.current = onObjectsDetected;
  }, [onObjectsDetected]);

  // Загрузка модели
  useEffect(() => {
    let isMounted = true;
    sessionRef.current = null;
    setIsLoading(true);
    setError(null);

    console.log('[YOLO] Загрузка модели:', modelType);
    const url = MODEL_URLS[modelType];

    const loadModel = async () => {
      try {
        const sessionOptions: ort.InferenceSession.SessionOptions = {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
          intraOpNumThreads: 1,
        };

        console.log('[YOLO] Создание сессии...');
        const loadedSession = await ort.InferenceSession.create(url, sessionOptions);
        console.log('[YOLO] Модель загружена! Входы:', loadedSession.inputNames, 'Выходы:', loadedSession.outputNames);

        if (isMounted) {
          sessionRef.current = loadedSession;
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[YOLO] Ошибка загрузки:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      console.log('[YOLO] Компонент размонтируется');
      isMounted = false;
      sessionRef.current = null;
    };
  }, [modelType]);

  // Детекция
  useEffect(() => {
    // Всегда очищаем интервал при изменении зависимостей
    if (intervalRef.current) {
      console.log('[YOLO] Очистка интервала');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isDetectingRef.current = false;

    // Если не включено или нет сессии — выходим
    if (!enabled || !sessionRef.current) {
      console.log('[YOLO] Детекция выключена или нет сессии:', { enabled, hasSession: !!sessionRef.current });
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    console.log('[YOLO] Старт детекции');

    const detect = async () => {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const session = sessionRef.current;

      // Проверяем всё прямо перед детекцией
      if (!img || !canvas || !session || isDetectingRef.current) {
        return;
      }

      isDetectingRef.current = true;

      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        const inputSize = 640;
        const tensor = await preprocessImage(img, inputSize);

        const startTime = performance.now();
        const feeds: { [key: string]: ort.Tensor } = {};
        feeds[session.inputNames[0]] = tensor;

        const results = await session.run(feeds);
        const detectTime = performance.now() - startTime;
        console.log('[YOLO] Инференс за', detectTime.toFixed(0), 'мс');

        const detections = postprocess(results, imgWidth, imgHeight, inputSize);
        console.log('[YOLO] Найдено:', detections.length);

        // Отрисовка
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        detections.slice(0, 20).forEach((det, idx) => {
          const [x, y, w, h] = det.bbox;
          const color = COLORS[idx % COLORS.length];

          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = color + '33';
          ctx.fillRect(x, y, w, h);

          const text = `${det.class} ${Math.round(det.score * 100)}%`;
          ctx.font = 'bold 14px Arial';
          const textWidth = ctx.measureText(text).width;
          ctx.fillStyle = color;
          ctx.fillRect(x, y - 18, textWidth + 8, 18);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(text, x + 4, y - 4);
        });

        if (onObjectsDetectedRef.current) {
          onObjectsDetectedRef.current(detections);
        }
      } catch (err) {
        console.error('[YOLO] Ошибка:', err);
      } finally {
        isDetectingRef.current = false;
      }
    };

    // Первый запуск
    detect();

    // Интервал 3 секунды для стабильности
    intervalRef.current = setInterval(detect, 3000);

    return () => {
      console.log('[YOLO] Cleanup');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isDetectingRef.current = false;
    };
  }, [enabled, imageRef]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-sm">Загрузка YOLO...</p>
            <p className="text-xs text-gray-400 mt-2">~6MB</p>
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
        style={{ display: !isLoading && !error && enabled ? 'block' : 'none' }}
      />
    </>
  );
}

async function preprocessImage(img: HTMLImageElement, inputSize: number): Promise<ort.Tensor> {
  const canvas = document.createElement('canvas');
  canvas.width = inputSize;
  canvas.height = inputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Нет контекста');

  ctx.drawImage(img, 0, 0, inputSize, inputSize);
  const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
  const data = imageData.data;

  const tensorData = new Float32Array(3 * inputSize * inputSize);
  for (let i = 0; i < inputSize * inputSize; i++) {
    const idx = i * 4;
    tensorData[i] = data[idx] / 255.0;
    tensorData[i + inputSize * inputSize] = data[idx + 1] / 255.0;
    tensorData[i + inputSize * inputSize * 2] = data[idx + 2] / 255.0;
  }

  return new ort.Tensor('float32', tensorData, [1, 3, inputSize, inputSize]);
}

function postprocess(
  results: Record<string, ort.Tensor>,
  imgWidth: number,
  imgHeight: number,
  inputSize: number
): Detection[] {
  const detections: Detection[] = [];
  const values = Object.values(results);

  if (values.length === 0) return [];

  const output = values[0];
  const dims = output.dims;
  const data = output.data as Float32Array;

  // YOLO: [1, 84, 8400]
  if (dims.length === 3 && dims[1] === 84 && dims[2] === 8400) {
    const numAnchors = 8400;
    const xScale = imgWidth / inputSize;
    const yScale = imgHeight / inputSize;

    for (let i = 0; i < numAnchors; i++) {
      let maxScore = 0;
      let maxClass = 0;

      for (let c = 0; c < 80; c++) {
        const score = data[4 * numAnchors + c * numAnchors + i];
        if (score > maxScore) {
          maxScore = score;
          maxClass = c;
        }
      }

      if (maxScore < 0.5) continue;

      const cx = data[i] * xScale;
      const cy = data[numAnchors + i] * yScale;
      const w = data[2 * numAnchors + i] * xScale;
      const h = data[3 * numAnchors + i] * yScale;

      detections.push({
        class: COCO_CLASSES[maxClass + 1] || `class_${maxClass}`,
        score: maxScore,
        bbox: [(cx - w / 2), (cy - h / 2), w, h]
      });
    }
  }

  return detections;
}
