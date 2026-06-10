'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    citizensCount: 0,
    pendingLetters: 0,
    activeComplaints: 0,
    cashBalance: 0,
    unpaidBills: 0,
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        setLoading(true);
        
        // 1. Fetch announcements (accessible by all)
        const annData = await apiFetch('/announcements');
        setAnnouncements(annData.slice(0, 3)); // show top 3

        // 2. Fetch role-specific statistics
        if (['super_admin', 'admin'].includes(user.role)) {
          const citizens = await apiFetch('/citizens');
          const letters = await apiFetch('/letters');
          const complaints = await apiFetch('/complaints');

          const pendingL = letters.filter((l: any) => l.status === 'pending').length;
          const activeC = complaints.filter((c: any) => c.status !== 'resolved').length;

          setStats({
            citizensCount: citizens.length,
            pendingLetters: pendingL,
            activeComplaints: activeC,
            cashBalance: 0,
            unpaidBills: 0,
          });
          setRecentRequests(letters.slice(0, 5));
        } 
        
        else if (user.role === 'bendahara') {
          const financeData = await apiFetch('/finances');
          const bills = await apiFetch('/bills');

          const unpaidB = bills.filter((b: any) => b.status === 'unpaid').length;

          setStats({
            citizensCount: 0,
            pendingLetters: 0,
            activeComplaints: 0,
            cashBalance: financeData.summary?.balance || 0,
            unpaidBills: unpaidB,
          });
          setRecentRequests(bills.slice(0, 5));
        } 
        
        else if (user.role === 'warga') {
          const bills = await apiFetch('/bills');
          const letters = await apiFetch('/letters');
          const complaints = await apiFetch('/complaints');

          const unpaidB = bills.filter((b: any) => b.status === 'unpaid').length;
          const pendingL = letters.filter((l: any) => l.status === 'pending').length;
          const activeC = complaints.filter((c: any) => c.status !== 'resolved').length;

          setStats({
            citizensCount: 0,
            pendingLetters: pendingL,
            activeComplaints: activeC,
            cashBalance: 0,
            unpaidBills: unpaidB,
          });
          setRecentRequests(letters.slice(0, 5));
        }
      } catch (error) {
        console.error('Gagal mengambil data dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title */}
      <div className="page-title-section">
        <h1>Halo, {user?.name}!</h1>
        <p className="page-subtitle">Selamat datang di dashboard layanan elektronik Rukun Warga.</p>
      </div>

      {/* Widget Cards Grid depending on role */}
      <div className="stats-grid">
        {['super_admin', 'admin'].includes(user!.role) && (
          <>
            <div className="stat-card glass-panel cyan glow-cyan">
              <span className="stat-label">Total Warga</span>
              <span className="stat-value">{stats.citizensCount} orang</span>
            </div>
            <div className="stat-card glass-panel purple glow-purple">
              <span className="stat-label">Persetujuan Surat Pending</span>
              <span className="stat-value">{stats.pendingLetters} permohonan</span>
            </div>
            <div className="stat-card glass-panel amber">
              <span className="stat-label">Pengaduan Aktif</span>
              <span className="stat-value">{stats.activeComplaints} aduan</span>
            </div>
          </>
        )}

        {user!.role === 'bendahara' && (
          <>
            <div className="stat-card glass-panel emerald glow-emerald">
              <span className="stat-label">Saldo Kas RW</span>
              <span className="stat-value">{formatRupiah(stats.cashBalance)}</span>
            </div>
            <div className="stat-card glass-panel rose">
              <span className="stat-label">Tagihan Warga Belum Lunas</span>
              <span className="stat-value">{stats.unpaidBills} tagihan</span>
            </div>
          </>
        )}

        {user!.role === 'warga' && (
          <>
            <div className="stat-card glass-panel rose glow-rose">
              <span className="stat-label">Tagihan Anda Belum Lunas</span>
              <span className="stat-value">{stats.unpaidBills} tagihan</span>
            </div>
            <div className="stat-card glass-panel cyan">
              <span className="stat-label">Pengajuan Surat Pending</span>
              <span className="stat-value">{stats.pendingLetters} surat</span>
            </div>
            <div className="stat-card glass-panel amber">
              <span className="stat-label">Aduan Anda Aktif</span>
              <span className="stat-value">{stats.activeComplaints} aduan</span>
            </div>
          </>
        )}
      </div>

      {/* Dashboard Lists */}
      <div className="section-grid">
        {/* Left Side: Recent Activity depending on role */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="panel-header">
            <span className="panel-title">
              {['super_admin', 'admin'].includes(user!.role) && 'Permohonan Surat Terbaru'}
              {user!.role === 'bendahara' && 'Tagihan Iuran Warga'}
              {user!.role === 'warga' && 'Riwayat Pengajuan Surat Anda'}
            </span>
            <Link 
              href={['super_admin', 'admin'].includes(user!.role) ? '/dashboard/letters' : (user!.role === 'bendahara' ? '/dashboard/bills' : '/dashboard/letters')} 
              style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}
            >
              Lihat Semua
            </Link>
          </div>
          <div className="panel-body" style={{ padding: '0' }}>
            {recentRequests.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Belum ada catatan aktivitas terbaru saat ini.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    {['super_admin', 'admin', 'warga'].includes(user!.role) ? (
                      <tr>
                        {['super_admin', 'admin'].includes(user!.role) && <th>Nama Warga</th>}
                        <th>Jenis Surat</th>
                        <th>Keperluan</th>
                        <th>Status</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Warga</th>
                        <th>Bulan</th>
                        <th>Jumlah</th>
                        <th>Status</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {recentRequests.map((item: any) => (
                      <tr key={item.id}>
                        {['super_admin', 'admin', 'warga'].includes(user!.role) ? (
                          <>
                            {['super_admin', 'admin'].includes(user!.role) && <td>{item.user?.name}</td>}
                            <td>{item.letter_type}</td>
                            <td>{item.purpose}</td>
                            <td>
                              <span className={`badge ${item.status}`}>
                                {item.status === 'pending' ? 'Menunggu' : (item.status === 'approved' ? 'Disetujui' : 'Ditolak')}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{item.user?.name}</td>
                            <td>{item.month}</td>
                            <td>{formatRupiah(parseFloat(item.amount))}</td>
                            <td>
                              <span className={`badge ${item.status}`}>
                                {item.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Announcements Board */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="panel-header">
            <span className="panel-title">📢 Pengumuman RW</span>
            <Link href="/dashboard/announcements" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              Semua
            </Link>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {announcements.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                Belum ada pengumuman baru.
              </div>
            ) : (
              announcements.map((ann: any) => (
                <div key={ann.id} style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{ann.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ann.content}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Oleh: {ann.author?.name} | {new Date(ann.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
