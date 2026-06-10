'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function WalletPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Virtual balance
  const [walletBalance, setWalletBalance] = useState(250000);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bank'>('qris');
  const [selectedBank, setSelectedBank] = useState<'bca' | 'mandiri' | 'bni'>('bca');
  const [isCopied, setIsCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    if (user) {
      fetchBills();
    }
  }, [user]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const getVirtualAccount = () => {
    const phone = user?.phone || '089900112233';
    switch (selectedBank) {
      case 'bca':
        return `80012${phone}`;
      case 'mandiri':
        return `89012${phone}`;
      case 'bni':
        return `88012${phone}`;
      default:
        return `80012${phone}`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getVirtualAccount());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const openPaymentModal = (bill: any) => {
    setSelectedBill(bill);
    setPaymentMethod('qris');
    setSelectedBank('bca');
    setIsModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBill) return;
    setSubmitting(true);

    try {
      await apiFetch(`/bills/${selectedBill.id}/pay`, {
        method: 'PUT',
      });
      
      // Update local virtual balance if they used it, or just show success
      setWalletBalance((prev) => Math.max(0, prev - parseFloat(selectedBill.amount)));
      alert(`Pembayaran iuran bulan ${selectedBill.month} sebesar ${formatRupiah(parseFloat(selectedBill.amount))} berhasil dikonfirmasi!`);
      setIsModalOpen(false);
      setSelectedBill(null);
      fetchBills();
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan konfirmasi pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && bills.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const unpaidBills = bills.filter((b) => b.status === 'unpaid');
  const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + parseFloat(b.amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title */}
      <div className="page-title-section">
        <h1>Dompet Saya & Pembayaran Iuran</h1>
        <p className="page-subtitle">Kelola pembayaran iuran bulanan warga secara praktis dan realtime.</p>
      </div>

      {/* Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-panel cyan">
          <span className="stat-label">Saldo Virtual Dompet</span>
          <span className="stat-value">{formatRupiah(walletBalance)}</span>
        </div>
        <div className="stat-card glass-panel rose">
          <span className="stat-label">Total Tagihan Belum Lunas</span>
          <span className="stat-value">{formatRupiah(totalUnpaidAmount)}</span>
        </div>
        <div className="stat-card glass-panel emerald">
          <span className="stat-label">Jumlah Tagihan Pending</span>
          <span className="stat-value">{unpaidBills.length} tagihan</span>
        </div>
      </div>

      {/* Bills List Panel */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="panel-header">
          <span className="panel-title">Daftar Tagihan Iuran Bulanan</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {bills.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada data tagihan iuran untuk akun Anda.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Bulan / Periode</th>
                    <th>Jumlah Tagihan</th>
                    <th>Status</th>
                    <th>Tanggal Bayar</th>
                    <th style={{ textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id}>
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
                      <td style={{ textAlign: 'center' }}>
                        {bill.status === 'unpaid' ? (
                          <button
                            onClick={() => openPaymentModal(bill)}
                            style={{ padding: '6px 12px', background: '#0284c7', border: '1px solid #0284c7', color: '#ffffff', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Bayar Sekarang
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Lunas 🟢</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {isModalOpen && selectedBill && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>Lakukan Pembayaran Iuran</span>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Bill brief */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PERIODE</span>
                  <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{new Date(selectedBill.month + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>NOMINAL</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-rose)', fontSize: '1.1rem' }}>{formatRupiah(parseFloat(selectedBill.amount))}</span>
                </div>
              </div>

              {/* Method Switcher */}
              <div className="input-group">
                <label className="input-label">Pilih Metode Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <button
                    onClick={() => setPaymentMethod('qris')}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: paymentMethod === 'qris' ? '#e0f2fe' : '#ffffff',
                      color: paymentMethod === 'qris' ? '#0369a1' : '#475569',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    📱 Scan QRIS
                  </button>
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: paymentMethod === 'bank' ? '#e0f2fe' : '#ffffff',
                      color: paymentMethod === 'bank' ? '#0369a1' : '#475569',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    🏦 Transfer Bank (VA)
                  </button>
                </div>
              </div>

              {/* QRIS View */}
              {paymentMethod === 'qris' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
                  <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', padding: '10px', background: '#ffffff', width: '220px', height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <img 
                      src="/qris.png" 
                      alt="QRIS Code" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
                    Scan QR Code di atas menggunakan aplikasi perbankan (BCA, Mandiri, BNI) atau dompet digital Anda (GoPay, OVO, Dana).
                  </span>
                </div>
              )}

              {/* Bank Transfer View */}
              {paymentMethod === 'bank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label">Pilih Bank</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      {(['bca', 'mandiri', 'bni'] as const).map((bank) => (
                        <button
                          key={bank}
                          onClick={() => {
                            setSelectedBank(bank);
                            setIsCopied(false);
                          }}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: selectedBank === bank ? '#f1f5f9' : '#ffffff',
                            color: '#0f172a',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            cursor: 'pointer'
                          }}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VA details card */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>NOMOR VIRTUAL ACCOUNT (VA)</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.05em' }}>
                        {getVirtualAccount()}
                      </span>
                      <button
                        onClick={handleCopy}
                        style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}
                      >
                        {isCopied ? 'Tersalin! ✔' : 'Salin'}
                      </button>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Panduan: Masuk ke m-banking Anda, pilih menu transfer Virtual Account, masukkan nomor di atas, dan pastikan jumlah tagihan yang muncul sesuai.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="btn-primary"
                  disabled={submitting}
                  style={{ background: '#10b981' }}
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi Sudah Bayar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
