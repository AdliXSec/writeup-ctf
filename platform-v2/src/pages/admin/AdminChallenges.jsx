import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';

export default function AdminChallenges() {
  const { addToast } = useToast();
  
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Web Exploitation',
    points: 100,
    min_points: 50,
    decay: 10,
    description: '',
    is_dynamic: false,
    is_whitebox: false,
    level: 'Easy'
  });
  
  const [instanceFile, setInstanceFile] = useState(null);
  const [sourceFile, setSourceFile] = useState(null);

  const fetchChallenges = async () => {
    try {
      const res = await api.get('/challenges');
      setChallenges(res.data);
      setLoading(false);
    } catch (err) {
      addToast('error', 'Gagal memuat tantangan', err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('points', formData.points);
    data.append('min_points', formData.min_points);
    data.append('decay', formData.decay);
    data.append('description', formData.description);
    data.append('is_dynamic', formData.is_dynamic);
    data.append('is_whitebox', formData.is_whitebox);
    data.append('level', formData.level);
    
    if (instanceFile) data.append('file', instanceFile);
    if (sourceFile) data.append('source_file', sourceFile);

    try {
      addToast('info', 'Mengunggah...', 'Sedang memproses challenge, mohon tunggu.');
      await api.post('/admin/challenges', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      addToast('success', 'Berhasil', 'Tantangan berhasil ditambahkan ke platform.');
      
      // Reset form
      setFormData({
        name: '',
        category: 'Web Exploitation',
        points: 100,
        min_points: 50,
        decay: 10,
        description: '',
        is_dynamic: false,
        is_whitebox: false,
        level: 'Easy'
      });
      setInstanceFile(null);
      setSourceFile(null);
      setIsEditing(false);
      
      fetchChallenges();
    } catch (err) {
      addToast('error', 'Gagal Menambahkan', err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus challenge ${name} secara permanen?`)) return;
    try {
      await api.delete(`/admin/challenges/${name}`);
      addToast('success', 'Dihapus', `Tantangan ${name} berhasil dihapus.`);
      fetchChallenges();
    } catch (err) {
      addToast('error', 'Gagal Menghapus', err.response?.data?.error || err.message);
    }
  };

  const handleToggleHide = async (name) => {
    try {
      await api.put(`/admin/challenges/${name}/toggle`);
      addToast('success', 'Visibility Diubah', `Status visibilitas ${name} berhasil diubah.`);
      fetchChallenges();
    } catch (err) {
      addToast('error', 'Gagal Mengubah', err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (c) => {
    setFormData({
      name: c.name,
      category: c.category,
      points: c.points,
      min_points: c.min_points || 50,
      decay: c.decay || 10,
      description: c.description,
      is_dynamic: c.is_dynamic,
      is_whitebox: c.is_whitebox,
      level: c.level || 'Easy'
    });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('info', 'Mode Edit', 'Data tantangan dimuat ke form.');
  };

  const handleCancelEdit = () => {
    setFormData({
      name: '',
      category: 'Web Exploitation',
      points: 100,
      min_points: 50,
      decay: 10,
      description: '',
      is_dynamic: false,
      is_whitebox: false,
      level: 'Easy'
    });
    setInstanceFile(null);
    setSourceFile(null);
    setIsEditing(false);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }} className="mono text-muted">MENGHUBUNGKAN KE SERVER...</div>;
  }

  return (
    <div className="admin-challenges">
      <div className="admin-card">
        <h3 className="admin-card-title">Tambahkan Tantangan Baru</h3>
        <form className="admin-form-grid-2" onSubmit={handleSubmit}>
          <div>
            <label className="admin-label">Nama Challenge</label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="sql-injection-101" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              disabled={isEditing}
              style={isEditing ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
            {isEditing && <small className="text-muted" style={{display: 'block', marginTop: '5px'}}>Nama challenge tidak dapat diubah saat mode edit.</small>}
          </div>
          <div>
            <label className="admin-label">Kategori</label>
            <select 
              className="admin-input" 
              style={{ appearance: 'none' }}
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option>Web Exploitation</option>
              <option>Binary Exploitation</option>
              <option>Cryptography</option>
              <option>Reverse Engineering</option>
              <option>Miscellaneous</option>
            </select>
          </div>
          <div>
            <label className="admin-label">Level</label>
            <select 
              className="admin-input" 
              style={{ appearance: 'none' }}
              value={formData.level}
              onChange={e => setFormData({...formData, level: e.target.value})}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
              <option>Expert</option>
            </select>
          </div>
          <div>
            <label className="admin-label">Base Points</label>
            <input 
              type="number" 
              className="admin-input" 
              required
              value={formData.points}
              onChange={e => setFormData({...formData, points: e.target.value})}
            />
          </div>
          <div>
            <label className="admin-label">Opsi Khusus</label>
            <div className="admin-checkbox-group">
              <label className="admin-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData.is_dynamic}
                  onChange={e => setFormData({...formData, is_dynamic: e.target.checked})}
                /> Dynamic Scoring
              </label>
            </div>
          </div>

          {formData.is_dynamic && (
            <>
              <div>
                <label className="admin-label">Minimum Points</label>
                <input 
                  type="number" 
                  className="admin-input" 
                  required
                  value={formData.min_points}
                  onChange={e => setFormData({...formData, min_points: e.target.value})}
                />
              </div>
              <div>
                <label className="admin-label">Decay Rate</label>
                <input 
                  type="number" 
                  className="admin-input" 
                  required
                  value={formData.decay}
                  onChange={e => setFormData({...formData, decay: e.target.value})}
                />
              </div>
            </>
          )}
          
          <div className="admin-full-width">
            <label className="admin-label">Deskripsi Tantangan</label>
            <textarea 
              className="admin-input" 
              rows={3} 
              placeholder="Jelaskan sedikit tentang tantangan ini..."
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
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
                  checked={formData.is_whitebox} 
                  onChange={(e) => setFormData({...formData, is_whitebox: e.target.checked})} 
                /> 
                [Opsional] Sediakan File Unduhan Untuk Peserta (Whitebox)
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                Jika dicentang, pemain dapat mengunduh *source code* (misal `.zip` atau `.c`) saat melihat soal ini.
              </p>
            </div>
            
            {formData.is_whitebox && (
              <div>
                <label className="admin-label">Upload File Sumber (*Source Code*)</label>
                <input 
                  type="file" 
                  className="admin-input" 
                  style={{ padding: '0.5rem' }} 
                  onChange={(e) => setSourceFile(e.target.files[0])}
                />
              </div>
            )}
          </div>

          <div className="admin-full-width" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-admin-action btn-full">
              {isEditing ? "SIMPAN PERUBAHAN 💾" : "UPLOAD & SIMPAN TANTANGAN 🚀"}
            </button>
            {isEditing && (
              <button type="button" className="btn-admin-action btn-full" style={{ background: '#333' }} onClick={handleCancelEdit}>
                BATAL EDIT ✖
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Daftar Tantangan Aktif</h3>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Level</th>
                <th>Tipe</th>
                <th>Points</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {challenges.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted py-4">Belum ada tantangan</td></tr>
              ) : challenges.map(c => (
                <tr key={c.id} style={{ opacity: c.is_hidden ? 0.5 : 1 }}>
                  <td><strong>{c.name}</strong></td>
                  <td className="text-cyan">{c.category}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.8em',
                      backgroundColor: c.level === 'Easy' ? 'rgba(16, 185, 129, 0.2)' : c.level === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : c.level === 'Hard' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                      color: c.level === 'Easy' ? '#10b981' : c.level === 'Medium' ? '#f59e0b' : c.level === 'Hard' ? '#ef4444' : '#8b5cf6'
                    }}>
                      {c.level || 'Easy'}
                    </span>
                  </td>
                  <td>{c.is_whitebox ? 'Whitebox' : 'Blackbox'}</td>
                  <td className="mono">{c.points}</td>
                  <td>
                    {c.is_hidden ? (
                      <span className="text-red font-bold">HIDDEN</span>
                    ) : (
                      <span className="text-emerald">PUBLIC</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-admin-action" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => handleToggleHide(c.name)}
                    >
                      {c.is_hidden ? 'UNHIDE' : 'HIDE'}
                    </button>
                    <button 
                      className="btn-admin-action" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
                      onClick={() => handleEdit(c)}
                    >
                      EDIT
                    </button>
                    <button 
                      className="btn-admin-action" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--admin-red)', color: 'var(--admin-red)' }}
                      onClick={() => handleDelete(c.name)}
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
