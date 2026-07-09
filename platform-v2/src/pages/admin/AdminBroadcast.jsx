import React from 'react';

export default function AdminBroadcast() {
  return (
    <div className="admin-broadcast">
      <div className="admin-card">
        <h3 className="admin-card-title">Manajemen Notifikasi & Pengumuman</h3>
        
        <form style={{ display: 'grid', gap: '1.5rem', marginBottom: '3rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Judul Pengumuman</label>
            <input type="text" className="admin-input" placeholder="Cth: Server Maintenance" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Pesan (Mendukung baris baru)</label>
            <textarea className="admin-input" rows={4} placeholder="Pesan pengumuman..."></textarea>
          </div>
          <div>
            <button type="button" className="btn-admin-action" style={{ width: '100%', borderColor: 'var(--admin-yellow)', color: 'var(--admin-yellow)', background: 'rgba(245, 158, 11, 0.1)' }}>BROADCAST PENGUMUMAN 📢</button>
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
              <tr>
                <td className="mono text-muted">1</td>
                <td><strong>Server Maintenance</strong></td>
                <td className="mono text-muted">2023-10-27 10:00:00</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-admin-action" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent' }}>DELETE</button>
                </td>
              </tr>
              <tr>
                <td className="mono text-muted">2</td>
                <td><strong>Hint untuk Challenge Reverse Engineering</strong></td>
                <td className="mono text-muted">2023-10-27 15:30:00</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-admin-action" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent' }}>DELETE</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
