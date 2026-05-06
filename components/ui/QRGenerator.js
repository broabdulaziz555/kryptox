'use client';
import { useEffect, useRef } from 'react';

export default function QRGenerator({ value, size = 200, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    // Dynamic import to avoid SSR issues
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#FFFFFF',
          light: '#12121A',
        },
        errorCorrectionLevel: 'M',
      }).catch(console.error);
    });
  }, [value, size]);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="p-3 bg-[#12121A] rounded-2xl border border-[#2A2A3A]">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
