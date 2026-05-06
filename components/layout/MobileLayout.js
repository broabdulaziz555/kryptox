'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/ui/BottomNav';

export default function MobileLayout({ children, title, showBack = false, rightAction = null, noPad = false }) {
  const router  = useRouter();
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const u = localStorage.getItem('kryptox_user');
    if (!u) { router.replace('/onboarding'); return; }
    setReady(true);
  }, []);

  if (!ready) return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(79,142,247,0.2)',
        borderTopColor: 'var(--accent-blue)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      maxWidth: 430, margin: '0 auto',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Header */}
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px',
          paddingTop: 'max(52px, calc(44px + env(safe-area-inset-top)))',
          paddingBottom: 12,
          flexShrink: 0,
        }}>
          {showBack ? (
            <button onClick={() => router.back()} style={{
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}>
              ←
            </button>
          ) : <div style={{ width: 36 }} />}
          <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{title}</span>
          {rightAction || <div style={{ width: 36 }} />}
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        paddingTop: !title ? 'max(52px, calc(44px + env(safe-area-inset-top)))' : 0,
      }}>
        {children}
      </div>

      <BottomNav unreadCount={unread} />
    </div>
  );
}
