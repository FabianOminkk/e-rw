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
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(50000);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
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

  const getAvailablePeriods = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth();

    const getMonthStr = (offset: number) => {
      const d = new Date(currentYear, currentMonthNum + offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };

    const currentMonth = getMonthStr(0);
    const nextMonth = getMonthStr(1);
    const nextNextMonth = getMonthStr(2);
    const prevMonth = getMonthStr(-1);
    const prevPrevMonth = getMonthStr(-2);

    const pastUnpaidBills = bills.filter(b => b.status === 'unpaid' && b.month < currentMonth);
    const hasArrears = pastUnpaidBills.length > 0;

    const options: { value: string; label: string }[] = [];

    if (hasArrears) {
      pastUnpaidBills.forEach(b => {
        let labelSuffix = '';
        if (b.month === prevMonth) {
          labelSuffix = ' (Tunggakan Bulan Kemarin)';
        } else if (b.month === prevPrevMonth) {
          labelSuffix = ' (Tunggakan 2 Bulan Lalu)';
        } else {
          labelSuffix = ' (Tunggakan)';
        }
        options.push({
          value: b.month,
          label: `${formatMonthName(b.month)}${labelSuffix}`
        });
      });
    }

    const isPaid = (monthVal: string) => {
      return bills.some(b => b.month === monthVal && b.status === 'paid');
    };

    if (!isPaid(currentMonth)) {
      options.push({
        value: currentMonth,
        label: `${formatMonthName(currentMonth)} (Bulan Ini)`
      });
    }

    if (!isPaid(nextMonth)) {
      options.push({
        value: nextMonth,
        label: `${formatMonthName(nextMonth)} (Bulan Depan)`
      });
    }

    if (!isPaid(nextNextMonth)) {
      options.push({
        value: nextNextMonth,
        label: `${formatMonthName(nextNextMonth)} (Bulan Depannya Lagi)`
      });
    }

    return options;
  };

  const openPaymentModal = (bill: any | null) => {
    const periods = getAvailablePeriods();
    if (periods.length === 0) {
      alert("Semua tagihan Anda telah lunas!");
      return;
    }

    if (bill) {
      setSelectedBill(bill);
      setSelectedMonth(bill.month);
      setCustomAmount(parseFloat(bill.amount));
    } else {
      setSelectedBill(null);
      setSelectedMonth(periods[0].value);
      setCustomAmount(50000);
    }
    setPaymentMethod('qris');
    setSelectedBank('bca');
    setIsModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedMonth) return;
    setSubmitting(true);

    try {
      await apiFetch(`/bills/pay-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          amount: customAmount,
        }),
      });
      
      setWalletBalance((prev) => Math.max(0, prev - customAmount));
      alert(`Pembayaran iuran periode ${formatMonthName(selectedMonth)} sebesar ${formatRupiah(customAmount)} berhasil dikonfirmasi!`);
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
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span className="panel-title">Daftar Tagihan Iuran Bulanan</span>
          <button
            onClick={() => openPaymentModal(null)}
            style={{
              padding: '6px 14px',
              background: '#10b981',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            + Bayar Iuran Baru / Kustom
          </button>
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
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Lunas 🟢</span>
                            <button
                              onClick={() => {
                                setSelectedInvoice(bill);
                                setIsInvoiceOpen(true);
                              }}
                              style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3b82f6', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Lihat Invoice 📄
                            </button>
                          </div>
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
      {isModalOpen && selectedMonth && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0, padding: '16px 24px' }}>
              <span className="panel-title" style={{ color: '#0f172a', fontWeight: 'bold' }}>Lakukan Pembayaran Iuran</span>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.8rem', 
                  cursor: 'pointer', 
                  opacity: 0.7, 
                  color: '#475569',
                  lineHeight: 1,
                  padding: '4px 8px',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Tutup"
              >
                ×
              </button>
            </div>
            
            {/* Scrollable body content */}
            <div style={{ padding: '24px 24px 12px 24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Selectors for custom input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Pilih Periode Iuran</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMonth(val);
                    const existingBill = bills.find(b => b.month === val);
                    if (existingBill) {
                      setCustomAmount(parseFloat(existingBill.amount));
                    } else {
                      setCustomAmount(50000);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 600
                  }}
                >
                  {getAvailablePeriods().map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  min="1000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 'bold'
                  }}
                />
              </div>

              {/* Bill brief */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PERIODE TERPILIH</span>
                  <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{formatMonthName(selectedMonth)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>NOMINAL</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-rose)', fontSize: '1.1rem' }}>{formatRupiah(customAmount)}</span>
                </div>
              </div>

              {/* Method Switcher */}
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Pilih Metode Pembayaran</label>
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
                    <label className="input-label" style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Pilih Bank</label>
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
            </div>

            {/* Fixed Footer Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
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
                  <strong style={{ color: '#0f172a', fontSize: '0.95rem', display: 'block', marginTop: '2px' }}>{selectedInvoice.user?.name || user?.name}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>RT {selectedInvoice.user?.no_rt || user?.no_rt} / RW {selectedInvoice.user?.no_rw || user?.no_rw}</span>
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
                  <strong style={{ borderBottom: '1px solid #94a3b8', width: '120px', textAlign: 'center' }}>{selectedInvoice.user?.name || user?.name}</strong>
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
