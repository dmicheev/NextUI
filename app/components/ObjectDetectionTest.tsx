'use client';

import { useState, useRef, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';

interface DetectedObject {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

export function ObjectDetectionTest() {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [mobilenetModel, setMobilenetModel] = useState<mobilenet.MobileNet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modelType, setModelType] = useState<'coco-ssd' | 'mobilenet'>('coco-ssd');
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
        
        if (modelType === 'mobilenet') {
          // Загружаем модель MobileNet
          console.log('🔄 Загружаем модель MobileNet V2...');
          const loadedModel = await mobilenet.load({
            version: 2,
            alpha: 1.0,
          });
          
          if (isMounted) {
            setMobilenetModel(loadedModel);
            setIsLoading(false);
            console.log('✅ Модель MobileNet V2 загружена успешно');
          }
        } else {
          // Загружаем модель COCO-SSD
          console.log('🔄 Загружаем модель COCO-SSD (mobilenet_v1 - более точная)...');
          const loadedModel = await cocoSsd.load({
            base: 'mobilenet_v1'
          });
          
          if (isMounted) {
            setModel(loadedModel);
            setIsLoading(false);
            console.log('✅ Модель COCO-SSD загружена успешно');
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
          setError(`Ошибка загрузки модели: ${errorMessage}`);
          setIsLoading(false);
          console.error('❌ Ошибка загрузки модели:', err);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [modelType]);

  // Детекция объектов при загрузке изображения
  const [detectTrigger, setDetectTrigger] = useState(0);

  // Детекция объектов при загрузке изображения
  useEffect(() => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const detectObjects = async () => {
      if (!imageRef.current || !ctx) return;

      try {
        console.log('🔍 Начинаем детекцию/классификацию...');

        if (modelType === 'mobilenet' && mobilenetModel) {
          // Выполняем классификацию MobileNet
          const predictions = await mobilenetModel.classify(imageRef.current);
          console.log('✅ Классификация MobileNet завершена, обнаружено классов:', predictions.length);
          
          // Настраиваем размер canvas
          canvas.width = imageRef.current.naturalWidth || imageRef.current.width;
          canvas.height = imageRef.current.naturalHeight || imageRef.current.height;
          
          // Очищаем canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Рисуем результаты классификации с выделением областей
          predictions.slice(0, 5).forEach((prediction, index) => {
            const className = prediction.className;
            const confidence = Math.round(prediction.probability * 100);
            
            console.log(`📦 Класс ${index + 1}: ${className} (${confidence}%)`);
            
            // Выбираем цвет
            const color = getClassColor(className);
            
            // Рисуем прямоугольник для всего изображения
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Рисуем полупрозрачный фон
            ctx.fillStyle = color + '33';
            ctx.fillRect(10, 10, canvas.width - 20, canvas.height - 20);
            
            // Рисуем текст
            const text = `${className} ${confidence}%`;
            ctx.font = 'bold 16px Arial';
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const textHeight = 20;
            
            ctx.fillStyle = color;
            ctx.fillRect(10, 10, textWidth + 10, textHeight);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(text, 10 + 5, 10 + 15);
            
            // Рисуем дополнительное выделение области для классификации
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
            ctx.setLineDash([]);
          });

          // Сохраняем обнаруженные объекты
          const detectedObjects: DetectedObject[] = predictions.slice(0, 5).map(p => ({
            bbox: [0, 0, 100, 100], // Placeholder bounding box
            class: p.className,
            score: p.probability
          }));
          
          setDetectedObjects(detectedObjects);
          console.log('📤 Передаем', detectedObjects.length, 'классов MobileNet в родительский компонент');
        } else if (model) {
          // Выполняем детекцию COCO-SSD
          const predictions = await model.detect(imageRef.current);
          console.log('✅ Детекция COCO-SSD завершена, обнаружено объектов:', predictions.length);
          
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
          console.log('📤 Передаем', detectedObjects.length, 'объектов COCO-SSD в родительский компонент');
        }
      } catch (err) {
        console.error('❌ Ошибка детекции/классификации:', err);
        if (err instanceof Error) {
          console.error('Детали ошибки:', err.message, err.stack);
        }
      }
    };

    detectObjects();
  }, [model, mobilenetModel, modelType, selectedImage, detectTrigger]);

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
      'frisbee': '#F1C40F',
      'skis': '#F1C40F',
      'snowboard': '#F1C40F',
      'sports ball': '#F1C40F',
      'kite': '#F1C40F',
      'baseball bat': '#F1C40F',
      'baseball glove': '#F1C40F',
      'skateboard': '#F1C40F',
      'surfboard': '#F1C40F',
      'tennis racket': '#F1C40F',
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
      'sink': '#2980B9',
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
    }
  };

  const handleDetect = () => {
    console.log('🔍 Кнопка "Детектировать" нажата');
    // Триггерим запуск детекции через useEffect
    setDetectTrigger(prev => prev + 1);
  };

  return (
    <div className="bg-white/5 rounded-xl p-8 border border-white/10">
      <h2 className="text-cyan-400 text-xl font-bold mb-6 text-center">🧪 Тест ИИ</h2>

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
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <label className="block mb-3 text-sm text-gray-400">Выбор модели:</label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value as 'coco-ssd' | 'mobilenet')}
              className="w-full py-3 px-4 border border-white/20 rounded-lg bg-white/10 text-white text-base cursor-pointer"
            >
              <option value="coco-ssd">COCO-SSD (детекция объектов)</option>
              <option value="mobilenet">MobileNet V2 (классификация)</option>
            </select>
          </div>

          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
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
                disabled={!selectedImage}
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
                {selectedImage ? (
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
                ) : (
                  <div className="flex items-center justify-center py-20 text-gray-400">
                    <p className="text-lg">Загрузите изображение для тестирования</p>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <h3 className="text-yellow-500 text-base mb-4">📊 Результаты {modelType === 'mobilenet' ? 'классификации' : 'детекции'}</h3>
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
                            Уверенность: {Math.round(obj.score * 100)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          {Math.round(obj.score * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-lg mb-2">🔍 Объекты не обнаружены</p>
                  <p className="text-sm">Загрузите изображение с объектами для {modelType === 'mobilenet' ? 'классификации' : 'детекции'}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-yellow-500 text-base mb-3">ℹ️ Информация</h4>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>✅ Модель {modelType === 'mobilenet' ? 'MobileNet V2' : 'COCO-SSD'} загружена и готова к работе</li>
              <li>✅ Backend TensorFlow.js: {tf.getBackend()}</li>
              <li>💡 Загрузите изображение с {modelType === 'mobilenet' ? 'распознаваемыми объектами' : 'людьми, животными, транспортом и др.'}</li>
              <li>💡 Для COCO-SSD: детекция 80+ классов объектов с bounding boxes</li>
              <li>💡 Для MobileNet: классификация 1000+ классов объектов</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
