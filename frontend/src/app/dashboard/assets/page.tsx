'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Selected items for edit / action
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  // Forms
  const [assetForm, setAssetForm] = useState({
    name: '',
    quantity: '1',
    description: ''
  });

  const [bookingForm, setBookingForm] = useState({
    quantity: '1',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    purpose: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchAssetsAndBookings = async () => {
    try {
      setLoading(true);
      const assetsData = await apiFetch('/assets');
      setAssets(assetsData);
      
      const bookingsData = await apiFetch('/assets/bookings');
      setBookings(bookingsData);
    } catch (err) {
      console.error('Gagal memuat data aset/booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAssetsAndBookings();
    }
  }, [user]);

  const handleAssetInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAssetForm({ ...assetForm, [e.target.name]: e.target.value });
  };

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedAsset) {
        // Edit
        await apiFetch(`/assets/${selectedAsset.id}`, {
          method: 'PUT',
          data: {
            name: assetForm.name,
            quantity: parseInt(assetForm.quantity),
            description: assetForm.description
          }
        });
        alert('Aset berhasil diperbarui!');
      } else {
        // Add new
        await apiFetch('/assets', {
          method: 'POST',
          data: {
            name: assetForm.name,
            quantity: parseInt(assetForm.quantity),
            description: assetForm.description
          }
        });
        alert('Aset baru berhasil ditambahkan!');
      }
      setIsAssetModalOpen(false);
      setSelectedAsset(null);
      setAssetForm({ name: '', quantity: '1', description: '' });
      fetchAssetsAndBookings();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data aset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setSubmitting(true);
    try {
      await apiFetch('/assets/bookings', {
        method: 'POST',
        data: {
          asset_id: selectedAsset.id,
          quantity: parseInt(bookingForm.quantity),
          start_date: bookingForm.start_date,
          end_date: bookingForm.end_date,
          purpose: bookingForm.purpose
        }
      });
      alert('Pengajuan peminjaman aset berhasil dikirim!');
      setIsBookingModalOpen(false);
      setSelectedAsset(null);
      setBookingForm({
        quantity: '1',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date().toISOString().slice(0, 10),
        purpose: ''
      });
      fetchAssetsAndBookings();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pengajuan peminjaman.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus aset ini? Semua data terkait peminjaman akan ikut terhapus.')) {
      try {
        await apiFetch(`/assets/${id}`, { method: 'DELETE' });
        alert('Aset berhasil dihapus.');
        fetchAssetsAndBookings();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus aset.');
      }
    }
  };

  const handleUpdateBookingStatus = async (id: number, status: 'approved' | 'rejected' | 'returned') => {
    const messages = {
      approved: 'Setujui peminjaman ini?',
      rejected: 'Tolak peminjaman ini?',
      returned: 'Konfirmasi bahwa barang pinjaman telah dikembalikan dalam kondisi baik?'
    };
    if (confirm(messages[status])) {
      try {
        await apiFetch(`/assets/bookings/${id}/status`, {
          method: 'PUT',
          data: { status }
        });
        alert('Status peminjaman berhasil diperbarui.');
        fetchAssetsAndBookings();
      } catch (err: any) {
        alert(err.message || 'Gagal memperbarui status.');
      }
    }
  };

  const openAddAssetModal = () => {
    setSelectedAsset(null);
    setAssetForm({ name: '', quantity: '1', description: '' });
    setIsAssetModalOpen(true);
  };

  const openEditAssetModal = (asset: any) => {
    setSelectedAsset(asset);
    setAssetForm({
      name: asset.name,
      quantity: String(asset.quantity),
      description: asset.description || ''
    });
    setIsAssetModalOpen(true);
  };

  const openNewBookingModal = (asset: any) => {
    setSelectedAsset(asset);
    setIsBookingModalOpen(true);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  if (loading && assets.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isWarga = user?.role === 'warga';
  const hasManageAccess = ['super_admin', 'admin', 'bendahara'].includes(user?.role || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-section">
          <h1>Inventaris & Peminjaman Aset RW</h1>
          <p className="page-subtitle">
            {isWarga 
              ? 'Pinjam barang fasilitas RW seperti tenda, kursi, meja, dan sound system secara online.'
              : 'Manajemen ketersediaan fasilitas inventaris RW dan persetujuan peminjaman warga.'}
          </p>
        </div>
        {hasManageAccess && (
          <button className="btn-primary" onClick={openAddAssetModal}>
            ➕ Tambah Aset Baru
          </button>
        )}
      </div>

      {/* Grid Katalog Aset */}
      <div className="glass-panel">
        <div className="panel-header">
          <span className="panel-title">Fasilitas & Aset Tersedia</span>
        </div>
        <div className="panel-body" style={{ padding: '24px' }}>
          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              Belum ada aset inventaris yang didaftarkan.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {assets.map((asset) => (
                <div key={asset.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 'bold' }}>{asset.name}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0369a1', background: '#e0f2fe', padding: '4px 8px', borderRadius: '4px' }}>
                      Stok: {asset.quantity} unit
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', flexGrow: 1 }}>
                    {asset.description || 'Tidak ada deskripsi.'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    {isWarga ? (
                      <button
                        onClick={() => openNewBookingModal(asset)}
                        style={{ width: '100%', padding: '8px 12px', background: '#0284c7', border: 'none', color: '#ffffff', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        Pinjam Barang 📝
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditAssetModal(asset)}
                          style={{ flex: 1, padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Edit ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          style={{ flex: 1, padding: '6px 12px', background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Hapus 🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daftar Peminjaman Aset */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="panel-header">
          <span className="panel-title">{isWarga ? 'Riwayat Peminjaman Saya' : 'Daftar Pengajuan Peminjaman Warga'}</span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {bookings.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada riwayat pengajuan peminjaman barang.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    {!isWarga && <th>Nama Peminjam</th>}
                    <th>Nama Barang</th>
                    <th>Jumlah</th>
                    <th>Tanggal Pinjam</th>
                    <th>Tanggal Kembali</th>
                    <th>Tujuan</th>
                    <th>Status</th>
                    {hasManageAccess && <th style={{ textAlign: 'center' }}>Aksi Persetujuan</th>}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      {!isWarga && (
                        <td>
                          <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{booking.user?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RT {booking.user?.no_rt} / RW {booking.user?.no_rw}</div>
                        </td>
                      )}
                      <td style={{ fontWeight: 600 }}>{booking.asset?.name}</td>
                      <td style={{ fontWeight: 'bold' }}>{booking.quantity} unit</td>
                      <td>{new Date(booking.start_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td>{new Date(booking.end_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{booking.purpose}</td>
                      <td>
                        <span className={`badge ${booking.status}`}>
                          {booking.status === 'pending' && 'Menunggu'}
                          {booking.status === 'approved' && 'Disetujui'}
                          {booking.status === 'rejected' && 'Ditolak'}
                          {booking.status === 'returned' && 'Dikembalikan'}
                        </span>
                      </td>
                      {hasManageAccess && (
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'approved')}
                                  style={{ padding: '4px 8px', background: '#10b981', border: 'none', color: '#ffffff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  Setujui ✔
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                                  style={{ padding: '4px 8px', background: '#ef4444', border: 'none', color: '#ffffff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                  Tolak ✖
                                </button>
                              </>
                            )}
                            {booking.status === 'approved' && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, 'returned')}
                                style={{ padding: '4px 8px', background: '#64748b', border: 'none', color: '#ffffff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                Dikembalikan ↩
                              </button>
                            )}
                            {['returned', 'rejected'].includes(booking.status) && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selesai</span>
                            )}
                          </div>
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

      {/* Asset CRUD Modal */}
      {isAssetModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
              <span className="panel-title" style={{ color: '#0f172a', fontWeight: 'bold' }}>
                {selectedAsset ? 'Edit Data Aset Inventaris' : 'Tambah Aset Inventaris Baru'}
              </span>
              <button onClick={() => setIsAssetModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleAssetSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Nama Aset</label>
                <input
                  className="input-field"
                  type="text"
                  name="name"
                  value={assetForm.name}
                  onChange={handleAssetInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Jumlah Ketersediaan (Unit)</label>
                <input
                  className="input-field"
                  type="number"
                  name="quantity"
                  min="0"
                  value={assetForm.quantity}
                  onChange={handleAssetInputChange}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Deskripsi / Kondisi Barang</label>
                <textarea
                  className="input-field"
                  name="description"
                  rows={3}
                  value={assetForm.description}
                  onChange={handleAssetInputChange}
                  placeholder="Kondisi baik, rusak ringan, dll."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {isBookingModalOpen && selectedAsset && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
              <span className="panel-title" style={{ color: '#0f172a', fontWeight: 'bold' }}>Pengajuan Pinjam: {selectedAsset.name}</span>
              <button onClick={() => setIsBookingModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleBookingSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Jumlah yang Dipinjam (Unit)</label>
                <input
                  className="input-field"
                  type="number"
                  name="quantity"
                  min="1"
                  max={selectedAsset.quantity}
                  value={bookingForm.quantity}
                  onChange={handleBookingInputChange}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maksimal: {selectedAsset.quantity} unit</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Mulai Tanggal</label>
                  <input
                    className="input-field"
                    type="date"
                    name="start_date"
                    value={bookingForm.start_date}
                    onChange={handleBookingInputChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Sampai Tanggal</label>
                  <input
                    className="input-field"
                    type="date"
                    name="end_date"
                    value={bookingForm.end_date}
                    onChange={handleBookingInputChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Tujuan Peminjaman</label>
                <textarea
                  className="input-field"
                  name="purpose"
                  rows={3}
                  value={bookingForm.purpose}
                  onChange={handleBookingInputChange}
                  placeholder="Misal: Keperluan hajatan warga RT 03"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Mengirim...' : 'Ajukan Pinjam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
