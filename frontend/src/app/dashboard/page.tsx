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
  const [demographics, setDemographics] = useState<any[]>([
    { label: 'Bayi (<2 th)', count: 0, color: '#0ea5e9' },
    { label: 'Anak-anak (2-11 th)', count: 0, color: '#10b981' },
    { label: 'Remaja (12-17 th)', count: 0, color: '#8b5cf6' },
    { label: 'Lansia (>=60 th)', count: 0, color: '#f59e0b' },
    { label: 'Ibu Hamil', count: 0, color: '#ec4899' },
    { label: 'Dewasa (18-59 th)', count: 0, color: '#64748b' }
  ]);
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

          // Hitung demografi warga secara dinamis
          let babiesCount = 0;
          let childrenCount = 0;
          let teenagersCount = 0;
          let elderlyCount = 0;
          let pregnantCount = 0;
          let adultsCount = 0;

          const getAge = (birthDateStr: string | null) => {
            if (!birthDateStr) return null;
            const today = new Date();
            const birthDate = new Date(birthDateStr);
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            return age;
          };

          citizens.forEach((c: any) => {
            const isPregnant = c.is_pregnant === 1 || c.is_pregnant === true;
            if (c.gender === 'P' && isPregnant) {
              pregnantCount++;
            } else {
              const age = getAge(c.birth_date);
              if (age === null) {
                adultsCount++;
              } else if (age < 2) {
                babiesCount++;
              } else if (age >= 2 && age < 12) {
                childrenCount++;
              } else if (age >= 12 && age < 18) {
                teenagersCount++;
              } else if (age >= 60) {
                elderlyCount++;
              } else {
                adultsCount++;
              }
            }
          });

          setDemographics([
            { label: 'Bayi (<2 th)', count: babiesCount, color: '#0ea5e9' },
            { label: 'Anak-anak (2-11 th)', count: childrenCount, color: '#10b981' },
            { label: 'Remaja (12-17 th)', count: teenagersCount, color: '#8b5cf6' },
            { label: 'Lansia (>=60 th)', count: elderlyCount, color: '#f59e0b' },
            { label: 'Ibu Hamil', count: pregnantCount, color: '#ec4899' },
            { label: 'Dewasa (18-59 th)', count: adultsCount, color: '#64748b' }
          ]);
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

        {/* Right Side: Stack of Widgets (Pie Chart & Announcements) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {['super_admin', 'admin'].includes(user!.role) && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="panel-title" style={{ fontSize: '1rem', fontWeight: 700 }}>📊 Demografi Kelompok Usia Warga</span>
              {(() => {
                const total = demographics.reduce((sum, d) => sum + d.count, 0);
                const activeSlices = demographics.filter(d => d.count > 0);
                
                if (total === 0) {
                  return (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Belum ada data demografi warga yang terdaftar.
                    </div>
                  );
                }

                const r = 50;
                const circ = 2 * Math.PI * r;
                let accumulatedPct = 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                      <svg viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        {activeSlices.map((slice, idx) => {
                          const pct = (slice.count / total) * 100;
                          const offset = circ - (pct / 100) * circ;
                          const rotation = (accumulatedPct / 100) * 360;
                          accumulatedPct += pct;

                          return (
                            <circle
                              key={idx}
                              cx="100"
                              cy="100"
                              r={r}
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth="24"
                              strokeDasharray={circ}
                              strokeDashoffset={offset}
                              transform={`rotate(${rotation} 100 100)`}
                              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                            >
                              <title>{`${slice.label}: ${slice.count} orang (${Math.round(pct)}%)`}</title>
                            </circle>
                          );
                        })}
                      </svg>
                      {/* Text in the middle of donut */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{total}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Warga</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                      {activeSlices.map((slice, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: slice.color, borderRadius: '3px' }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{slice.label}</span>
                          </div>
                          <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{slice.count} org ({Math.round((slice.count / total) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

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
    </div>
  );
}
