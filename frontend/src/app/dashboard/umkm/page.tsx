'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function UmkmPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'katalog' | 'lapak_saya' | 'persetujuan'>('katalog');
  
  // Data states
  const [listings, setListings] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [form, setForm] = useState({
    name: '',
    price: '',
    phone_number: '',
    description: ''
  });
  
  const [submitting, setSubmitting] = useState(false);

  const fetchUmkmData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch approved listings (visible to everyone)
      const approvedData = await apiFetch('/umkm');
      setListings(approvedData);

      // 2. Fetch my listings (warga)
      if (user?.role === 'warga') {
        const myData = await apiFetch('/umkm/my-listings');
        setMyListings(myData);
      }

      // 3. Fetch pending listings (admin & super_admin)
      if (['super_admin', 'admin'].includes(user?.role || '')) {
        const pendingData = await apiFetch('/umkm/pending');
        setPendingListings(pendingData);
      }
    } catch (err) {
      console.error('Gagal memuat data UMKM:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUmkmData();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch('/umkm', {
        method: 'POST',
        data: {
          name: form.name,
          price: parseFloat(form.price),
          phone_number: form.phone_number,
          description: form.description
        }
      });
      alert('Lapak UMKM berhasil diajukan! Menunggu persetujuan Pengurus/RT.');
      setForm({ name: '', price: '', phone_number: '', description: '' });
      fetchUmkmData();
      setActiveTab('lapak_saya'); // Switch to their listings
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan lapak.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus lapak ini?')) {
      try {
        await apiFetch(`/umkm/${id}`, { method: 'DELETE' });
        alert('Lapak berhasil dihapus.');
        fetchUmkmData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus lapak.');
      }
    }
  };

  const handleApproval = async (id: number, status: 'approved' | 'rejected') => {
    const actionText = status === 'approved' ? 'menyetujui' : 'menolak';
    if (confirm(`Apakah Anda yakin ingin ${actionText} pengajuan UMKM ini?`)) {
      try {
        await apiFetch(`/umkm/${id}/status`, {
          method: 'PUT',
          data: { status }
        });
        alert('Status persetujuan lapak diperbarui.');
        fetchUmkmData();
      } catch (err: any) {
        alert(err.message || 'Gagal memperbarui status persetujuan.');
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

  const getWaLink = (phone: string, productName: string) => {
    const text = encodeURIComponent(`Halo, saya tertarik dengan produk/jasa UMKM Anda di e-RW: "${productName}". Apakah masih tersedia?`);
    return `https://wa.me/${phone}?text=${text}`;
  };

  if (loading && listings.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isWarga = user?.role === 'warga';
  const isAdminOrSuper = ['super_admin', 'admin'].includes(user?.role || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title */}
      <div className="page-title-section">
        <h1>Katalog UMKM Warga</h1>
        <p className="page-subtitle">Dukung ekonomi tetangga dengan berbelanja produk dan jasa buatan warga di lingkungan RW.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('katalog')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            color: activeTab === 'katalog' ? '#0284c7' : 'var(--text-secondary)',
            borderBottom: activeTab === 'katalog' ? '2px solid #0284c7' : 'none',
            cursor: 'pointer'
          }}
        >
          🏪 Katalog Produk Warga
        </button>

        {isWarga && (
          <button
            onClick={() => setActiveTab('lapak_saya')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              color: activeTab === 'lapak_saya' ? '#0284c7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'lapak_saya' ? '2px solid #0284c7' : 'none',
              cursor: 'pointer'
            }}
          >
            🍳 Toko / Lapak Saya
          </button>
        )}

        {isAdminOrSuper && (
          <button
            onClick={() => setActiveTab('persetujuan')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              color: activeTab === 'persetujuan' ? '#0284c7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'persetujuan' ? '2px solid #0284c7' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⚖️ Persetujuan Lapak
            {pendingListings.length > 0 && (
              <span style={{ fontSize: '0.75rem', background: '#ef4444', color: '#ffffff', padding: '2px 6px', borderRadius: '10px' }}>
                {pendingListings.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab Contents */}
      
      {/* 1. Katalog */}
      {activeTab === 'katalog' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              Belum ada produk/jasa UMKM yang terdaftar di katalog saat ini.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {listings.map((item) => (
                <div key={item.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 'bold' }}>{item.name}</h3>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Oleh: <strong>{item.user?.name}</strong> (RT {item.user?.no_rt})
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1, lineHeight: '1.4' }}>
                    {item.description}
                  </p>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '4px' }}>
                    {formatRupiah(parseFloat(item.price))}
                  </div>

                  <a
                    href={getWaLink(item.phone_number, item.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '10px',
                      background: '#10b981',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      marginTop: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    💬 Hubungi Penjual (WA)
                  </a>
                  {isAdminOrSuper && (
                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      style={{ padding: '6px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}
                    >
                      Hapus Lapak 🗑
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Lapak Saya (Warga Only) */}
      {activeTab === 'lapak_saya' && isWarga && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'flex-start' }}>
          {/* Form Tambah */}
          <div className="glass-panel">
            <div className="panel-header">
              <span className="panel-title">Daftarkan Lapak UMKM Baru</span>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Nama Produk / Jasa</label>
                <input
                  className="input-field"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Misal: Nasi Tumpeng Ibu Ani / Jasa Setrika"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Harga (Rupiah)</label>
                <input
                  className="input-field"
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  placeholder="Misal: 15000"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Nomor WhatsApp Penjual</label>
                <input
                  className="input-field"
                  type="text"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleInputChange}
                  placeholder="Misal: 081234567890"
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gunakan format angka awal 08 atau 62 (contoh: 0812xxxx)</span>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Deskripsi Lapak</label>
                <textarea
                  className="input-field"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Rincian produk, menu kuliner, jam operasional, atau lingkup layanan jasa..."
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ marginTop: '10px' }}
              >
                {submitting ? 'Mengajukan...' : 'Daftarkan Lapak 🍳'}
              </button>
            </form>
          </div>

          {/* List Lapak Saya */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div className="panel-header">
              <span className="panel-title">Lapak Punya Saya</span>
            </div>
            <div className="panel-body" style={{ padding: 0 }}>
              {myListings.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Anda belum pernah mendaftarkan lapak UMKM.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Nama Usaha</th>
                        <th>Harga</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myListings.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 'bold' }}>
                            <div>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>{item.description.slice(0, 50)}...</div>
                          </td>
                          <td>{formatRupiah(parseFloat(item.price))}</td>
                          <td>
                            <span className={`badge ${item.status}`}>
                              {item.status === 'pending' && 'Menunggu'}
                              {item.status === 'approved' && 'Aktif'}
                              {item.status === 'rejected' && 'Ditolak'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteListing(item.id)}
                              style={{ padding: '6px 12px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Persetujuan Lapak (Admin & Super Admin Only) */}
      {activeTab === 'persetujuan' && isAdminOrSuper && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="panel-header">
            <span className="panel-title">Daftar Pengajuan Lapak UMKM Warga</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {pendingListings.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Tidak ada pengajuan lapak UMKM yang tertunda saat ini.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Nama Warga</th>
                      <th>Detail RT/RW</th>
                      <th>Nama Usaha</th>
                      <th>Harga</th>
                      <th>Deskripsi Usaha</th>
                      <th style={{ textAlign: 'center' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingListings.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 'bold' }}>{item.user?.name}</td>
                        <td>RT {item.user?.no_rt} / RW {item.user?.no_rw}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td style={{ fontWeight: 'bold' }}>{formatRupiah(parseFloat(item.price))}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {item.description}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApproval(item.id, 'approved')}
                              style={{ padding: '6px 12px', background: '#10b981', border: 'none', color: '#ffffff', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Setujui ✔
                            </button>
                            <button
                              onClick={() => handleApproval(item.id, 'rejected')}
                              style={{ padding: '6px 12px', background: '#ef4444', border: 'none', color: '#ffffff', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Tolak ✖
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
