'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import './dashboard.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return null; // AuthContext redirects to /login
  }

  // Get active menu helper
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  };

  const getMenuRoleClass = () => {
    return user.role;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">e-RW</div>

        <nav className="sidebar-menu">
          <Link href="/dashboard" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard') ? 'active' : ''}`}>
            <span>🏠</span> Dashboard
          </Link>

          {/* Admin / Super Admin Menus */}
          {['super_admin', 'admin'].includes(user.role) && (
            <>
              <Link href="/dashboard/citizens" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/citizens') ? 'active' : ''}`}>
                <span>👥</span> Data Warga
              </Link>
              <Link href="/dashboard/letters" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/letters') ? 'active' : ''}`}>
                <span>📄</span> Persetujuan Surat
              </Link>
              <Link href="/dashboard/complaints" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/complaints') ? 'active' : ''}`}>
                <span>⚠️</span> Pengaduan Warga
              </Link>
            </>
          )}

          {/* Bendahara / Super Admin Menus */}
          {['bendahara', 'super_admin'].includes(user.role) && (
            <>
              <Link href="/dashboard/finances" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/finances') ? 'active' : ''}`}>
                <span>💰</span> Keuangan Kas
              </Link>
              <Link href="/dashboard/bills" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/bills') ? 'active' : ''}`}>
                <span>💳</span> Tagihan Iuran
              </Link>
            </>
          )}

          {/* Warga Menus */}
          {user.role === 'warga' && (
            <>
              <Link href="/dashboard/bills" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/bills') ? 'active' : ''}`}>
                <span>💳</span> Status Iuran
              </Link>
              <Link href="/dashboard/letters" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/letters') ? 'active' : ''}`}>
                <span>📄</span> Pengajuan Surat
              </Link>
              <Link href="/dashboard/complaints" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/complaints') ? 'active' : ''}`}>
                <span>⚠️</span> Lapor Pengaduan
              </Link>
            </>
          )}

          {/* Announcements (Visible to everyone) */}
          <Link href="/dashboard/announcements" className={`menu-item ${getMenuRoleClass()} ${isActive('/dashboard/announcements') ? 'active' : ''}`}>
            <span>📢</span> Pengumuman
          </Link>
        </nav>

        {/* User Profile info at bottom */}
        <div className="sidebar-user" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '50%' }}>
            {user.gender === 'P' ? '👩' : '👨'}
          </div>
          <div className="user-info" style={{ flexGrow: 1, minWidth: 0 }}>
            <span className="user-name" title={user.name}>{user.name}</span>
            <span className={`user-role-badge ${user.role}`}>
              {user.role === 'admin' ? 'Ketua RT' : user.role.replace('_', ' ')}
            </span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} style={{ marginTop: '8px' }}>
          🚪 Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              RT {user.no_rt || '03'} / RW {user.no_rw || '12'}
            </span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <div className="dashboard-view-area">
          {children}
        </div>
      </main>
    </div>
  );
}
