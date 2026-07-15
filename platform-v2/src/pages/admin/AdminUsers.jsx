import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';

export default function AdminUsers() {
  const { addToast } = useToast();
  
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [instances, setInstances] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [instancesRes, usersRes] = await Promise.all([
        api.get('/admin/instances'),
        api.get('/admin/users')
      ]);
      setInstances(instancesRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (err) {
      addToast('error', 'Gagal memuat data', 'Pastikan Anda login sebagai Admin');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.username || !adminForm.password) {
      addToast('warning', 'Data tidak lengkap', 'Isi username dan password');
      return;
    }
    
    try {
      await api.post('/admin/users', adminForm);
      addToast('success', 'Admin Ditambahkan', `Akun ${adminForm.username} telah menjadi admin.`);
      setAdminForm({ username: '', password: '' });
      fetchData();
    } catch (err) {
      addToast('error', 'Gagal Menambahkan Admin', err.response?.data?.error || err.message);
    }
  };

  const handleKillInstance = async (teamId, challengeName) => {
    try {
      await api.post('/admin/instances/stop', { team_id: teamId, challenge: challengeName });
      addToast('success', 'Instance Dihentikan', `Instance ${challengeName} untuk pengguna ${teamId} berhasil dimatikan.`);
      fetchData();
    } catch (err) {
      addToast('error', 'Gagal menghentikan', err.response?.data?.error || err.message);
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/ban`);
      addToast(
        res.data.is_banned === 1 ? 'warning' : 'success', 
        res.data.is_banned === 1 ? 'Banned' : 'Unbanned', 
        `Status pengguna berhasil diubah.`
      );
      fetchData();
    } catch (err) {
      addToast('error', 'Gagal', err.response?.data?.error || err.message);
    }
  };

  const handleToggleHide = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-hide`);
      addToast(
        res.data.is_hidden === 1 ? 'warning' : 'success', 
        res.data.is_hidden === 1 ? 'Hidden' : 'Visible', 
        `Visibilitas pengguna berhasil diubah.`
      );
      fetchData();
    } catch (err) {
      addToast('error', 'Gagal', err.response?.data?.error || err.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Yakin ingin MENGHAPUS permanen pengguna ${username}? Semua riwayat solve dan skornya akan hilang.`)) {
      return;
    }
    
    try {
      await api.delete(`/admin/users/${userId}`);
      addToast('success', 'User Dihapus', `Pengguna ${username} berhasil dihapus permanen.`);
      fetchData();
    } catch (err) {
      addToast('error', 'Gagal Menghapus', err.response?.data?.error || err.message);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }} className="mono text-muted">MENGHUBUNGKAN KE SERVER...</div>;
  }

  return (
    <div className="admin-users">
      <div className="admin-card">
        <h3 className="admin-card-title">Tambahkan Admin Baru</h3>
        <form className="admin-form-grid-2" onSubmit={handleAddAdmin}>
          <div>
            <label className="admin-label">Username Admin</label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="admin_baru" 
              required 
              value={adminForm.username}
              onChange={e => setAdminForm({...adminForm, username: e.target.value})}
            />
          </div>
          <div>
            <label className="admin-label">Password Sementara</label>
            <input 
              type="password" 
              className="admin-input" 
              placeholder="••••••••" 
              required 
              value={adminForm.password}
              onChange={e => setAdminForm({...adminForm, password: e.target.value})}
            />
          </div>
          <div className="admin-full-width" style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn-admin-action btn-full">DAFTARKAN ADMIN 🛡️</button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Monitor Instance Pemain</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pemain / Tim</th>
                <th>Challenge</th>
                <th>Port</th>
                <th>Kedaluwarsa</th>
                <th>CPU</th>
                <th>RAM</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {instances.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-muted py-4">Tidak ada instance yang berjalan</td></tr>
              ) : instances.map((inst, idx) => (
                <tr key={idx}>
                  <td><strong>{inst.username || `User #${inst.team_id}`}</strong></td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{inst.challenge}</td>
                  <td className="mono text-magenta">{inst.port}</td>
                  <td className="mono" style={{ color: '#10b981' }}>{new Date(inst.expires_at).toLocaleTimeString()}</td>
                  <td className="mono" style={{ color: 'var(--admin-yellow)' }}>{inst.cpu || 'N/A'}</td>
                  <td className="mono" style={{ color: 'var(--accent-cyan)' }}>{inst.mem || 'N/A'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-admin-action" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--admin-red)', color: 'var(--admin-red)' }}
                      onClick={() => handleKillInstance(inst.team_id, inst.challenge)}
                    >
                      KILL INSTANCE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Manajemen Pemain</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ opacity: u.is_banned ? 0.5 : 1 }}>
                  <td className="mono text-muted">{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>
                    {u.is_admin ? (
                      <span style={{ color: 'var(--admin-yellow)', fontSize: '0.8rem', border: '1px solid var(--admin-yellow)', padding: '2px 6px', borderRadius: '4px' }}>ADMIN</span>
                    ) : (
                      <span className="text-muted">PLAYER</span>
                    )}
                  </td>
                  <td>
                    {u.is_banned ? (
                      <span className="text-red font-bold">BANNED</span>
                    ) : u.is_hidden ? (
                      <span className="text-yellow font-bold">HIDDEN</span>
                    ) : (
                      <span className="text-emerald">ACTIVE</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!u.is_admin && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-admin-action" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: u.is_hidden ? 'var(--accent-emerald)' : 'var(--admin-cyan)', color: u.is_hidden ? 'var(--accent-emerald)' : 'var(--admin-cyan)' }}
                          onClick={() => handleToggleHide(u.id)}
                        >
                          {u.is_hidden ? 'UNHIDE' : 'HIDE'}
                        </button>
                        
                        <button 
                          className="btn-admin-action" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: u.is_banned ? 'var(--accent-emerald)' : 'var(--admin-yellow)', color: u.is_banned ? 'var(--accent-emerald)' : 'var(--admin-yellow)' }}
                          onClick={() => handleToggleBan(u.id)}
                        >
                          {u.is_banned ? 'UNBAN' : 'BAN'}
                        </button>
                        
                        <button 
                          className="btn-admin-action" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--admin-red)', color: 'var(--admin-red)' }}
                          onClick={() => handleDeleteUser(u.id, u.username)}
                        >
                          DELETE
                        </button>
                      </div>
                    )}
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
