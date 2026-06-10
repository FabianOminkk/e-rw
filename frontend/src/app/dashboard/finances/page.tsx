'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function FinancesPage() {
  const { user } = useAuth();
  const [finances, setFinances] = useState<any>({ summary: { total_income: 0, total_expense: 0, balance: 0 }, transactions: [] });
  const [loading, setLoading] = useState(true);

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
  const svgHeight = 200;
  const padding = 50;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;
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

      {/* Visualisasi Diagram Kas (Pemasukan vs Pengeluaran) */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>📊 Diagram Perbandingan Kas (Pemasukan vs Pengeluaran)</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--accent-emerald)' }}>Pemasukan: {incomePercentage}%</span>
            <span style={{ color: 'var(--accent-rose)' }}>Pengeluaran: {expensePercentage}%</span>
          </div>
          <div style={{ height: '20px', display: 'flex', borderRadius: '6px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
            {incomePercentage > 0 && (
              <div 
                style={{ width: `${incomePercentage}%`, background: '#10b981' }} 
                title={`Pemasukan: ${formatRupiah(totalIncome)}`} 
              />
            )}
            {expensePercentage > 0 && (
              <div 
                style={{ width: `${expensePercentage}%`, background: '#ef4444' }} 
                title={`Pengeluaran: ${formatRupiah(totalExpense)}`} 
              />
            )}
            {totalFlow === 0 && (
              <div style={{ width: '100%', background: '#cbd5e1', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', lineHeight: '20px' }}>
                Belum ada data arus kas
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>{formatRupiah(totalIncome)}</span>
            <span>{formatRupiah(totalExpense)}</span>
          </div>
        </div>
      </div>

      {/* Grafik Tren Arus Kas Terakhir (Pemasukan vs Pengeluaran) */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>📈 Grafik Arus Kas Masuk & Keluar Terakhir (Real-time)</span>
        {lastTx.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada transaksi kas untuk digambar grafik.
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', minWidth: '500px', height: 'auto', display: 'block' }}>
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={padding} y1={padding + chartHeight / 2} x2={svgWidth - padding} y2={padding + chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#cbd5e1" strokeWidth="1.5" />
              
              {/* Y-Axis Labels */}
              <text x={padding - 8} y={padding + 4} textAnchor="end" style={{ fontSize: '0.65rem', fill: 'var(--text-muted)', fontWeight: 700 }}>{formatRupiah(maxVal)}</text>
              <text x={padding - 8} y={padding + chartHeight / 2 + 4} textAnchor="end" style={{ fontSize: '0.65rem', fill: 'var(--text-muted)', fontWeight: 700 }}>{formatRupiah(maxVal / 2)}</text>
              <text x={padding - 8} y={svgHeight - padding + 4} textAnchor="end" style={{ fontSize: '0.65rem', fill: 'var(--text-muted)', fontWeight: 700 }}>Rp0</text>

              {/* Bars */}
              {lastTx.map((t: any, idx: number) => {
                const val = parseFloat(t.amount);
                const barHeight = (val / maxVal) * chartHeight;
                const x = padding + idx * (barWidth + spacing) + spacing / 2;
                const y = svgHeight - padding - barHeight;
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
                      rx="3"
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{`${t.description}\n${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}: ${formatRupiah(val)}\nTanggal: ${formattedDate}`}</title>
                    </rect>
                    <text
                      x={x + barWidth / 2}
                      y={svgHeight - padding + 15}
                      textAnchor="middle"
                      style={{ fontSize: '0.6rem', fill: 'var(--text-muted)', fontWeight: 700 }}
                    >
                      {formattedDate}
                    </text>
                  </g>
                );
              })}
            </svg>
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
