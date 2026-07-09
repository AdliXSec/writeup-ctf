import React, { useState } from 'react';

export default function AdminChallenges() {
  const [dragActive, setDragActive] = useState(false);
  const [isWhitebox, setIsWhitebox] = useState(false);
  const [instanceFile, setInstanceFile] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setInstanceFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="admin-challenges">
      <div className="admin-card">
        <h3 className="admin-card-title">Tambahkan Tantangan Baru</h3>
        <form className="admin-form-grid-2">
          <div>
            <label className="admin-label">Nama Challenge</label>
            <input type="text" className="admin-input" placeholder="sql-injection-101" />
          </div>
          <div>
            <label className="admin-label">Kategori</label>
            <select className="admin-input" style={{ appearance: 'none' }}>
              <option>Web Exploitation</option>
              <option>Binary Exploitation</option>
              <option>Cryptography</option>
              <option>Reverse Engineering</option>
            </select>
          </div>
          <div>
            <label className="admin-label">Base Points</label>
            <input type="number" className="admin-input" defaultValue={100} />
          </div>
          <div>
            <label className="admin-label">Opsi Khusus</label>
            <div className="admin-checkbox-group">
              <label className="admin-checkbox-label">
                <input type="checkbox" /> Dynamic Scoring
              </label>
            </div>
          </div>
          
          <div className="admin-full-width">
            <label className="admin-label">Deskripsi Tantangan</label>
            <textarea className="admin-input" rows={3} placeholder="Jelaskan sedikit tentang tantangan ini..."></textarea>
          </div>

          <div className="admin-full-width">
            <label className="admin-label">Upload File ZIP Instance Docker</label>
            <div 
              className={`admin-dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('instance-upload').click()}
            >
              <input 
                type="file" 
                id="instance-upload" 
                className="hidden" 
                accept=".zip" 
                onChange={(e) => setInstanceFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              {instanceFile ? (
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                  <span className="mono">📄 {instanceFile.name}</span>
                </div>
              ) : (
                <>
                  <p className="text-muted" style={{ marginBottom: '0.5rem' }}>Pilih file chall.zip atau seret ke sini</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Maksimal 50MB</p>
                </>
              )}
            </div>
          </div>

          <div className="admin-full-width" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="admin-checkbox-label" style={{ color: '#10b981', fontWeight: 'bold' }}>
                <input 
                  type="checkbox" 
                  checked={isWhitebox} 
                  onChange={(e) => setIsWhitebox(e.target.checked)} 
                /> Jadikan Tantangan Whitebox (Source Code Terbuka)
              </label>
            </div>

            {isWhitebox && (
              <div className="admin-form-grid-2">
                <div>
                  <label className="admin-label" style={{ fontSize: '0.75rem' }}>URL Download Eksternal (Opsional, cth: GDrive)</label>
                  <input type="text" className="admin-input" placeholder="https://..." />
                </div>
                <div>
                  <label className="admin-label" style={{ fontSize: '0.75rem' }}>ATAU Upload File Source Code (.zip)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="file" 
                      id="source-upload" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setSourceFile(e.target.files[0])}
                    />
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('source-upload').click()}
                      style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace' }}
                    >
                      Pilih File
                    </button>
                    <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {sourceFile ? sourceFile.name : 'No file chosen'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="admin-full-width">
            <button type="button" className="btn-admin-action btn-full">UPLOAD & BUILD IMAGE 🚀</button>
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Daftar Tantangan Aktif</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Poin</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono text-muted">#1</td>
                <td><strong>sql-injection-101</strong></td>
                <td style={{ color: 'var(--accent-cyan)' }}>Web</td>
                <td className="mono text-magenta">100 pts</td>
                <td className="admin-table-actions">
                  <button className="btn-admin-action btn-warning btn-sm">EDIT</button>
                  <button className="btn-admin-action btn-sm">DELETE</button>
                </td>
              </tr>
              <tr style={{ opacity: 0.5 }}>
                <td className="mono text-muted">#2</td>
                <td><strong>buffer-overflow</strong> <span className="admin-badge admin-badge-red">DISABLED</span></td>
                <td style={{ color: 'var(--accent-cyan)' }}>Pwn</td>
                <td className="mono text-magenta">200 pts</td>
                <td className="admin-table-actions">
                  <button className="btn-admin-action btn-warning btn-sm">EDIT</button>
                  <button className="btn-admin-action btn-sm">DELETE</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
