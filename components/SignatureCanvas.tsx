import React, { useRef, useLayoutEffect, useState } from 'react';
import type { Point } from '../types';

interface SignatureCanvasProps {
  onEnd: (signature: string | null) => void;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onEnd }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
        const isDarkMode = document.documentElement.classList.contains('dark');
        ctx.strokeStyle = isDarkMode ? '#f9fafb' : '#111827'; // gray-50 vs gray-900
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const getPoint = (e: MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getPoint(e.nativeEvent);
    if (!point) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      setIsDrawing(true);
      setHasDrawn(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const point = getPoint(e.nativeEvent);
    if (!point) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!isDrawing || !canvas) return;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.closePath();
    }
    setIsDrawing(false);
    onEnd(canvas.toDataURL('image/png'));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        onEnd(null);
      }
    }
  };

  return (
    <div className="relative w-full h-48 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 touch-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {!hasDrawn && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              Veuillez signer ici
          </div>
      )}
      {hasDrawn && (
        <button
          onClick={clearCanvas}
          className="absolute top-2 right-2 p-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center"
          aria-label="Effacer la signature"
        >
          <span className="material-symbols-outlined" style={{fontSize: '18px'}}>close</span>
        </button>
      )}
    </div>
  );
};

export default SignatureCanvas;