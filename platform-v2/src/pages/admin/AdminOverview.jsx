import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';

export default function AdminOverview() {
  const { addToast } = useToast();
  const [stats, setStats] = useState({
    users: { total: 0, banned: 0 },
    solves: 0,
    instance_manager: { active_instances: 0, docker_containers_running: 0 }
  });
  
  const [settings, setSettings] = useState({
    start_time: '',
    end_time: '',
    is_paused: false,
    freeze_time: ''
  });

  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const [statsRes, settingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/settings')
      ]);
      setStats(statsRes.data);
      
      // format datetime from backend for datetime-local input
      const formatTime = (timeStr) => {
        if (!timeStr) return '';
        // Assuming backend returns UTC in "YYYY-MM-DD HH:MM:SS" format
        return timeStr.replace(' ', 'T'); 
      };

      setSettings({
        start_time: formatTime(settingsRes.data.start_time),
        end_time: formatTime(settingsRes.data.end_time),
        is_paused: settingsRes.data.is_paused,
        freeze_time: formatTime(settingsRes.data.freeze_time)
      });
      setLoading(false);
    } catch (err) {
      addToast('error', 'Gagal memuat data Overview', 'Cek koneksi ke server.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSaveSchedule = async (e) => {
    if (e) e.preventDefault();
    try {
      const formatToBackend = (val) => val ? val.replace('T', ' ') : null;
      
      await api.put('/admin/settings', {
        start_time: formatToBackend(settings.start_time),
        end_time: formatToBackend(settings.end_time),
        is_paused: settings.is_paused,
        freeze_time: formatToBackend(settings.freeze_time)
      });
      addToast('success', 'Jadwal Tersimpan', 'Konfigurasi waktu CTF telah diperbarui.');
    } catch (err) {
      addToast('error', 'Gagal menyimpan', err.response?.data?.error || err.message);
    }
  };

  const handleTogglePause = async () => {
    const newStatus = !settings.is_paused;
    setSettings(prev => ({ ...prev, is_paused: newStatus }));
    
    try {
      const formatToBackend = (val) => val ? val.replace('T', ' ') : null;
      await api.put('/admin/settings', {
        start_time: formatToBackend(settings.start_time),
        end_time: formatToBackend(settings.end_time),
        is_paused: newStatus,
        freeze_time: formatToBackend(settings.freeze_time)
      });
      addToast(
        newStatus ? 'warning' : 'success', 
        newStatus ? 'GAME PAUSED' : 'GAME RESUMED', 
        newStatus ? 'Seluruh instance akan dihentikan.' : 'Pemain kini dapat kembali memulai instance.'
      );
    } catch (err) {
      addToast('error', 'Gagal', err.response?.data?.error || err.message);
      // revert state
      setSettings(prev => ({ ...prev, is_paused: !newStatus }));
    }
  };

  const handleToggleFreeze = async () => {
    const isFrozen = !!settings.freeze_time;
    let newFreezeTime = null;
    
    if (!isFrozen) {
      // Set to current UTC time
      newFreezeTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }
    
    setSettings(prev => ({ ...prev, freeze_time: newFreezeTime }));
    
    try {
      const formatToBackend = (val) => val ? val.replace('T', ' ') : null;
      await api.put('/admin/settings', {
        start_time: formatToBackend(settings.start_time),
        end_time: formatToBackend(settings.end_time),
        is_paused: settings.is_paused,
        freeze_time: newFreezeTime
      });
      addToast(
        newFreezeTime ? 'warning' : 'success', 
        newFreezeTime ? 'SCOREBOARD FROZEN' : 'SCOREBOARD UNFROZEN', 
        newFreezeTime ? 'Skor pemain tidak akan bertambah di papan.' : 'Papan skor kembali diperbarui secara real-time.'
      );
    } catch (err) {
      addToast('error', 'Gagal', err.response?.data?.error || err.message);
      // revert state
      setSettings(prev => ({ ...prev, freeze_time: settings.freeze_time }));
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }} className="mono text-muted">MENGHUBUNGKAN KE SERVER...</div>;
  }

  return (
    <div className="admin-overview">
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-card text-center" style={{ marginBottom: 0 }}>
          <div className="text-3xl font-bold text-cyan" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stats.users.total}</div>
          <div className="text-muted mono" style={{ fontSize: '0.8rem' }}>TOTAL PLAYERS</div>
        </div>
        <div className="admin-card text-center" style={{ marginBottom: 0, borderColor: 'var(--admin-red)' }}>
          <div className="text-3xl font-bold text-red" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stats.users.banned}</div>
          <div className="text-muted mono" style={{ fontSize: '0.8rem' }}>BANNED</div>
        </div>
        <div className="admin-card text-center" style={{ marginBottom: 0, borderColor: 'var(--accent-emerald)' }}>
          <div className="text-3xl font-bold text-emerald" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#10b981' }}>{stats.instance_manager.active_instances}</div>
          <div className="text-muted mono" style={{ fontSize: '0.8rem' }}>ACTIVE INSTANCES</div>
        </div>
        <div className="admin-card text-center" style={{ marginBottom: 0, borderColor: 'var(--accent-magenta)' }}>
          <div className="text-3xl font-bold text-magenta" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#d946ef' }}>{stats.solves}</div>
          <div className="text-muted mono" style={{ fontSize: '0.8rem' }}>TOTAL SOLVES</div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Waktu & Kendali Lomba</h3>
        
        <div className="admin-action-row" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            type="button"
            className={`btn-admin-action ${settings.is_paused ? 'btn-info' : 'btn-warning'}`} 
            onClick={handleTogglePause}
            style={{ flex: 1 }}
          >
            {settings.is_paused ? '▶ RESUME GAME' : '⏸ PAUSE GAME'}
          </button>
          <button 
            type="button"
            className={`btn-admin-action ${settings.freeze_time ? 'btn-info' : 'btn-danger'}`} 
            onClick={handleToggleFreeze}
            style={{ flex: 1, borderColor: settings.freeze_time ? '' : 'var(--admin-red)', color: settings.freeze_time ? '' : 'var(--admin-red)' }}
          >
            {settings.freeze_time ? '❄ UNFREEZE SCOREBOARD' : '❄ FREEZE SCOREBOARD'}
          </button>
        </div>

        <form className="admin-form-grid" onSubmit={handleSaveSchedule}>
          <div>
            <label className="admin-label">Start Time (UTC) [YYYY-MM-DD HH:MM:SS]</label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="2026-10-27 09:00:00"
              value={settings.start_time || ''}
              onChange={(e) => setSettings({...settings, start_time: e.target.value})}
            />
          </div>
          <div>
            <label className="admin-label">End Time (UTC) [YYYY-MM-DD HH:MM:SS]</label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="2026-10-27 18:00:00"
              value={settings.end_time || ''}
              onChange={(e) => setSettings({...settings, end_time: e.target.value})}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-admin-action btn-full" style={{ width: '100%' }}>SIMPAN JADWAL</button>
          </div>
        </form>
      </div>
    </div>
  );
}
