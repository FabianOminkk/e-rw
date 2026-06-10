'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'bendahara' | 'warga';
  gender: 'L' | 'P';
  birth_date: string | null;
  is_pregnant: boolean | number | null;
  no_kk: string | null;
  no_rt: string | null;
  no_rw: string | null;
  phone: string | null;
  address: string | null;
  status_warga: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 1800);
  };

  useEffect(() => {
    async function loadStoredAuth() {
      const storedToken = localStorage.getItem('e_rw_token');
      const storedUser = localStorage.getItem('e_rw_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          // Fetch fresh user profile to verify token
          const freshUser = await apiFetch('/user');
          setUser(freshUser);
          localStorage.setItem('e_rw_user', JSON.stringify(freshUser));
        } catch (error) {
          // If token invalid/expired, clear storage
          localStorage.removeItem('e_rw_token');
          localStorage.removeItem('e_rw_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadStoredAuth();
  }, []);

  // Handle route protection
  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login'];
    const isPublicPath = publicPaths.includes(pathname);

    if (!token && !isPublicPath) {
      router.push('/login');
    } else if (token && isPublicPath) {
      router.push('/dashboard');
    }
  }, [token, pathname, loading, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiFetch('/login', {
        method: 'POST',
        data: { email, password },
      });

      localStorage.setItem('e_rw_token', data.access_token);
      localStorage.setItem('e_rw_user', JSON.stringify(data.user));
      
      setToken(data.access_token);
      setUser(data.user);
      setLoading(false);
      
      showNotification('Berhasil Login!', 'success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch (e) {
      // Ignore errors on logout, just clear local state
    } finally {
      localStorage.removeItem('e_rw_token');
      localStorage.removeItem('e_rw_user');
      setToken(null);
      setUser(null);
      setLoading(false);
      
      showNotification('Berhasil Logout!', 'success');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await apiFetch('/user');
      setUser(freshUser);
      localStorage.setItem('e_rw_user', JSON.stringify(freshUser));
    } catch (error) {
      // User fetch failed
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
      
      {/* Dynamic Pop-in Notification Modal */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          {/* Style block for css pop keyframes */}
          <style>{`
            @keyframes scaleIn {
              0% { transform: scale(0.3); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes popIn {
              0% { transform: scale(0.9) translateY(10px); opacity: 0; }
              100% { transform: scale(1) translateY(0); opacity: 1; }
            }
          `}</style>

          {/* Blurred Background Overlay */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'rgba(15, 23, 42, 0.25)',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'all'
          }} />
          
          {/* Card Container */}
          <div style={{
            position: 'relative',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#ffffff',
            padding: '28px 48px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            zIndex: 10000,
            maxWidth: '340px',
            textAlign: 'center',
            pointerEvents: 'all',
            animation: 'popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Round Icon */}
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: notification.type === 'success' ? '2.5px solid #10b981' : '2.5px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              color: notification.type === 'success' ? '#10b981' : '#ef4444',
              animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              {notification.type === 'success' ? '✔' : '✖'}
            </div>
            
            {/* Message Text */}
            <span style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: '#f8fafc'
            }}>
              {notification.message}
            </span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
