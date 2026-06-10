'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/announcements');
      setAnnouncements(data);
    } catch (err) {
      console.error('Gagal memuat pengumuman:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedId(null);
    setTitle('');
    setContent('');
    setIsModalOpen(true);
  };

  const openEditModal = (ann: any) => {
    setModalMode('edit');
    setSelectedId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (modalMode === 'create') {
        await apiFetch('/announcements', {
          method: 'POST',
          data: { title, content },
        });
      } else {
        await apiFetch(`/announcements/${selectedId}`, {
          method: 'PUT',
          data: { title, content },
        });
      }
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengumuman.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) {
      try {
        await apiFetch(`/announcements/${id}`, {
          method: 'DELETE',
        });
        fetchAnnouncements();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus pengumuman.');
      }
    }
  };

  if (loading && announcements.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isAdmin = ['super_admin', 'admin'].includes(user?.role || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title & Top Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-section">
          <h1>Papan Pengumuman RW</h1>
          <p className="page-subtitle">Pusat informasi, kegiatan warga, kerja bakti, dan agenda penting Rukun Warga.</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreateModal}>
            📢 Terbitkan Pengumuman Baru
          </button>
        )}
      </div>

      {/* Announcements Board */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {announcements.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada pengumuman yang diterbitkan.
          </div>
        ) : (
          announcements.map((ann) => (
            <div className="glass-panel" key={ann.id} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{ann.title}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(ann.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>{ann.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--panel-border)', paddingTop: '16px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Diterbitkan oleh: <strong style={{ color: 'var(--text-secondary)' }}>{ann.author?.name}</strong> ({ann.author?.role === 'admin' ? 'Ketua RW' : ann.author?.role.replace('_', ' ')})
                  </span>
                  
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => openEditModal(ann)} 
                        style={{ padding: '6px 12px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(ann.id)} 
                        style={{ padding: '6px 12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--accent-rose)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Publish Announcement Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>{modalMode === 'create' ? 'Terbitkan Pengumuman Baru' : 'Edit Pengumuman'}</span>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Judul Pengumuman</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Contoh: Jadwal Kerja Bakti Minggu Ini"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Isi Pengumuman</label>
                <textarea
                  className="input-field"
                  rows={6}
                  placeholder="Tulis detail informasi pengumuman di sini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                  {submitting ? 'Menyimpan...' : 'Terbitkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
