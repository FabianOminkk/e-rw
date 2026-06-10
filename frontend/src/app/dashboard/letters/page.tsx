'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export default function LettersPage() {
  const { user } = useAuth();
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Citizen)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [letterType, setLetterType] = useState('Surat Pengantar Domisili');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Action states (Admin)
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<'approved' | 'rejected'>('approved');
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchLetters = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/letters');
      setLetters(data);
    } catch (err) {
      console.error('Gagal memuat surat pengantar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLetters();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiFetch('/letters', {
        method: 'POST',
        data: {
          letter_type: letterType,
          purpose,
        },
      });
      setIsModalOpen(false);
      setPurpose('');
      fetchLetters();
    } catch (err: any) {
      alert(err.message || 'Gagal mengajukan surat pengantar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionId) return;
    setActionSubmitting(true);

    try {
      await apiFetch(`/letters/${activeActionId}/status`, {
        method: 'PUT',
        data: {
          status: actionStatus,
          notes: actionNotes,
        },
      });
      setActiveActionId(null);
      setActionNotes('');
      fetchLetters();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status surat.');
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading && letters.length === 0) {
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
          <h1>Surat Pengantar RT/RW</h1>
          <p className="page-subtitle">
            {isAdmin 
              ? 'Tinjau dan setujui berkas permohonan surat pengantar warga untuk administrasi kelurahan.'
              : 'Ajukan surat pengantar RT/RW secara online untuk mengurus KTP, KK, Domisili, dll.'}
          </p>
        </div>
        {isWarga && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            📄 Buat Pengajuan Surat
          </button>
        )}
      </div>

      {/* Letters Table Panel */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="panel-header">
          <span className="panel-title">{isAdmin ? 'Antrean Pengajuan Surat Warga' : 'Riwayat Pengajuan Surat Anda'}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Total: {letters.length} pengajuan
          </span>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          {letters.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada data pengajuan surat pengantar.
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    {isAdmin && <th>Nama Warga</th>}
                    {isAdmin && <th>RT / RW</th>}
                    <th>Jenis Surat</th>
                    <th>Keperluan</th>
                    <th>Tanggal Diajukan</th>
                    <th>Status</th>
                    <th>Catatan/Keterangan</th>
                    <th style={{ textAlign: 'center' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {letters.map((letter) => (
                    <tr key={letter.id}>
                      {isAdmin && <td style={{ fontWeight: 'bold' }}>{letter.user?.name}</td>}
                      {isAdmin && <td>RT {letter.user?.no_rt} / RW {letter.user?.no_rw}</td>}
                      <td style={{ fontWeight: 600 }}>{letter.letter_type}</td>
                      <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>{letter.purpose}</td>
                      <td>{new Date(letter.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td>
                        <span className={`badge ${letter.status}`}>
                          {letter.status === 'pending' ? 'Menunggu' : (letter.status === 'approved' ? 'Disetujui' : 'Ditolak')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: letter.status === 'rejected' ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                        {letter.notes || '-'}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          {letter.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => {
                                  setActiveActionId(letter.id);
                                  setActionStatus('approved');
                                }}
                                style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--accent-emerald)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => {
                                  setActiveActionId(letter.id);
                                  setActionStatus('rejected');
                                }}
                                style={{ padding: '6px 12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--accent-rose)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Selesai</span>
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

      {/* Citizen Request Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>Buat Pengajuan Surat Pengantar</span>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Jenis Surat</label>
                <select
                  className="input-field"
                  value={letterType}
                  onChange={(e) => setLetterType(e.target.value)}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1' }}
                >
                  <option value="Surat Pengantar Domisili">Surat Pengantar Domisili</option>
                  <option value="Surat Pengantar Pembuatan KK Baru">Surat Pengantar Pembuatan KK Baru</option>
                  <option value="Surat Pengantar Pembuatan KTP">Surat Pengantar Pembuatan KTP</option>
                  <option value="Surat Pengantar Pembuatan SKCK">Surat Pengantar Pembuatan SKCK</option>
                  <option value="Surat Pengantar Pernikahan">Surat Pengantar Pernikahan</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Keperluan Pengajuan</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Jelaskan tujuan pengajuan surat ini secara ringkas..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
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
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Action Modal (Approve/Reject) */}
      {activeActionId !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div className="panel-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <span className="panel-title" style={{ color: '#0f172a' }}>{actionStatus === 'approved' ? 'Setujui Permohonan Surat' : 'Tolak Permohonan Surat'}</span>
              <button onClick={() => setActiveActionId(null)} style={{ fontSize: '1.5rem', cursor: 'pointer', opacity: 0.7, color: '#475569' }}>×</button>
            </div>
            
            <form onSubmit={handleActionSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label className="input-label">Catatan Pengurus RT/RW</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder={actionStatus === 'approved' ? 'Contoh: Nomor surat 12/RT03/VI/2026. Dapat diambil di pos.' : 'Contoh: Berkas persyaratan kurang lengkap. Mohon hubungi ketua RT.'}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  required={actionStatus === 'rejected'} // required on rejection
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveActionId(null)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    background: actionStatus === 'approved' ? '#10b981' : '#ef4444'
                  }}
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? 'Memproses...' : (actionStatus === 'approved' ? 'Setujui & Kirim' : 'Tolak & Kirim')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
