import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';

export default function AdminBroadcast() {
  const { addToast } = useToast();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', message: '' });

  const fetchNotifications = async () => {
    try {
      // In game.py it's registered under /api/v2/notifications
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setLoading(false);
    } catch (err) {
      addToast('error', 'Gagal memuat notifikasi', err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      addToast('warning', 'Data Kosong', 'Judul dan pesan harus diisi.');
      return;
    }
    
    try {
      await api.post('/admin/notifications', formData);
      addToast('success', 'Broadcast Berhasil', 'Pengumuman telah dikirim ke semua pemain.');
      setFormData({ title: '', message: '' });
      fetchNotifications();
    } catch (err) {
      addToast('error', 'Gagal Broadcast', err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus pengumuman ini?')) return;
    try {
      await api.delete(`/admin/notifications/${id}`);
      addToast('success', 'Dihapus', 'Pengumuman berhasil dihapus.');
      fetchNotifications();
    } catch (err) {
      addToast('error', 'Gagal Hapus', err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }} className="mono text-muted">MENGHUBUNGKAN KE SERVER...</div>;
  }

  return (
    <div className="admin-broadcast">
      <div className="admin-card">
        <h3 className="admin-card-title">Manajemen Notifikasi & Pengumuman</h3>
        
        <form style={{ display: 'grid', gap: '1.5rem', marginBottom: '3rem' }} onSubmit={handleBroadcast}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Judul Pengumuman</label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="Cth: Server Maintenance" 
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Pesan (Mendukung baris baru)</label>
            <textarea 
              className="admin-input" 
              rows={4} 
              placeholder="Pesan pengumuman..."
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              required
            ></textarea>
          </div>
          <div>
            <button type="submit" className="btn-admin-action" style={{ width: '100%', borderColor: 'var(--admin-yellow)', color: 'var(--admin-yellow)', background: 'rgba(245, 158, 11, 0.1)' }}>BROADCAST PENGUMUMAN 📢</button>
          </div>
        </form>

        <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Riwayat Pengumuman</h4>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Judul</th>
                <th>Tanggal</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-muted py-4">Belum ada pengumuman</td></tr>
              ) : notifications.map(notif => (
                <tr key={notif.id}>
                  <td className="mono text-muted">{notif.id}</td>
                  <td><strong>{notif.title}</strong></td>
                  <td className="mono text-muted">{new Date(notif.created_at + 'Z').toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-admin-action" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', borderColor: 'var(--admin-red)', color: 'var(--admin-red)' }}
                      onClick={() => handleDelete(notif.id)}
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
