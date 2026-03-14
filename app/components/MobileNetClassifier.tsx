'use client';

import { useEffect, useRef, useState } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';

interface ClassificationResult {
  className: string;
  probability: number;
}

interface MobileNetClassifierProps {
  imageElement: HTMLImageElement | null;
  enabled: boolean;
  onClassifications?: (results: ClassificationResult[]) => void;
}

export function MobileNetClassifier({ imageElement, enabled, onClassifications }: MobileNetClassifierProps) {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classifications, setClassifications] = useState<ClassificationResult[]>([]);

  // Загрузка модели MobileNet V3
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🔄 Начинаем инициализацию MobileNet V3...');
        
        // Загружаем модель MobileNet V3
        const loadedModel = await mobilenet.load({
          version: 2,
          alpha: 1.0,
        });
        
        if (isMounted) {
          setModel(loadedModel);
          setIsLoading(false);
          console.log('✅ Модель MobileNet V3 загружена успешно');
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
          setError(`Ошибка загрузки модели: ${errorMessage}`);
          setIsLoading(false);
          console.error('❌ Ошибка загрузки модели MobileNet V3:', err);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Классификация изображения
  useEffect(() => {
    if (!model || !imageElement || !enabled) {
      console.log('⏸️ Классификация MobileNet не запущена:', {
        hasModel: !!model,
        hasImage: !!imageElement,
        enabled
      });
      return;
    }

    const classifyImage = async () => {
      if (!model || !imageElement) return;

      try {
        console.log('🔍 Начинаем классификацию MobileNet...');
        
        // Выполняем классификацию
        const predictions = await model.classify(imageElement);
        
        console.log('✅ Классификация MobileNet завершена, обнаружено классов:', predictions.length);
        
        // Форматируем результаты
        const results: ClassificationResult[] = predictions.map(p => ({
          className: p.className,
          probability: p.probability
        }));
        
        setClassifications(results);
        
        // Передаем результаты в родительский компонент
        if (onClassifications) {
          onClassifications(results);
        }
        
        console.log('📤 Передаем', results.length, 'классов MobileNet в родительский компонент');
      } catch (err) {
        console.error('❌ Ошибка классификации MobileNet:', err);
        if (err instanceof Error) {
          console.error('Детали ошибки:', err.message, err.stack);
        }
      }
    };

    classifyImage();
  }, [model, imageElement, enabled, onClassifications]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-sm">Загрузка модели MobileNet V3...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 z-10">
          <div className="text-red-400 text-center p-4">
            <p className="text-lg font-bold mb-2">❌ Ошибка MobileNet</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {enabled && !isLoading && !error && classifications.length > 0 && (
        <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 z-10">
          <h4 className="text-yellow-400 text-base mb-3 font-bold">📊 Классификация MobileNet V3</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {classifications.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white/10 rounded border border-white/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">{result.className}</span>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">
                    {Math.round(result.probability * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
