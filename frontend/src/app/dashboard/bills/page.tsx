'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function BillsPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    user_id: '', // empty means all citizens
    month: new Date().toISOString().slice(0, 7), // format: YYYY-MM
    amount: '50000', // default iuran amount
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/bills');
      setBills(data);
    } catch (err) {
      console.error('Gagal memuat tagihan:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitizens = async () => {
    try {
      const data = await apiFetch('/citizens');
      setCitizens(data);
    } catch (err) {
      console.error('Gagal memuat warga:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBills();
      if (user.role === 'bendahara') {
        fetchCitizens();
      }
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
      await apiFetch('/bills', {
        method: 'POST',
        data: {
          user_id: formData.user_id ? parseInt(formData.user_id) : null,
          month: formData.month,
          amount: parseFloat(formData.amount),
        },
      });
      setIsModalOpen(false);
      setFormData({
        user_id: '',
        month: new Date().toISOString().slice(0, 7),
        amount: '50000',
      });
      fetchBills();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat tagihan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayBill = async (billId: number) => {
    if (confirm('Konfirmasi pembayaran iuran ini telah diterima secara tunai?')) {
      try {
        await apiFetch(`/bills/${billId}/pay`, {
          method: 'PUT',
        });
        fetchBills();
      } catch (err: any) {
        alert(err.message || 'Gagal memperbarui status pembayaran.');
      }
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const formatMonthName = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    return `${months[monthIdx]} ${year}`;
  };

  const filteredBills = bills.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  if (loading && bills.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isBendahara = user?.role === 'bendahara';
  const isWarga = user?.role === 'warga';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title & Top Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-section">
          <h1>Tagihan Iuran Bulanan</h1>
          <p className="page-subtitle">
            {isWarga 
              ? 'Daftar riwayat tagihan iuran bulanan warga Anda (keamanan & kebersihan).'
              : 'Manajemen iuran bulanan warga untuk kebersihan, keamanan, dan kas sosial.'}
          </p>
        </div>
        {isBendahara && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            💳 Buat Tagihan Bulanan Baru
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter Status:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="input-field" 
            style={{ width: '150px', padding: '8px 12px', background: '#ffffff', border: '1px solid #cbd5e1' }}
          >
            <option value="all">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="unpaid">Belum Lunas</option>
          </select>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
          Menampilkan {filteredBills.length} Tagihan
        </span>
      </div>

      {/* Bills Table Panel */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="panel-header">
          <span className="panel-title">{isWarga ? 'Tagihan Iuran Anda' : 'Buku Pembayaran Iuran Warga'}</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {filteredBills.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada data tagihan ditemukan.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    {!isWarga && <th>Nama Warga</th>}
                    {!isWarga && <th>RT / RW</th>}
                     <th>Bulan / Periode</th>
                    <th>Jumlah Tagihan</th>
                    <th>Status</th>
                     <th>Tanggal Bayar</th>
                     {(isBendahara || user?.role === 'super_admin' || user?.role === 'admin') && <th style={{ textAlign: 'center' }}>Aksi</th>}
                   </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => (
                    <tr key={bill.id}>
                      {!isWarga && <td style={{ fontWeight: 'bold' }}>{bill.user?.name}</td>}
                      {!isWarga && <td>RT {bill.user?.no_rt} / RW {bill.user?.no_rw}</td>}
                      <td style={{ fontWeight: 600 }}>
                        {new Date(bill.month + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{formatRupiah(parseFloat(bill.amount))}</td>
                      <td>
                        <span className={`badge ${bill.status}`}>
                          {bill.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td>
                        {bill.payment_date 
                          ? new Date(bill.payment_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                          : '-'
                        }
                      </td>
                      {(isBendahara || user?.role === 'super_admin' || user?.role === 'admin') && (
                        <td style={{ textAlign: 'center' }}>
                          {bill.status === 'unpaid' ? (
                            isBendahara ? (
                              <button
                                onClick={() => handlePayBill(bill.id)}
                                style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--accent-emerald)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                Konfirmasi Bayar
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum Lunas</span>
                            )
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedInvoice(bill);
                                setIsInvoiceOpen(true);
                              }}
                              style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3b82f6', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Lihat Invoice 📄
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Generate Bills Modal (Bendahara Only) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>Buat Tagihan Iuran Bulanan</span>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Target Penerima Tagihan</label>
                <select
                  className="input-field"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Semua Warga (Massal)</option>
                  {citizens.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Periode Bulan</label>
                <input
                  className="input-field"
                  type="month"
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nominal Iuran (Rupiah)</label>
                <input
                  className="input-field"
                  type="number"
                  name="amount"
                  placeholder="50000"
                  value={formData.amount}
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
                  {submitting ? 'Memproses...' : 'Buat Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {isInvoiceOpen && selectedInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Header */}
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
              <span className="panel-title" style={{ color: '#0f172a', fontWeight: 'bold' }}>Bukti Pembayaran Iuran</span>
              <button 
                onClick={() => {
                  setIsInvoiceOpen(false);
                  setSelectedInvoice(null);
                }} 
                style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', opacity: 0.7, color: '#475569', outline: 'none', padding: 0 }}
              >
                ×
              </button>
            </div>

            {/* Invoice Printable Content */}
            <div id="invoice-print-area" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Header Invoice: Logo & Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e2e8f0', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>e-RW</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sistem Pengelolaan Administrasi RW</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>LUNAS</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>INV/RW/{selectedInvoice.month.replace('-', '')}/{selectedInvoice.id.toString().padStart(4, '0')}</div>
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>DIBAYAR OLEH</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.95rem', display: 'block', marginTop: '2px' }}>{selectedInvoice.user?.name}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>RT {selectedInvoice.user?.no_rt} / RW {selectedInvoice.user?.no_rw}</span>
                </div>
                <div>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>DITERIMA OLEH</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.95rem', display: 'block', marginTop: '2px' }}>Bendahara RW</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Atas Nama Pengurus RW</span>
                </div>
                <div>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>TANGGAL BAYAR</span>
                  <span style={{ color: '#0f172a', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                    {selectedInvoice.payment_date 
                      ? new Date(selectedInvoice.payment_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-'
                    }
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Metode: Digital/Cash</span>
                </div>
              </div>

              {/* Table brief */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  <span>DESKRIPSI</span>
                  <span style={{ textAlign: 'right' }}>JUMLAH</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', padding: '14px 16px', fontSize: '0.85rem', color: '#0f172a' }}>
                  <span>Iuran Kebersihan & Keamanan Bulanan - Periode {formatMonthName(selectedInvoice.month)}</span>
                  <strong style={{ textAlign: 'right' }}>{formatRupiah(parseFloat(selectedInvoice.amount))}</strong>
                </div>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Pembayaran</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{formatRupiah(parseFloat(selectedInvoice.amount))}</span>
                </div>
              </div>

              {/* Tanda Tangan / Signature Area */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Pembayar,</span>
                  <div style={{ height: '40px' }} />
                  <strong style={{ borderBottom: '1px solid #94a3b8', width: '120px', textAlign: 'center' }}>{selectedInvoice.user?.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Warga</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Penerima,</span>
                  <div style={{ height: '40px' }} />
                  <strong style={{ borderBottom: '1px solid #94a3b8', width: '140px', textAlign: 'center' }}>Bendahara RW</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Atas Nama Pengurus RW</span>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button
                onClick={() => {
                  setIsInvoiceOpen(false);
                  setSelectedInvoice(null);
                }}
                style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const printContent = document.getElementById('invoice-print-area')?.innerHTML;
                  const originalContent = document.body.innerHTML;
                  if (printContent) {
                    document.body.innerHTML = printContent;
                    window.print();
                    document.body.innerHTML = originalContent;
                    window.location.reload(); // reload to restore React state bindings
                  }
                }}
                className="btn-primary"
                style={{ background: '#3b82f6', border: '1px solid #3b82f6' }}
              >
                🖨 Cetak Bukti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
