'use client';

import { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

interface DetectedObject {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

interface ObjectDetectorProps {
  imageElement: HTMLImageElement | null;
  enabled: boolean;
  onObjectsDetected?: (objects: DetectedObject[]) => void;
}

export function ObjectDetector({ imageElement, enabled, onObjectsDetected }: ObjectDetectorProps) {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка модели COCO-SSD
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔄 Начинаем инициализацию TensorFlow.js...');
        
        // Настраиваем backend TensorFlow.js
        await tf.ready();
        console.log('✅ TensorFlow.js backend готов:', tf.getBackend());
        
        // Загружаем модель COCO-SSD
        console.log('🔄 Загружаем модель COCO-SSD...');
        const loadedModel = await cocoSsd.load();
        
        if (isMounted) {
          setModel(loadedModel);
          setIsLoading(false);
          console.log('✅ Модель COCO-SSD загружена успешно');
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
          setError(`Ошибка загрузки модели: ${errorMessage}`);
          setIsLoading(false);
          console.error('❌ Ошибка загрузки модели COCO-SSD:', err);
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
    if (!model || !imageElement || !enabled || !canvasRef.current) {
      console.log('⏸️ Детекция не запущена:', {
        hasModel: !!model,
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
    console.log('📐 Размер canvas:', canvas.width, 'x', canvas.height);

    const detectObjects = async () => {
      if (!model || !imageElement || !ctx) return;

      try {
        console.log('🔍 Начинаем детекцию объектов...');
        
        // Выполняем детекцию
        const predictions = await model.detect(imageElement);
        console.log('✅ Детекция завершена, обнаружено объектов:', predictions.length);
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем bounding boxes для каждого обнаруженного объекта
        predictions.forEach((prediction, index) => {
          const [x, y, width, height] = prediction.bbox;
          const className = prediction.class;
          const confidence = Math.round(prediction.score * 100);
          
          console.log(`📦 Объект ${index + 1}: ${className} (${confidence}%)`, prediction.bbox);
          
          // Выбираем цвет для разных классов
          const color = getClassColor(className);
          
          // Рисуем прямоугольник
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          // Рисуем полупрозрачный фон
          ctx.fillStyle = color + '33'; // 20% прозрачность
          ctx.fillRect(x, y, width, height);
          
          // Рисуем текст с классом и уверенностью
          const text = `${className} ${confidence}%`;
          ctx.font = 'bold 16px Arial';
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight = 20;
          
          // Фон для текста
          ctx.fillStyle = color;
          ctx.fillRect(x, y - textHeight, textWidth + 10, textHeight);
          
          // Текст
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(text, x + 5, y - 5);
        });

        // Передаем обнаруженные объекты в родительский компонент
        const detectedObjects: DetectedObject[] = predictions.map(p => ({
          bbox: p.bbox,
          class: p.class,
          score: p.score
        }));
        
        console.log('📤 Передаем', detectedObjects.length, 'объектов в родительский компонент');
        
        if (onObjectsDetected) {
          onObjectsDetected(detectedObjects);
        }
      } catch (err) {
        console.error('❌ Ошибка детекции объектов:', err);
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
  }, [model, imageElement, enabled, onObjectsDetected]);

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
  };

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
          display: model && imageElement && enabled ? 'block' : 'none'
        }}
      />
    </>
  );
}
