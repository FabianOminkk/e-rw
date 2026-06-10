'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Citizen)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Response states (Admin)
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'processed' | 'resolved'>('resolved');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/complaints');
      setComplaints(data);
    } catch (err) {
      console.error('Gagal memuat pengaduan warga:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch('/complaints', {
        method: 'POST',
        data: {
          title,
          content,
        },
      });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim laporan pengaduan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplyId) return;
    setReplySubmitting(true);

    try {
      await apiFetch(`/complaints/${activeReplyId}/reply`, {
        method: 'PUT',
        data: {
          status: replyStatus,
          reply: replyText,
        },
      });
      setActiveReplyId(null);
      setReplyText('');
      fetchComplaints();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim tanggapan.');
    } finally {
      setReplySubmitting(false);
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner" />
      </div>
    );
  }

  const isAdmin = ['super_admin', 'admin'].includes(user?.role || '');
  const isWarga = user?.role === 'warga';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Title & Top Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-title-section">
          <h1>Laporan Pengaduan Warga</h1>
          <p className="page-subtitle">
            {isAdmin 
              ? 'Kelola keluhan, aduan, dan masukan dari warga mengenai lingkungan RT/RW.'
              : 'Laporkan keluhan, kerusakan fasilitas umum, atau saran perbaikan untuk lingkungan.'}
          </p>
        </div>
        {isWarga && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            ⚠️ Buat Laporan Pengaduan
          </button>
        )}
      </div>

      {/* Complaints Grid / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {complaints.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada laporan pengaduan masuk.
          </div>
        ) : (
          complaints.map((c) => (
            <div className="glass-panel" key={c.id} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{c.title}</span>
                  {isAdmin && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Oleh: {c.user?.name} (RT {c.user?.no_rt})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(c.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className={`badge ${c.status}`}>
                    {c.status === 'pending' ? 'Menunggu' : (c.status === 'processed' ? 'Diproses' : 'Selesai')}
                  </span>
                </div>
              </div>

              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{c.content}</p>

                {/* Reply section */}
                {c.reply ? (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderLeft: '3px solid var(--accent-cyan)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                      Tanggapan Pengurus RT/RW
                    </span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{c.reply}</p>
                  </div>
                ) : (
                  isAdmin && c.status !== 'resolved' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          setActiveReplyId(c.id);
                          setReplyText('');
                        }}
                        style={{ padding: '8px 16px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        ✍️ Tanggapi Aduan
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Complaint Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>Kirim Pengaduan Baru</span>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Judul Aduan</label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Contoh: Lampu jalan RT 03 rusak"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Isi Detail Aduan / Laporan</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Jelaskan kronologi, lokasi detail, atau keluhan Anda secara rinkas..."
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
                  {submitting ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Reply Modal */}
      {activeReplyId !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>Tulis Tanggapan Pengaduan</span>
              <button onClick={() => setActiveReplyId(null)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleReplySubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Status Tindakan</label>
                <select
                  className="input-field"
                  value={replyStatus}
                  onChange={(e: any) => setReplyStatus(e.target.value)}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}
                >
                  <option value="resolved">Selesai Ditindaklanjuti (Resolved)</option>
                  <option value="processed">Sedang Diproses (Processed)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Teks Tanggapan / Solusi</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Ketik balasan atau penyelesaian laporan untuk warga..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveReplyId(null)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={replySubmitting}
                >
                  {replySubmitting ? 'Mengirim...' : 'Kirim Tanggapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
