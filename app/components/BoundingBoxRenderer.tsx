'use client';

import { useRef, useEffect } from 'react';
import { BOUNDING_BOX_COLORS, type Detection } from '@/lib/detection-config';

interface BoundingBoxRendererProps {
  detections: Detection[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
  maxDetections?: number;
  lineWidth?: number;
  fontSize?: number;
  showConfidence?: boolean;
}

/**
 * Компонент для отрисовки bounding boxes на canvas
 * Используется для визуализации результатов детекции объектов
 */
export function BoundingBoxRenderer({
  detections,
  canvasRef,
  width,
  height,
  maxDetections = 20,
  lineWidth = 3,
  fontSize = 14,
  showConfidence = true,
}: BoundingBoxRendererProps) {
  const prevDetectionsRef = useRef<string>('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размеры canvas
    canvas.width = width;
    canvas.height = height;

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовываем bounding boxes
    detections.slice(0, maxDetections).forEach((det, idx) => {
      const [x, y, w, h] = det.bbox;
      const color = BOUNDING_BOX_COLORS[idx % BOUNDING_BOX_COLORS.length];

      // Рисуем рамку
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(x, y, w, h);

      // Рисуем полупрозрачный фон
      ctx.fillStyle = color + '33';
      ctx.fillRect(x, y, w, h);

      // Рисуем текст с названием класса и уверенностью
      if (showConfidence) {
        const text = `${det.class} ${Math.round(det.score * 100)}%`;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(text).width;
        const textHeight = fontSize + 4;
        
        // Рисуем фон для текста
        ctx.fillStyle = color;
        ctx.fillRect(x, y - textHeight, textWidth + 8, textHeight);
        
        // Рисуем текст
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x + 4, y - 4);
      } else {
        // Рисуем только название класса
        const text = det.class;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(text).width;
        const textHeight = fontSize + 4;
        
        // Рисуем фон для текста
        ctx.fillStyle = color;
        ctx.fillRect(x, y - textHeight, textWidth + 8, textHeight);
        
        // Рисуем текст
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x + 4, y - 4);
      }
    });
  }, [detections, canvasRef, width, height, maxDetections, lineWidth, fontSize, showConfidence]);

  return null; // Компонент не рендерит ничего, только рисует на canvas
}

/**
 * Хук для отрисовки bounding boxes
 * Может использоваться напрямую в компонентах детекторов
 */
export function useBoundingBoxRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  detections: Detection[],
  width: number,
  height: number,
  options?: {
    maxDetections?: number;
    lineWidth?: number;
    fontSize?: number;
    showConfidence?: boolean;
  }
) {
  const {
    maxDetections = 20,
    lineWidth = 3,
    fontSize = 14,
    showConfidence = true,
  } = options || {};

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Устанавливаем размеры canvas
    canvas.width = width;
    canvas.height = height;

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовываем bounding boxes
    detections.slice(0, maxDetections).forEach((det, idx) => {
      const [x, y, w, h] = det.bbox;
      const color = BOUNDING_BOX_COLORS[idx % BOUNDING_BOX_COLORS.length];

      // Рисуем рамку
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(x, y, w, h);

      // Рисуем полупрозрачный фон
      ctx.fillStyle = color + '33';
      ctx.fillRect(x, y, w, h);

      // Рисуем текст с названием класса и уверенностью
      if (showConfidence) {
        const text = `${det.class} ${Math.round(det.score * 100)}%`;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(text).width;
        const textHeight = fontSize + 4;
        
        // Рисуем фон для текста
        ctx.fillStyle = color;
        ctx.fillRect(x, y - textHeight, textWidth + 8, textHeight);
        
        // Рисуем текст
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x + 4, y - 4);
      } else {
        // Рисуем только название класса
        const text = det.class;
        ctx.font = `bold ${fontSize}px Arial`;
        const textWidth = ctx.measureText(text).width;
        const textHeight = fontSize + 4;
        
        // Рисуем фон для текста
        ctx.fillStyle = color;
        ctx.fillRect(x, y - textHeight, textWidth + 8, textHeight);
        
        // Рисуем текст
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x + 4, y - 4);
      }
    });
  }, [detections, canvasRef, width, height, maxDetections, lineWidth, fontSize, showConfidence]);
}
