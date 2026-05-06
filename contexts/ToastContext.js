'use client';
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
  }, []);

  const toast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++idCounter;
    setToasts(p => [...p.slice(-4), { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((msg) => toast({ message: msg, type: 'success' }), [toast]);
  const error   = useCallback((msg) => toast({ message: msg, type: 'error'   }), [toast]);
  const info    = useCallback((msg) => toast({ message: msg, type: 'info'    }), [toast]);
  const warning = useCallback((msg) => toast({ message: msg, type: 'warning' }), [toast]);

  const COLOR = {
    success: { bg: 'rgba(0,214,143,0.12)', border: 'rgba(0,214,143,0.3)', text: '#00D68F', icon: '✓' },
    error:   { bg: 'rgba(255,77,106,0.12)', border: 'rgba(255,77,106,0.3)', text: '#FF4D6A', icon: '✕' },
    info:    { bg: 'rgba(79,142,247,0.12)', border: 'rgba(79,142,247,0.3)', text: '#4F8EF7', icon: 'ℹ' },
    warning: { bg: 'rgba(255,159,67,0.12)', border: 'rgba(255,159,67,0.3)', text: '#FF9F43', icon: '⚠' },
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, dismiss }}>
      {children}
      <div style={{
        position: 'fixed', top: 'max(16px, env(safe-area-inset-top))',
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        gap: 8, width: 'min(380px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const c = COLOR[t.type] || COLOR.info;
          return (
            <div key={t.id} onClick={() => dismiss(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: c.bg, border: `1px solid ${c.border}`,
                borderRadius: 12, padding: '12px 16px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                animation: 'toast-in 300ms ease forwards',
                cursor: 'pointer', pointerEvents: 'all',
              }}>
              <span style={{ color: c.text, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{c.icon}</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
