'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

const PUBLIC_ROUTES = ['/', '/onboarding', '/u/', '/biz/', '/claim/', '/auction'];
const isPublic = (path) => PUBLIC_ROUTES.some(r => path === r || path.startsWith(r));

export function AuthProvider({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [isLoading, setLoading] = useState(true);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem('kryptox_token');
      if (!stored) {
        setLoading(false);
        if (!isPublic(pathname)) router.replace('/onboarding');
        return;
      }
      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
        setToken(stored);
        if (pathname === '/onboarding' || pathname === '/') {
          router.replace('/dashboard/home');
        }
      } catch {
        // Token expired or invalid
        localStorage.removeItem('kryptox_token');
        localStorage.removeItem('kryptox_user');
        localStorage.removeItem('kryptox_address');
        if (!isPublic(pathname)) router.replace('/onboarding');
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback((tokenVal, userData) => {
    localStorage.setItem('kryptox_token', tokenVal);
    localStorage.setItem('kryptox_user', JSON.stringify(userData));
    if (userData.publicAddress) {
      localStorage.setItem('kryptox_address', userData.publicAddress);
    }
    setToken(tokenVal);
    setUser(userData);
    router.replace('/dashboard/home');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('kryptox_token');
    localStorage.removeItem('kryptox_user');
    localStorage.removeItem('kryptox_address');
    setToken(null);
    setUser(null);
    router.replace('/onboarding');
  }, [router]);

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('kryptox_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Full-screen loader while checking auth
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(79,142,247,0.2)',
          borderTopColor: 'var(--accent-blue)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
