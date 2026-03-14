'use client';

import { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

interface DetectedObject {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

interface ObjectDetectorProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  enabled: boolean;
  modelType?: 'lite' | 'accurate';
  onObjectsDetected?: (objects: DetectedObject[]) => void;
}

export function ObjectDetector({ imageRef, enabled, modelType = 'lite', onObjectsDetected }: ObjectDetectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Используем ref для хранения модели и флага детекции
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const isDetectingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка модели при изменении modelType
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    console.log('[ObjectDetector] Загрузка модели, type:', modelType);

    const loadModel = async () => {
      try {
        await tf.ready();
        console.log('[ObjectDetector] TensorFlow backend:', tf.getBackend());

        const baseModel: 'lite_mobilenet_v2' | 'mobilenet_v1' = 
          modelType === 'accurate' ? 'mobilenet_v1' : 'lite_mobilenet_v2';
        
        console.log('[ObjectDetector] Загружаем модель:', baseModel);
        const loadedModel = await cocoSsd.load({ base: baseModel });
        
        console.log('[ObjectDetector] Модель загружена успешно');
        
        if (isMounted) {
          modelRef.current = loadedModel;
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[ObjectDetector] Ошибка загрузки:', err);
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
    // Очищаем предыдущий интервал
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Если детекция выключена или нет модели — очищаем canvas и выходим
    if (!enabled || !modelRef.current) {
      console.log('[ObjectDetector] Детекция остановлена, enabled:', enabled, 'hasModel:', !!modelRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    console.log('[ObjectDetector] Запуск детекции');

    const detect = async () => {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      
      if (isDetectingRef.current || !modelRef.current || !img || !canvas) return;
      
      isDetectingRef.current = true;
      
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const predictions = await modelRef.current.detect(img);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;
          const color = getClassColor(prediction.class);
          const confidence = Math.round(prediction.score * 100);

          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          ctx.fillStyle = color + '33';
          ctx.fillRect(x, y, width, height);

          const text = `${prediction.class} ${confidence}%`;
          ctx.font = 'bold 16px Arial';
          const textWidth = ctx.measureText(text).width;
          ctx.fillStyle = color;
          ctx.fillRect(x, y - 20, textWidth + 10, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(text, x + 5, y - 5);
        });

        if (onObjectsDetected) {
          onObjectsDetected(
            predictions.map(p => ({
              bbox: p.bbox,
              class: p.class,
              score: p.score
            }))
          );
        }
      } catch (err) {
        console.error('[ObjectDetector] Ошибка детекции:', err);
      } finally {
        isDetectingRef.current = false;
      }
    };

    // Первая детекция
    detect();
    
    // Повтор каждые 2 секунды
    intervalRef.current = setInterval(detect, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isDetectingRef.current = false;
    };
  }, [enabled]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-sm">Загрузка модели ИИ...</p>
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
          display: !isLoading && !error && enabled ? 'block' : 'none'
        }}
      />
    </>
  );
}

function getClassColor(className: string): string {
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
    'frisbee': '#2980B9',
    'skis': '#8E44AD',
    'snowboard': '#16A085',
    'sports ball': '#2C3E50',
    'kite': '#F39C12',
    'baseball bat': '#E74C3C',
    'baseball glove': '#9B59B6',
    'skateboard': '#1ABC9C',
    'surfboard': '#3498DB',
    'tennis racket': '#E67E22',
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
}
