'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Wallet, ArrowUpRight, MessageCircle, User } from 'lucide-react';

const TABS = [
  { label: 'Home',   icon: Home,          path: '/dashboard/home'    },
  { label: 'Wallet', icon: Wallet,         path: '/dashboard/wallet'  },
  { label: null,     icon: ArrowUpRight,   path: '/dashboard/send',   center: true },
  { label: 'Chat',   icon: MessageCircle,  path: '/dashboard/chat'    },
  { label: 'Profile',icon: User,           path: '/dashboard/profile' },
];

export default function BottomNav({ unreadCount = 0 }) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: `calc(64px + env(safe-area-inset-bottom))`,
      background: 'rgba(14,19,32,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50,
    }}>
      {TABS.map((tab) => {
        const Icon    = tab.icon;
        const active  = !tab.center && (pathname === tab.path || pathname.startsWith(tab.path + '/'));
        const isChatTab = tab.path === '/dashboard/chat';

        if (tab.center) {
          return (
            <button key="send"
              onClick={() => router.push(tab.path)}
              style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--accent-gradient)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(79,142,247,0.4)',
                transition: 'transform 100ms, opacity 100ms',
                marginTop: -8,
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Icon size={22} color="#fff" strokeWidth={2.5} />
            </button>
          );
        }

        return (
          <button key={tab.path}
            onClick={() => router.push(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 0', minHeight: 48, position: 'relative',
              transition: 'opacity 100ms',
            }}
            onMouseDown={e => e.currentTarget.style.opacity = '0.6'}
            onMouseUp={e => e.currentTarget.style.opacity = '1'}
            onTouchStart={e => e.currentTarget.style.opacity = '0.6'}
            onTouchEnd={e => e.currentTarget.style.opacity = '1'}
          >
            <div style={{ position: 'relative' }}>
              <Icon
                size={22} strokeWidth={active ? 2.5 : 2}
                color={active ? 'var(--accent-blue)' : 'var(--text-muted)'}
              />
              {isChatTab && unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent-red)',
                  border: '1.5px solid var(--bg-primary)',
                }} />
              )}
            </div>
            {tab.label && (
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontFamily: 'var(--font-base)',
              }}>
                {tab.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
