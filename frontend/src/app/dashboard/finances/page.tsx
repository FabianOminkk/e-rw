'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function FinancesPage() {
  const { user } = useAuth();
  const [finances, setFinances] = useState<any>({ summary: { total_income: 0, total_expense: 0, balance: 0 }, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<{
    id: number;
    description: string;
    type: 'income' | 'expense';
    amount: number;
    date: string;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredDonut, setHoveredDonut] = useState<{
    label: string;
    amount: number;
    pct: number;
    color: string;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/finances');
      setFinances(data);
    } catch (err) {
      console.error('Gagal memuat keuangan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (['bendahara', 'admin', 'super_admin'].includes(user?.role || '')) {
      fetchFinances();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch('/finances', {
        method: 'POST',
        data: {
          ...formData,
          amount: parseFloat(formData.amount),
        },
      });
      setIsModalOpen(false);
      setFormData({
        type: 'income',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchFinances();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  if (loading && finances.transactions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isBendahara = user?.role === 'bendahara';

  const totalIncome = parseFloat(finances.summary?.total_income || 0);
  const totalExpense = parseFloat(finances.summary?.total_expense || 0);
  const totalFlow = totalIncome + totalExpense;
  const incomePercentage = totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 0;
  const expensePercentage = totalFlow > 0 ? Math.round((totalExpense / totalFlow) * 100) : 0;

  const lastTx = [...(finances.transactions || [])]
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10);

  const maxVal = Math.max(...lastTx.map((t: any) => parseFloat(t.amount)), 100000);
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 85;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const barWidth = 24;
  const spacing = lastTx.length > 1 ? (chartWidth - barWidth * lastTx.length) / (lastTx.length - 1) : chartWidth;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title & Top Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-section">
          <h1>Laporan Keuangan Kas RW</h1>
          <p className="page-subtitle">Pencatatan kas masuk dan keluar untuk operasional RW {user?.no_rw}.</p>
        </div>
        {isBendahara && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            💰 Catat Transaksi Baru
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-panel emerald glow-emerald">
          <span className="stat-label">Saldo Kas RW</span>
          <span className="stat-value">{formatRupiah(finances.summary?.balance || 0)}</span>
        </div>
        <div className="stat-card glass-panel cyan">
          <span className="stat-label">Total Pemasukan</span>
          <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {formatRupiah(finances.summary?.total_income || 0)}
          </span>
        </div>
        <div className="stat-card glass-panel rose">
          <span className="stat-label">Total Pengeluaran</span>
          <span className="stat-value" style={{ color: 'var(--accent-rose)' }}>
            {formatRupiah(finances.summary?.total_expense || 0)}
          </span>
        </div>
      </div>

      {/* Visualisasi Keuangan Kas (Grid 2 Kolom) */}
      <div className="section-grid">
        {/* Kolom Kiri: Bar Chart Tren Arus Kas */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>📈 Tren Arus Kas Masuk & Keluar Terakhir (Real-time)</span>
          {lastTx.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada transaksi kas untuk digambar grafik.
            </div>
          ) : (
            <div className="chart-container" style={{ position: 'relative', width: '100%' }}>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                {/* Grid Lines */}
                <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="#f1f5f9" strokeWidth="1" />
                <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={svgWidth - paddingRight} y2={paddingTop + chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1={paddingLeft} y1={svgHeight - paddingBottom} x2={svgWidth - paddingRight} y2={svgHeight - paddingBottom} stroke="#cbd5e1" strokeWidth="1.5" />
                
                {/* Y-Axis Labels */}
                <text x={paddingLeft - 10} y={paddingTop + 4} textAnchor="end" style={{ fontSize: '0.65rem', fill: 'var(--text-muted)', fontWeight: 700 }}>{formatRupiah(maxVal)}</text>
                <text x={paddingLeft - 10} y={paddingTop + chartHeight / 2 + 4} textAnchor="end" style={{ fontSize: '0.65rem', fill: 'var(--text-muted)', fontWeight: 700 }}>{formatRupiah(maxVal / 2)}</text>
                <text x={paddingLeft - 10} y={svgHeight - paddingBottom + 4} textAnchor="end" style={{ fontSize: '0.65rem', fill: 'var(--text-muted)', fontWeight: 700 }}>Rp0</text>
                
                {/* Bars */}
                {lastTx.map((t: any, idx: number) => {
                  const val = parseFloat(t.amount);
                  const barHeight = (val / maxVal) * chartHeight;
                  const x = paddingLeft + idx * (barWidth + spacing) + spacing / 2;
                  const y = svgHeight - paddingBottom - barHeight;
                  const isHovered = hoveredBar?.id === t.id;
                  const opacity = hoveredBar === null ? 1 : (isHovered ? 1 : 0.55);
                  const color = t.type === 'income' ? '#10b981' : '#ef4444';
                  const formattedDate = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  
                  return (
                    <g key={t.id}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={color}
                        rx="4"
                        onMouseMove={(e) => {
                          const container = e.currentTarget.closest('.chart-container');
                          if (container) {
                            const rect = container.getBoundingClientRect();
                            setHoveredBar({
                              id: t.id,
                              description: t.description,
                              type: t.type,
                              amount: val,
                              date: t.date,
                              x: e.clientX - rect.left + 15,
                              y: e.clientY - rect.top - 15
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          opacity
                        }}
                      />
                      <text
                        x={x + barWidth / 2}
                        y={svgHeight - paddingBottom + 16}
                        textAnchor="middle"
                        style={{ fontSize: '0.65rem', fill: 'var(--text-muted)', fontWeight: 700 }}
                      >
                        {formattedDate}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Bar Tooltip */}
              {hoveredBar && (
                <div
                  style={{
                    position: 'absolute',
                    top: hoveredBar.y,
                    left: hoveredBar.x,
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'top 0.08s ease, left 0.08s ease',
                    minWidth: '160px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '0.8rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    {hoveredBar.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '2px' }}>
                    <span style={{ color: hoveredBar.type === 'income' ? '#34d399' : '#f87171', fontWeight: 700 }}>
                      {hoveredBar.type === 'income' ? 'Masuk' : 'Keluar'}
                    </span>
                    <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                      {formatRupiah(hoveredBar.amount)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                    Tanggal: {new Date(hoveredBar.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', fontSize: '0.8rem', fontWeight: 700 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Pemasukan</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Pengeluaran</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Ranan: Donut Chart Perbandingan Kas */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>📊 Perbandingan Arus Kas (Pemasukan vs Pengeluaran)</span>
          {(() => {
            if (totalFlow === 0) {
              return (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Belum ada data aliran kas masuk/keluar.
                </div>
              );
            }

            const r = 75;
            const circ = 2 * Math.PI * r;
            
            const donutSegments = [
              { label: 'Pemasukan', amount: totalIncome, pct: (totalIncome / totalFlow) * 100, color: '#10b981', rotation: -90 },
              { label: 'Pengeluaran', amount: totalExpense, pct: (totalExpense / totalFlow) * 100, color: '#ef4444', rotation: -90 + (totalIncome / totalFlow) * 360 }
            ].filter(s => s.amount > 0);

            const handleDonutMouseMove = (e: React.MouseEvent, label: string, amount: number, pct: number, color: string) => {
              setHoveredLabel(label);
              const container = e.currentTarget.closest('.chart-container');
              if (container) {
                const rect = container.getBoundingClientRect();
                setHoveredDonut({
                  label,
                  amount,
                  pct,
                  color,
                  x: e.clientX - rect.left + 15,
                  y: e.clientY - rect.top - 15
                });
              }
            };

            const handleDonutMouseLeave = () => {
              setHoveredLabel(null);
              setHoveredDonut(null);
            };

            return (
              <div className="chart-container" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%', height: '100%', justifyContent: 'space-between' }}>
                <div style={{ position: 'relative', width: '200px', height: '200px', marginTop: '10px' }}>
                  <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {donutSegments.map((slice, idx) => {
                      const isHovered = hoveredLabel === slice.label;
                      const opacity = hoveredLabel === null ? 1 : (isHovered ? 1 : 0.55);
                      const strokeWidth = isHovered ? 24 : 20;
                      const gap = slice.pct === 100 ? 0 : 3;
                      const dashLength = Math.max(0, (slice.pct / 100) * circ - gap);

                      return (
                        <circle
                          key={idx}
                          cx="100"
                          cy="100"
                          r={r}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${dashLength} ${circ}`}
                          transform={`rotate(${slice.rotation} 100 100)`}
                          onMouseMove={(e) => handleDonutMouseMove(e, slice.label, slice.amount, slice.pct, slice.color)}
                          onMouseLeave={handleDonutMouseLeave}
                          style={{
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            opacity
                          }}
                        />
                      );
                    })}
                  </svg>
                  {/* Center Text inside Donut */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selisih Kas</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: finances.summary?.balance >= 0 ? '#10b981' : '#ef4444' }}>
                      {formatRupiah(finances.summary?.balance || 0)}
                    </span>
                  </div>
                </div>

                {/* Floating Donut Tooltip */}
                {hoveredDonut && (
                  <div
                    style={{
                      position: 'absolute',
                      top: hoveredDonut.y,
                      left: hoveredDonut.x,
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
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hoveredDonut.color, display: 'inline-block' }} />
                    <span>
                      {hoveredDonut.label}: <span style={{ color: '#38bdf8' }}>{formatRupiah(hoveredDonut.amount)} ({Math.round(hoveredDonut.pct)}%)</span>
                    </span>
                  </div>
                )}

                {/* Donut Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#10b981', borderRadius: '3px' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Pemasukan ({totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 0}%)</span>
                    </div>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{formatRupiah(totalIncome)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ef4444', borderRadius: '3px' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Pengeluaran ({totalFlow > 0 ? Math.round((totalExpense / totalFlow) * 100) : 0}%)</span>
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatRupiah(totalExpense)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Transactions Table Panel */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="panel-header">
          <span className="panel-title">Buku Kas Umum</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total: {finances.transactions.length} transaksi
          </span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {finances.transactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada pencatatan transaksi kas.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Tipe</th>
                    <th>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {finances.transactions.map((t: any) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{new Date(t.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td>{t.description}</td>
                      <td>
                        <span className={`badge ${t.type === 'income' ? 'resolved' : 'rejected'}`}>
                          {t.type === 'income' ? 'Masuk' : 'Keluar'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: t.type === 'income' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {t.type === 'income' ? '+' : '-'} {formatRupiah(parseFloat(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Write Transaction Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>Catat Transaksi Kas Baru</span>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Jenis Transaksi</label>
                <select
                  className="input-field"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}
                >
                  <option value="income">Kas Masuk (Pemasukan)</option>
                  <option value="expense">Kas Keluar (Pengeluaran)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Nominal (Rupiah)</label>
                <input
                  className="input-field"
                  type="number"
                  name="amount"
                  placeholder="Contoh: 100000"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Keterangan Transaksi</label>
                <input
                  className="input-field"
                  type="text"
                  name="description"
                  placeholder="Contoh: Pembayaran alat sapu"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Tanggal Transaksi</label>
                <input
                  className="input-field"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
