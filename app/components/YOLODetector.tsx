'use client';

import { useEffect, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';
import {
  ONNX_RUNTIME_CONFIG,
  MODEL_URLS,
  COCO_CLASSES,
  BOUNDING_BOX_COLORS,
  YOLO_DETECTION_CONFIG,
  type Detection,
  type DetectionConfig,
} from '@/lib/detection-config';

// Настройка путей к WASM файлам с фоллбэком на CDN
const setupWasmPaths = async () => {
  try {
    // Проверяем доступность локальных WASM файлов
    const testUrl = ONNX_RUNTIME_CONFIG.wasmPaths['ort-wasm.wasm'];
    const response = await fetch(testUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log('[YOLO] Используем локальные WASM файлы');
      ort.env.wasm.wasmPaths = ONNX_RUNTIME_CONFIG.wasmPaths as any;
    } else {
      throw new Error('Локальные файлы недоступны');
    }
  } catch (error) {
    console.warn('[YOLO] Локальные WASM файлы недоступны, используем CDN фоллбэк');
    ort.env.wasm.wasmPaths = ONNX_RUNTIME_CONFIG.fallbackCDN as any;
  }
};

// Инициализация путей WASM
setupWasmPaths();

interface YOLODetectorProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  enabled: boolean;
  modelType?: 'yolov8n' | 'yolov10n';
  onObjectsDetected?: (objects: Detection[]) => void;
  config?: DetectionConfig;
}

export function YOLODetector({ imageRef, enabled, modelType = 'yolov8n', onObjectsDetected, config }: YOLODetectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const isDetectingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Объединяем настройки из пропа и дефолтной конфигурации
  const detectionConfig = {
    ...YOLO_DETECTION_CONFIG,
    ...config,
  };

  const {
    confidenceThreshold,
    maxDetections,
    detectionInterval,
    inputSize,
  } = detectionConfig;

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

        const tensor = await preprocessImage(img, inputSize);

        const startTime = performance.now();
        const feeds: { [key: string]: ort.Tensor } = {};
        feeds[session.inputNames[0]] = tensor;

        const results = await session.run(feeds);
        const detectTime = performance.now() - startTime;
        console.log('[YOLO] Инференс за', detectTime.toFixed(0), 'мс');

        const detections = postprocess(results, imgWidth, imgHeight, inputSize, confidenceThreshold);
        console.log('[YOLO] Найдено:', detections.length);

        // Отрисовка
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        detections.slice(0, maxDetections).forEach((det, idx) => {
          const [x, y, w, h] = det.bbox;
          const color = BOUNDING_BOX_COLORS[idx % BOUNDING_BOX_COLORS.length];

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

        if (onObjectsDetected) {
          onObjectsDetected(detections);
        }
      } catch (err) {
        console.error('[YOLO] Ошибка:', err);
      } finally {
        isDetectingRef.current = false;
      }
    };

    // Первый запуск
    detect();

    // Интервал детекции для стабильности
    intervalRef.current = setInterval(detect, detectionInterval);

    return () => {
      console.log('[YOLO] Cleanup');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isDetectingRef.current = false;
    };
  }, [enabled, imageRef, detectionInterval]);

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
  inputSize: number,
  confidenceThreshold: number
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

      if (maxScore < confidenceThreshold) continue;

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
