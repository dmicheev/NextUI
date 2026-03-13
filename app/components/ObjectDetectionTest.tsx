'use client';

import { useState, useRef, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

interface DetectedObject {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export function ObjectDetectionTest() {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('/test-image.jpg');
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Загрузка модели
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

  // Детекция объектов при загрузке изображения
  useEffect(() => {
    if (!model || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const detectObjects = async () => {
      if (!model || !imageRef.current || !ctx) return;

      try {
        console.log('🔍 Начинаем детекцию объектов...');
        
        // Выполняем детекцию
        const predictions = await model.detect(imageRef.current);
        console.log('✅ Детекция завершена, обнаружено объектов:', predictions.length);
        
        // Настраиваем размер canvas
        canvas.width = imageRef.current.naturalWidth || imageRef.current.width;
        canvas.height = imageRef.current.naturalHeight || imageRef.current.height;
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем bounding boxes
        predictions.forEach((prediction, index) => {
          const [x, y, width, height] = prediction.bbox;
          const className = prediction.class;
          const confidence = Math.round(prediction.score * 100);
          
          console.log(`📦 Объект ${index + 1}: ${className} (${confidence}%)`, prediction.bbox);
          
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

        // Сохраняем обнаруженные объекты
        const detectedObjects: DetectedObject[] = predictions.map(p => ({
          bbox: p.bbox,
          class: p.class,
          score: p.score
        }));
        
        setDetectedObjects(detectedObjects);
        console.log('📤 Обнаружено объектов:', detectedObjects.length);
      } catch (err) {
        console.error('❌ Ошибка детекции объектов:', err);
        if (err instanceof Error) {
          console.error('Детали ошибки:', err.message, err.stack);
        }
      }
    };

    detectObjects();
  }, [model, selectedImage]);

  const getClassColor = (className: string): string => {
    const colors: { [key: string]: string } = {
      'person': '#FF6B6B',
      'car': '#4ECDC4',
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
      'bicycle': '#45B7D1',
      'motorcycle': '#96CEB4',
      'bus': '#FFEAA7',
      'truck': '#DDA0DD',
    };
    
    return colors[className] || '#FFFFFF';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
    }
  };

  const handleDetect = () => {
    if (model && imageRef.current) {
      // Пересоздаем эффект детекции
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx && imageRef.current) {
          canvas.width = imageRef.current.naturalWidth || imageRef.current.width;
          canvas.height = imageRef.current.naturalHeight || imageRef.current.height;
          
          model.detect(imageRef.current).then(predictions => {
            console.log('✅ Детекция завершена, обнаружено объектов:', predictions.length);
            setDetectedObjects(predictions.map(p => ({
              bbox: p.bbox,
              class: p.class,
              score: p.score
            })));
          });
        }
      }
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-8 border border-white/10">
      <h2 className="text-cyan-400 text-xl font-bold mb-6 text-center">🧪 Тест детекции объектов</h2>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-sm">Загрузка модели ИИ...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400 font-bold mb-2">❌ Ошибка</p>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="mb-6">
            <label className="block mb-3 text-sm text-gray-400">Загрузите изображение для теста:</label>
            <div className="flex gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1 py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base cursor-pointer"
              />
              <button
                onClick={handleDetect}
                disabled={!model}
                className="bg-cyan-400 text-gray-900 px-6 py-3 rounded-lg font-bold cursor-pointer transition-all duration-200 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 Детектировать
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-yellow-500 text-base mb-4">📷 Исходное изображение</h3>
              <div className="relative bg-black/20 rounded-xl overflow-hidden border-2 border-white/10">
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Test Image"
                  className="max-w-full"
                  onError={(e) => {
                    console.error('Ошибка загрузки изображения:', e);
                    setError('Не удалось загрузить изображение');
                  }}
                  onLoad={() => {
                    console.log('✅ Изображение загружено:', selectedImage);
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <h3 className="text-yellow-500 text-base mb-4">📊 Результаты детекции</h3>
              {detectedObjects.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {detectedObjects.map((obj, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <div>
                          <p className="text-cyan-400 font-bold">{obj.class}</p>
                          <p className="text-gray-400 text-sm">
                            Координаты: [{Math.round(obj.bbox[0])}, {Math.round(obj.bbox[1])}]
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          {Math.round(obj.score * 100)}%
                        </p>
                        <p className="text-gray-400 text-sm">
                          {Math.round(obj.bbox[2])}×{Math.round(obj.bbox[3])}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-lg mb-2">🔍 Объекты не обнаружены</p>
                  <p className="text-sm">Загрузите изображение с объектами для детекции</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-yellow-500 text-base mb-3">ℹ️ Информация</h4>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>✅ Модель COCO-SSD загружена и готова к работе</li>
              <li>✅ Backend TensorFlow.js: {tf.getBackend()}</li>
              <li>✅ Поддерживается 80+ классов объектов</li>
              <li>💡 Загрузите изображение с людьми, животными, транспортом или другими объектами</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
