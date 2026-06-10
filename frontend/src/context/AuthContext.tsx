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
  const router = useRouter();
  const pathname = usePathname();

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
      
      router.push('/dashboard');
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
      router.push('/login');
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
