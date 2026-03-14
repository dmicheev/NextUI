'use client';

import { useEffect, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';

interface DetectedObject {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

interface YOLODetectorProps {
  imageElement: HTMLImageElement | null;
  enabled: boolean;
  onObjectsDetected?: (objects: DetectedObject[]) => void;
}

// Классы COCO для YOLO
const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
  'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

export function YOLODetector({ imageElement, enabled, onObjectsDetected }: YOLODetectorProps) {
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка модели YOLOv8
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔄 Начинаем инициализацию ONNX Runtime...');
        
        console.log('🔄 Загружаем модель YOLOv8...');
        
        // Загружаем модель YOLOv8n (nano - самая быстрая версия)
        // Используем публичную модель YOLOv8n
        const modelUrl = 'https://github.com/ultralytics/yolov8/releases/download/v8.0.0/yolov8n.onnx';
        
        const loadedSession = await ort.InferenceSession.create(modelUrl, {
          executionProviders: ['webgl', 'wasm'],
        });
        
        if (isMounted) {
          setSession(loadedSession);
          setIsLoading(false);
          console.log('✅ Модель YOLOv8 загружена успешно');
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
          setError(`Ошибка загрузки модели: ${errorMessage}`);
          setIsLoading(false);
          console.error('❌ Ошибка загрузки модели YOLOv8:', err);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Детекция объектов
  useEffect(() => {
    if (!session || !imageElement || !enabled || !canvasRef.current) {
      console.log('⏸️ Детекция YOLO не запущена:', {
        hasSession: !!session,
        hasImage: !!imageElement,
        enabled,
        hasCanvas: !!canvasRef.current
      });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Не удалось получить контекст canvas');
      return;
    }

    // Настраиваем размер canvas
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    console.log('📐 Размер canvas YOLO:', canvas.width, 'x', canvas.height);

    const detectObjects = async () => {
      if (!session || !imageElement || !ctx) return;

      try {
        console.log('🔍 Начинаем детекцию YOLO...');
        
        // Подготовка изображения
        const inputSize = 640; // YOLOv8 использует размер 640x640
        const imgTensor = await preprocessImage(imageElement, inputSize);
        
        // Выполняем детекцию
        const outputs = await session.run({ images: imgTensor });
        const output = outputs.output0; // YOLOv8 output tensor
        
        // Постобработка результатов
        const detections = postprocessOutput(output, canvas.width, canvas.height, inputSize);
        
        console.log('✅ Детекция YOLO завершена, обнаружено объектов:', detections.length);
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем bounding boxes
        detections.forEach((detection, index) => {
          const [x, y, width, height] = detection.bbox;
          const className = detection.class;
          const confidence = Math.round(detection.score * 100);
          
          console.log(`📦 Объект YOLO ${index + 1}: ${className} (${confidence}%)`, detection.bbox);
          
          // Выбираем цвет
          const color = getClassColor(className);
          
          // Рисуем прямоугольник
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          // Рисуем полупрозрачный фон
          ctx.fillStyle = color + '33';
          ctx.fillRect(x, y, width, height);
          
          // Рисуем текст
          const text = `${className} ${confidence}%`;
          ctx.font = 'bold 16px Arial';
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight = 20;
          
          ctx.fillStyle = color;
          ctx.fillRect(x, y - textHeight, textWidth + 10, textHeight);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(text, x + 5, y - 5);
        });

        // Передаем обнаруженные объекты в родительский компонент
        if (onObjectsDetected) {
          onObjectsDetected(detections);
        }
        
        console.log('📤 Передаем', detections.length, 'объектов YOLO в родительский компонент');
      } catch (err) {
        console.error('❌ Ошибка детекции YOLO:', err);
        if (err instanceof Error) {
          console.error('Детали ошибки:', err.message, err.stack);
        }
      }
    };

    // Запускаем детекцию с интервалом
    detectObjects();
    detectionIntervalRef.current = setInterval(detectObjects, 500); // Детекция каждые 500мс

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [session, imageElement, enabled, onObjectsDetected]);

  // Предобработка изображения для YOLO
  const preprocessImage = async (img: HTMLImageElement, inputSize: number): Promise<ort.Tensor> => {
    const canvas = document.createElement('canvas');
    canvas.width = inputSize;
    canvas.height = inputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Не удалось получить контекст canvas');
    
    // Рисуем изображение с изменением размера
    ctx.drawImage(img, 0, 0, inputSize, inputSize);
    
    // Получаем данные изображения
    const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
    const input = new Float32Array(3 * inputSize * inputSize);
    
    // Конвертируем RGB в формат YOLO (BGR, нормализованный)
    for (let i = 0; i < inputSize * inputSize; i++) {
      input[i] = imageData.data[i * 4 + 2] / 255.0; // R
      input[i + inputSize * inputSize] = imageData.data[i * 4 + 1] / 255.0; // G
      input[i + 2 * inputSize * inputSize] = imageData.data[i * 4] / 255.0; // B
    }
    
    return new ort.Tensor('float32', input, [1, 3, inputSize, inputSize]);
  };

  // Постобработка выхода YOLO
  const postprocessOutput = (
    output: ort.Tensor,
    imgWidth: number,
    imgHeight: number,
    inputSize: number
  ): DetectedObject[] => {
    const data = output.data as Float32Array;
    const [batch, numAnchors, , numClasses] = output.dims;
    
    const detections: DetectedObject[] = [];
    const confThreshold = 0.25; // Порог уверенности
    const iouThreshold = 0.45; // Порог IoU для NMS
    
    // Извлекаем детекции
    for (let i = 0; i < numAnchors; i++) {
      const baseIdx = i * (numClasses + 4);
      
      // Получаем координаты bounding box (center_x, center_y, width, height)
      const cx = data[baseIdx + 0];
      const cy = data[baseIdx + 1];
      const w = data[baseIdx + 2];
      const h = data[baseIdx + 3];
      
      // Получаем максимальную уверенность и класс
      let maxConf = 0;
      let maxClassIdx = 0;
      for (let j = 0; j < numClasses; j++) {
        const conf = data[baseIdx + 4 + j];
        if (conf > maxConf) {
          maxConf = conf;
          maxClassIdx = j;
        }
      }
      
      // Фильтруем по порогу уверенности
      if (maxConf > confThreshold) {
        // Конвертируем координаты из формата YOLO в формат [x, y, width, height]
        const x = (cx - w / 2) * (imgWidth / inputSize);
        const y = (cy - h / 2) * (imgHeight / inputSize);
        const width = w * (imgWidth / inputSize);
        const height = h * (imgHeight / inputSize);
        
        detections.push({
          bbox: [x, y, width, height],
          class: COCO_CLASSES[maxClassIdx] || `class_${maxClassIdx}`,
          score: maxConf
        });
      }
    }
    
    // Применяем Non-Maximum Suppression (NMS)
    return applyNMS(detections, iouThreshold);
  };

  // Non-Maximum Suppression
  const applyNMS = (detections: DetectedObject[], iouThreshold: number): DetectedObject[] => {
    // Сортируем по уверенности
    detections.sort((a, b) => b.score - a.score);
    
    const selected: DetectedObject[] = [];
    
    while (detections.length > 0) {
      const best = detections.shift()!;
      selected.push(best);
      
      // Удаляем детекции с высоким IoU
      detections = detections.filter(det => {
        const iou = calculateIoU(best.bbox, det.bbox);
        return iou < iouThreshold;
      });
    }
    
    return selected;
  };

  // Расчет Intersection over Union (IoU)
  const calculateIoU = (box1: [number, number, number, number], box2: [number, number, number, number]): number => {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;
    
    const x_left = Math.max(x1, x2);
    const y_top = Math.max(y1, y2);
    const x_right = Math.min(x1 + w1, x2 + w2);
    const y_bottom = Math.min(y1 + h1, y2 + h2);
    
    if (x_right < x_left || y_bottom < y_top) return 0;
    
    const intersection_area = (x_right - x_left) * (y_bottom - y_top);
    const box1_area = w1 * h1;
    const box2_area = w2 * h2;
    
    return intersection_area / (box1_area + box2_area - intersection_area);
  };

  // Функция для получения цвета на основе класса объекта
  const getClassColor = (className: string): string => {
    const colors: { [key: string]: string } = {
      'person': '#FF6B6B',
      'car': '#4ECDC4',
      'bicycle': '#45B7D1',
      'motorcycle': '#96CEB4',
      'bus': '#FFEAA7',
      'truck': '#DDA0DD',
      'dog': '#F39C12',
      'cat': '#E74C3C',
      'bird': '#3498DB',
      'horse': '#9B59B6',
      'sheep': '#1ABC9C',
      'cow': '#E67E22',
      'elephant': '#34495E',
      'bear': '#7F8C8D',
      'zebra': '#2ECC71',
      'giraffe': '#16A085',
      'backpack': '#F1C40F',
      'umbrella': '#D35400',
      'handbag': '#C0392B',
      'tie': '#8E44AD',
      'suitcase': '#27AE60',
      'bottle': '#95A5A6',
      'wine glass': '#34495E',
      'cup': '#7F8C8D',
      'fork': '#2ECC71',
      'knife': '#27AE60',
      'spoon': '#16A085',
      'bowl': '#2980B9',
      'banana': '#F1C40F',
      'apple': '#E74C3C',
      'sandwich': '#9B59B6',
      'orange': '#E67E22',
      'broccoli': '#1ABC9C',
      'carrot': '#3498DB',
      'hot dog': '#F39C12',
      'pizza': '#E74C3C',
      'donut': '#9B59B6',
      'cake': '#E67E22',
      'chair': '#34495E',
      'couch': '#7F8C8D',
      'potted plant': '#2ECC71',
      'bed': '#27AE60',
      'dining table': '#16A085',
      'toilet': '#2980B9',
      'tv': '#F1C40F',
      'laptop': '#E74C3C',
      'mouse': '#9B59B6',
      'remote': '#E67E22',
      'keyboard': '#1ABC9C',
      'cell phone': '#3498DB',
      'microwave': '#F39C12',
      'oven': '#E74C3C',
      'toaster': '#9B59B6',
      'sink': '#E67E22',
      'refrigerator': '#1ABC9C',
      'book': '#3498DB',
      'clock': '#F1C40F',
      'vase': '#E74C3C',
      'scissors': '#9B59B6',
      'teddy bear': '#E67E22',
      'hair drier': '#1ABC9C',
      'toothbrush': '#3498DB'
    };
    
    return colors[className] || '#FFFFFF';
  };

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-sm">Загрузка модели YOLOv8...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 z-10">
          <div className="text-red-400 text-center p-4">
            <p className="text-lg font-bold mb-2">❌ Ошибка YOLO</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          display: session && imageElement && enabled ? 'block' : 'none'
        }}
      />
    </>
  );
}
