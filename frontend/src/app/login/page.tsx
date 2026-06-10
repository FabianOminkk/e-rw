'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import './login.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Login gagal. Silakan periksa kembali email dan password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setError(null);
    setIsSubmitting(true);
    setEmail(roleEmail);
    setPassword('password');

    try {
      await login(roleEmail, 'password');
    } catch (err: any) {
      setError(err?.message || 'Quick login gagal.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Neon Glows */}
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      {/* Glassmorphism Card */}
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <div className="login-logo">e-RW</div>
          <p>Portal Pelayanan & Administrasi Rukun Warga</p>
        </div>

        {error && (
          <div className="error-banner animate-fade-in">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              className="input-field"
              type="email"
              id="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              className="input-field"
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <button className="login-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin" style={{ width: '18px', height: '18px', marginRight: '8px' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Mengautentikasi...
              </>
            ) : 'Masuk ke Akun'}
          </button>
        </form>

        {/* Quick Testing Login Grid */}
        <div className="quick-login-section">
          <span className="input-label" style={{ textAlign: 'center', marginBottom: '8px' }}>
            Akses Cepat Pengujian (Role)
          </span>
          <div className="quick-login-grid">
            <button
              className="quick-login-btn super-admin"
              onClick={() => handleQuickLogin('superadmin@erw.com')}
              disabled={isSubmitting}
            >
              Super Admin
            </button>
            <button
              className="quick-login-btn admin"
              onClick={() => handleQuickLogin('admin@erw.com')}
              disabled={isSubmitting}
            >
              Ketua RW
            </button>
            <button
              className="quick-login-btn bendahara"
              onClick={() => handleQuickLogin('bendahara@erw.com')}
              disabled={isSubmitting}
            >
              Bendahara
            </button>
            <button
              className="quick-login-btn warga"
              onClick={() => handleQuickLogin('warga@erw.com')}
              disabled={isSubmitting}
            >
              Warga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
