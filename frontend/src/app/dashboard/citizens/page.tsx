'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function CitizensPage() {
  const { user } = useAuth();
  const [citizens, setCitizens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'L',
    no_kk: '',
    no_rt: '',
    no_rw: '',
    phone: '',
    address: '',
    status_warga: 'aktif',
  });
  
  const [errors, setErrors] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/citizens');
      setCitizens(data);
    } catch (err) {
      console.error('Gagal memuat data warga:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (['super_admin', 'admin'].includes(user?.role || '')) {
      fetchCitizens();
    }
  }, [user]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      gender: 'L',
      no_kk: '',
      no_rt: user?.no_rt || '003',
      no_rw: user?.no_rw || '012',
      phone: '',
      address: '',
      status_warga: 'aktif',
    });
    setErrors(null);
    setIsModalOpen(true);
  };

  const openEditModal = (citizen: any) => {
    setModalMode('edit');
    setSelectedId(citizen.id);
    setFormData({
      name: citizen.name,
      email: citizen.email,
      password: '', // empty means do not change password
      gender: citizen.gender || 'L',
      no_kk: citizen.no_kk || '',
      no_rt: citizen.no_rt || '',
      no_rw: citizen.no_rw || '',
      phone: citizen.phone || '',
      address: citizen.address || '',
      status_warga: citizen.status_warga || 'aktif',
    });
    setErrors(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setSubmitting(true);

    try {
      if (modalMode === 'create') {
        await apiFetch('/citizens', {
          method: 'POST',
          data: formData,
        });
      } else {
        // Exclude password if empty
        const payload = { ...formData };
        if (!payload.password) {
          delete (payload as any).password;
        }
        await apiFetch(`/citizens/${selectedId}`, {
          method: 'PUT',
          data: payload,
        });
      }
      setIsModalOpen(false);
      fetchCitizens();
    } catch (err: any) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        alert(err.message || 'Terjadi kesalahan saat memproses data.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      try {
        await apiFetch(`/citizens/${id}`, {
          method: 'DELETE',
        });
        fetchCitizens();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus data warga.');
      }
    }
  };

  const filteredCitizens = citizens.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.no_kk && c.no_kk.includes(search)) ||
    (c.phone && c.phone.includes(search))
  );

  if (loading && citizens.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title & Top Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-section">
          <h1>Kependudukan Warga</h1>
          <p className="page-subtitle">Kelola data seluruh warga yang terdaftar di RT {user?.no_rt} / RW {user?.no_rw}.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          ➕ Tambah Warga Baru
        </button>
      </div>

      {/* Search Bar Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            className="input-field"
            type="text"
            placeholder="Cari warga berdasarkan nama, nomor KK, atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Citizens Table Panel */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="panel-header">
          <span className="panel-title">Daftar Warga Aktif</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total: {filteredCitizens.length} warga
          </span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {filteredCitizens.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada data warga ditemukan.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>L/P</th>
                    <th>No. KK</th>
                    <th>Kontak</th>
                    <th>Alamat</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCitizens.map((citizen) => (
                    <tr key={citizen.id}>
                      <td style={{ fontWeight: 'bold' }}>
                        {citizen.gender === 'P' ? '👩' : '👨'} {citizen.name}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{citizen.gender || 'L'}</span>
                      </td>
                      <td>{citizen.no_kk || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
                          <span>📧 {citizen.email}</span>
                          <span>📞 {citizen.phone || '-'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>{citizen.address || '-'}</td>
                      <td>
                        <span className={`badge ${citizen.status_warga === 'aktif' ? 'resolved' : 'pending'}`}>
                          {citizen.status_warga}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => openEditModal(citizen)} 
                            style={{ padding: '6px 12px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(citizen.id)} 
                            style={{ padding: '6px 12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--accent-rose)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Hapus
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

      {/* CRUD Glass Modal Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '650px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>{modalMode === 'create' ? 'Tambah Data Warga Baru' : 'Edit Data Warga'}</span>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Nama Lengkap</label>
                  <input
                    className="input-field"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  {errors?.name && <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>{errors.name[0]}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">Jenis Kelamin</label>
                  <select
                    className="input-field"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}
                    required
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Email (Username)</label>
                  <input
                    className="input-field"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  {errors?.email && <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>{errors.email[0]}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">{modalMode === 'create' ? 'Password' : 'Password Baru (Kosongkan jika tidak diubah)'}</label>
                  <input
                    className="input-field"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={modalMode === 'create'}
                  />
                  {errors?.password && <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>{errors.password[0]}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">Nomor Kartu Keluarga (KK)</label>
                  <input
                    className="input-field"
                    type="text"
                    name="no_kk"
                    placeholder="320..."
                    value={formData.no_kk}
                    onChange={handleInputChange}
                  />
                  {errors?.no_kk && <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>{errors.no_kk[0]}</span>}
                </div>

                <div className="input-group">
                  <label className="input-label">Nomor RT</label>
                  <input
                    className="input-field"
                    type="text"
                    name="no_rt"
                    value={formData.no_rt}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Nomor RW</label>
                  <input
                    className="input-field"
                    type="text"
                    name="no_rw"
                    value={formData.no_rw}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Nomor HP / Telepon</label>
                  <input
                    className="input-field"
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Status Warga</label>
                  <select
                    className="input-field"
                    name="status_warga"
                    value={formData.status_warga}
                    onChange={handleInputChange}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="pendatang">Pendatang</option>
                    <option value="pindah">Pindah</option>
                    <option value="meninggal">Meninggal</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Alamat Lengkap Rumah</label>
                <textarea
                  className="input-field"
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
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
                  {submitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
