import React from 'react';

export default function AdminUsers() {
  return (
    <div className="admin-users">
      <div className="admin-card">
        <h3 className="admin-card-title">Tambahkan Admin Baru</h3>
        <form className="admin-form-grid-2">
          <div>
            <label className="admin-label">Username Admin</label>
            <input type="text" className="admin-input" placeholder="admin_baru" required />
          </div>
          <div>
            <label className="admin-label">Password Sementara</label>
            <input type="password" className="admin-input" placeholder="••••••••" required />
          </div>
          <div className="admin-full-width" style={{ marginTop: '0.5rem' }}>
            <button type="button" className="btn-admin-action btn-full">DAFTARKAN ADMIN 🛡️</button>
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
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>0xR00T</strong></td>
                <td style={{ color: 'var(--accent-cyan)' }}>SQL-INJECTION-101</td>
                <td className="mono text-magenta">10207</td>
                <td className="mono" style={{ color: '#10b981' }}>13:45:00</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-admin-action" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>KILL INSTANCE</button>
                </td>
              </tr>
              <tr>
                <td><strong>NullSec</strong></td>
                <td style={{ color: 'var(--accent-cyan)' }}>BUFFER-OVERFLOW</td>
                <td className="mono text-magenta">10208</td>
                <td className="mono" style={{ color: '#10b981' }}>13:50:30</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-admin-action" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>KILL INSTANCE</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Manajemen Pemain (Sistem Banned)</h3>
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
              <tr>
                <td className="mono text-muted">1</td>
                <td><strong>admin</strong></td>
                <td><span style={{ color: 'var(--admin-red)', fontWeight: 'bold', fontSize: '0.8rem' }}>ADMIN</span></td>
                <td><span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem' }}>ACTIVE</span></td>
                <td style={{ textAlign: 'right' }}></td>
              </tr>
              <tr>
                <td className="mono text-muted">2</td>
                <td><strong>0xR00T</strong></td>
                <td><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>PLAYER</span></td>
                <td><span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem' }}>ACTIVE</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-admin-action" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent' }}>BAN PLAYER</button>
                </td>
              </tr>
              <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                <td className="mono text-muted">3</td>
                <td><strong>skid_hacker</strong></td>
                <td><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>PLAYER</span></td>
                <td><span style={{ color: 'var(--admin-red)', fontWeight: 'bold', fontSize: '0.8rem' }}>BANNED</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-admin-action" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: '#10b981', color: '#10b981', background: 'transparent' }}>UNBAN PLAYER</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
