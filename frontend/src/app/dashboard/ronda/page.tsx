'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function RondaPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Form states
  const [selectedRt, setSelectedRt] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form, setForm] = useState({
    day_of_week: 'Senin',
    no_rt: '',
    warga_names: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchRondaSchedules = async (rtVal?: string) => {
    try {
      setLoading(true);
      const rtToFetch = rtVal !== undefined ? rtVal : ((user?.role === 'warga' ? user.no_rt : '01') || '01');
      const data = await apiFetch(`/ronda?no_rt=${rtToFetch}`);
      setSchedules(data);
    } catch (err) {
      console.error('Gagal memuat jadwal ronda:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const defaultRt = (user.role === 'warga' ? user.no_rt : '01') || '01';
      setSelectedRt(defaultRt);
      fetchRondaSchedules(defaultRt);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRtFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedRt(val);
    fetchRondaSchedules(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch('/ronda', {
        method: 'POST',
        data: {
          day_of_week: form.day_of_week,
          no_rt: form.no_rt,
          warga_names: form.warga_names
        }
      });
      alert('Jadwal ronda berhasil disimpan!');
      setIsEditModalOpen(false);
      fetchRondaSchedules(selectedRt);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan jadwal ronda.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus jadwal ronda hari ini?')) {
      try {
        await apiFetch(`/ronda/${id}`, { method: 'DELETE' });
        alert('Jadwal ronda berhasil dihapus.');
        fetchRondaSchedules(selectedRt);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus jadwal ronda.');
      }
    }
  };

  const openAddScheduleModal = () => {
    setForm({
      day_of_week: 'Senin',
      no_rt: (user?.role === 'admin' ? user.no_rt : selectedRt) || '01',
      warga_names: ''
    });
    setIsEditModalOpen(true);
  };

  const openEditScheduleModal = (schedule: any) => {
    setForm({
      day_of_week: schedule.day_of_week,
      no_rt: schedule.no_rt,
      warga_names: schedule.warga_names
    });
    setIsEditModalOpen(true);
  };

  if (loading && schedules.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isWarga = user?.role === 'warga';
  const isAdminOrSuper = ['super_admin', 'admin'].includes(user?.role || '');

  // Complete list of days for grid visualization
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title & Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-section">
          <h1>Jadwal Ronda / Keamanan Malam</h1>
          <p className="page-subtitle">Jadwal piket sistem keamanan lingkungan (siskamling) ronda malam warga.</p>
        </div>
        {isAdminOrSuper && (
          <button className="btn-primary" onClick={openAddScheduleModal}>
            👮 Kelola Jadwal Ronda
          </button>
        )}
      </div>

      {/* Filter RT */}
      {!isWarga && (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Pilih RT yang Dilihat:</span>
          <select
            value={selectedRt}
            onChange={handleRtFilterChange}
            className="input-field"
            style={{ width: '120px', padding: '8px 12px', background: '#ffffff', border: '1px solid #cbd5e1' }}
          >
            <option value="01">RT 01</option>
            <option value="02">RT 02</option>
            <option value="03">RT 03</option>
            <option value="04">RT 04</option>
          </select>
        </div>
      )}

      {/* Grid Tampilan Jadwal Ronda Mingguan */}
      <div className="glass-panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="panel-title">Jadwal Siskamling Mingguan (RT {selectedRt})</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>RW 12</span>
        </div>
        <div className="panel-body" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {days.map((day) => {
              // Find schedule for this day
              const sched = schedules.find((s) => s.day_of_week === day);
              
              return (
                <div 
                  key={day} 
                  style={{ 
                    background: '#ffffff', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '10px', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
                    display: 'flex', 
                    flexDirection: 'column', 
                    overflow: 'hidden' 
                  }}
                >
                  {/* Day header */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#0f172a' }}>{day}</span>
                    <span style={{ fontSize: '1.2rem' }}>
                      {day === 'Sabtu' || day === 'Minggu' ? '🌙' : '⭐'}
                    </span>
                  </div>

                  {/* Body with names list */}
                  <div style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sched ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sched.warga_names.split(',').map((name: string, i: number) => (
                          <div 
                            key={i} 
                            style={{ 
                              padding: '6px 10px', 
                              background: '#f1f5f9', 
                              borderRadius: '6px', 
                              fontSize: '0.85rem', 
                              color: '#334155', 
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>👤</span> {name.trim()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px 0', fontStyle: 'italic' }}>
                        Tidak ada petugas ronda
                      </div>
                    )}
                  </div>

                  {/* Actions for admin */}
                  {sched && isAdminOrSuper && (
                    <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => openEditScheduleModal(sched)}
                        style={{ flex: 1, padding: '4px', background: '#e0f2fe', border: 'none', color: '#0369a1', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Edit ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(sched.id)}
                        style={{ flex: 1, padding: '4px', background: '#fee2e2', border: 'none', color: '#dc2626', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Hapus 🗑
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Manage Ronda Schedule Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
              <span className="panel-title" style={{ color: '#0f172a', fontWeight: 'bold' }}>Kelola Petugas Ronda</span>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Hari Ronda</label>
                <select
                  className="input-field"
                  name="day_of_week"
                  value={form.day_of_week}
                  onChange={handleInputChange}
                  required
                >
                  {days.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>RT Petugas</label>
                <input
                  className="input-field"
                  type="text"
                  name="no_rt"
                  value={form.no_rt}
                  onChange={handleInputChange}
                  disabled={user?.role === 'admin'}
                  placeholder="Misal: 01"
                  required
                />
                {user?.role === 'admin' && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Prefilled berdasarkan RT Anda</span>
                )}
              </div>

              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 600, color: '#475569' }}>Daftar Nama Warga (Dipisahkan koma)</label>
                <textarea
                  className="input-field"
                  name="warga_names"
                  rows={4}
                  value={form.warga_names}
                  onChange={handleInputChange}
                  placeholder="Misal: Agus Pratama, Budi Setiawan, Candra Wijaya"
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ketik nama-nama petugas yang ronda pada hari tersebut, pisahkan dengan tanda koma.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal Ronda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
