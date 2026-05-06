'use client';
import { useEffect, useRef, useState } from 'react';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (!mounted || !scannerRef.current) return;

      const scanner = new Html5QrcodeScanner(
        'qr-scanner-container',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          if (onScan) onScan(decodedText);
          scanner.clear().catch(() => {});
        },
        (error) => {
          // Ignore scan errors (not found etc.)
        }
      );

      instanceRef.current = scanner;
    }).catch(() => {
      setErr('Camera not available');
    });

    return () => {
      mounted = false;
      if (instanceRef.current) {
        instanceRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <button onClick={onClose} className="text-white text-sm">✕ Close</button>
        <span className="text-white font-semibold">Scan QR Code</span>
        <div className="w-12" />
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {err ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-white font-semibold mb-2">Camera not available</p>
            <p className="text-[#8888AA] text-sm mb-4">{err}</p>
            <button onClick={onClose} className="text-[#7B5EA7]">Go back</button>
          </div>
        ) : (
          <>
            <div
              id="qr-scanner-container"
              ref={scannerRef}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
            />
            <p className="text-[#8888AA] text-sm mt-6 text-center">
              Point your camera at a KRYPTOX QR code or crypto address
            </p>
          </>
        )}
      </div>
    </div>
  );
}
