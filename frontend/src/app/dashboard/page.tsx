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
  const [hoveredSlice, setHoveredSlice] = useState<{
    label: string;
    count: number;
    pct: number;
    color: string;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

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
                const bayiCount = demographics.find(d => d.label === 'Bayi (<2 th)')?.count || 0;
                const anakCount = demographics.find(d => d.label === 'Anak-anak (2-11 th)')?.count || 0;
                const remajaCount = demographics.find(d => d.label === 'Remaja (12-17 th)')?.count || 0;
                const lansiaCount = demographics.find(d => d.label === 'Lansia (>=60 th)')?.count || 0;
                const hamilCount = demographics.find(d => d.label === 'Ibu Hamil')?.count || 0;
                const dewasaCount = demographics.find(d => d.label === 'Dewasa (18-59 th)')?.count || 0;

                const total = bayiCount + anakCount + remajaCount + lansiaCount + hamilCount + dewasaCount;

                if (total === 0) {
                  return (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Belum ada data demografi warga yang terdaftar.
                    </div>
                  );
                }

                // Inner Ring: Broad Categories
                const innerGroups = [
                  { label: 'Anak & Remaja', count: bayiCount + anakCount + remajaCount, color: '#10b981' },
                  { label: 'Dewasa', count: dewasaCount + hamilCount, color: '#6366f1' },
                  { label: 'Lansia', count: lansiaCount, color: '#f59e0b' }
                ].filter(g => g.count > 0);

                let accumulatedInnerPct = 0;
                const innerSegments = innerGroups.map(g => {
                  const pct = (g.count / total) * 100;
                  const rotation = (accumulatedInnerPct / 100) * 360 - 90;
                  accumulatedInnerPct += pct;
                  return { ...g, pct, rotation };
                });

                // Outer Ring: Detailed Categories (Aligned to parents)
                const outerGroups = [
                  { label: 'Bayi (<2 th)', count: bayiCount, color: '#0ea5e9', parent: 'Anak & Remaja' },
                  { label: 'Anak-anak (2-11 th)', count: anakCount, color: '#34d399', parent: 'Anak & Remaja' },
                  { label: 'Remaja (12-17 th)', count: remajaCount, color: '#a78bfa', parent: 'Anak & Remaja' },
                  { label: 'Dewasa (18-59 th)', count: dewasaCount, color: '#94a3b8', parent: 'Dewasa' },
                  { label: 'Ibu Hamil', count: hamilCount, color: '#f472b6', parent: 'Dewasa' },
                  { label: 'Lansia (>=60 th)', count: lansiaCount, color: '#fbbf24', parent: 'Lansia' }
                ].filter(g => g.count > 0);

                let accumulatedOuterPct = 0;
                const outerSegments = outerGroups.map(g => {
                  const pct = (g.count / total) * 100;
                  const rotation = (accumulatedOuterPct / 100) * 360 - 90;
                  accumulatedOuterPct += pct;
                  return { ...g, pct, rotation };
                });

                const rInner = 42;
                const circInner = 2 * Math.PI * rInner;
                const rOuter = 65;
                const circOuter = 2 * Math.PI * rOuter;

                const handleMouseMove = (e: React.MouseEvent, label: string, count: number, pct: number, color: string) => {
                  setHoveredLabel(label);
                  const container = e.currentTarget.closest('.chart-container');
                  if (container) {
                    const rect = container.getBoundingClientRect();
                    setHoveredSlice({
                      label,
                      count,
                      pct,
                      color,
                      x: e.clientX - rect.left + 15,
                      y: e.clientY - rect.top - 15
                    });
                  }
                };

                const handleMouseLeave = () => {
                  setHoveredLabel(null);
                  setHoveredSlice(null);
                };

                return (
                  <div className="chart-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', width: '100%' }}>
                    {/* SVG Chart */}
                    <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        {/* Inner Ring */}
                        {innerSegments.map((slice, idx) => {
                          const isHovered = hoveredLabel === slice.label;
                          const opacity = hoveredLabel === null ? 1 : (isHovered ? 1 : 0.55);
                          const strokeWidth = isHovered ? 20 : 15;
                          const gap = slice.pct === 100 ? 0 : 2.5;
                          const dashLength = Math.max(0, (slice.pct / 100) * circInner - gap);

                          return (
                            <circle
                              key={`inner-${idx}`}
                              cx="100"
                              cy="100"
                              r={rInner}
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth={strokeWidth}
                              strokeDasharray={`${dashLength} ${circInner}`}
                              transform={`rotate(${slice.rotation} 100 100)`}
                              onMouseMove={(e) => handleMouseMove(e, slice.label, slice.count, slice.pct, slice.color)}
                              onMouseLeave={handleMouseLeave}
                              style={{
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                opacity
                              }}
                            />
                          );
                        })}

                        {/* Outer Ring */}
                        {outerSegments.map((slice, idx) => {
                          const isHovered = hoveredLabel === slice.label;
                          const opacity = hoveredLabel === null ? 1 : (isHovered ? 1 : 0.55);
                          const strokeWidth = isHovered ? 20 : 15;
                          const gap = slice.pct === 100 ? 0 : 3.5;
                          const dashLength = Math.max(0, (slice.pct / 100) * circOuter - gap);

                          return (
                            <circle
                              key={`outer-${idx}`}
                              cx="100"
                              cy="100"
                              r={rOuter}
                              fill="transparent"
                              stroke={slice.color}
                              strokeWidth={strokeWidth}
                              strokeDasharray={`${dashLength} ${circOuter}`}
                              transform={`rotate(${slice.rotation} 100 100)`}
                              onMouseMove={(e) => handleMouseMove(e, slice.label, slice.count, slice.pct, slice.color)}
                              onMouseLeave={handleMouseLeave}
                              style={{
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                opacity
                              }}
                            />
                          );
                        })}
                      </svg>

                      {/* Text in the middle of donut */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{total}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Warga</span>
                      </div>
                    </div>

                    {/* Sleek Tooltip */}
                    {hoveredSlice && (
                      <div
                        style={{
                          position: 'absolute',
                          top: hoveredSlice.y,
                          left: hoveredSlice.x,
                          background: 'rgba(15, 23, 42, 0.95)',
                          color: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          pointerEvents: 'none',
                          zIndex: 1000,
                          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          whiteSpace: 'nowrap',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'top 0.1s ease, left 0.1s ease'
                        }}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hoveredSlice.color, display: 'inline-block' }} />
                        <span>{hoveredSlice.label}: <span style={{ color: '#38bdf8' }}>{hoveredSlice.count} orang ({Math.round(hoveredSlice.pct)}%)</span></span>
                      </div>
                    )}

                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                      {/* Inner Ring Legends */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginBottom: '8px' }}>
                        {innerGroups.map((g, idx) => (
                          <div
                            key={`legend-in-${idx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              opacity: hoveredLabel === null ? 1 : (hoveredLabel === g.label ? 1 : 0.45)
                            }}
                            onMouseEnter={() => setHoveredLabel(g.label)}
                            onMouseLeave={() => setHoveredLabel(null)}
                          >
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', background: g.color, borderRadius: '50%' }} />
                            <span>{g.label} ({g.count})</span>
                          </div>
                        ))}
                      </div>

                      {/* Outer Ring Legends */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.75rem' }}>
                        {outerGroups.map((g, idx) => (
                          <div
                            key={`legend-out-${idx}`}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              background: hoveredLabel === g.label ? '#f1f5f9' : 'transparent',
                              opacity: hoveredLabel === null ? 1 : (hoveredLabel === g.label ? 1 : 0.45),
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={() => setHoveredLabel(g.label)}
                            onMouseLeave={() => setHoveredLabel(null)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: g.color, borderRadius: '3px' }} />
                              <span style={{ color: 'var(--text-secondary)' }}>{g.label}</span>
                            </div>
                            <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{g.count} org</span>
                          </div>
                        ))}
                      </div>
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
