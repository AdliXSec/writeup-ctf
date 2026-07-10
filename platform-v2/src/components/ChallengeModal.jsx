import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import './ChallengeModal.css';

export default function ChallengeModal({ challenge, onClose, onRefresh }) {
  const [flag, setFlag] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const toast = useToast();
  
  if (!challenge) return null;

  const isRunning = challenge.status === 'running';

  useEffect(() => {
    let timer;
    if (isRunning && challenge.instance?.expires_at) {
      const updateTimer = () => {
        const now = Math.floor(Date.now() / 1000);
        let expires = challenge.instance.expires_at;
        
        if (typeof expires === 'string') {
          // If it's a numeric string (unix epoch)
          if (!isNaN(Number(expires))) {
            expires = Number(expires);
          } else {
            // It's likely an ISO string like "2026-07-10T00:33:14.446171+00:00"
            // Replace space with T just in case it's a SQL timestamp "YYYY-MM-DD HH:MM:SS"
            let timeStr = expires.includes('T') ? expires : expires.replace(' ', 'T');
            // If it lacks timezone info (Z or +00:00), assume UTC by appending Z
            if (!timeStr.endsWith('Z') && !timeStr.includes('+') && !timeStr.includes('-')) {
              timeStr += 'Z';
            }
            expires = Math.floor(new Date(timeStr).getTime() / 1000);
          }
        }
        
        if (isNaN(expires)) {
          setTimeLeft('RAW: ' + String(challenge.instance?.expires_at));
          return;
        }

        const diff = expires - now;
        
        if (diff <= 0) {
          setTimeLeft('EXPIRED');
          if(onRefresh) onRefresh();
        } else {
          const m = Math.floor(diff / 60);
          const s = diff % 60;
          setTimeLeft(`${m}m ${s}s`);
        }
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    
    return () => {
      if(timer) clearInterval(timer);
    };
  }, [isRunning, challenge.instance]);

  const handleAction = async (actionPath) => {
    setLoading(true);
    try {
      await api.post(`/game/instances/${actionPath}`, { challenge: challenge.name });
      toast.success(`Berhasil memproses perintah: ${actionPath}`);
      if(onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menghubungi server");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/submit', [flag]);
      const resData = response.data;
      if (resData.accepted > 0) {
        toast.success(resData.results[0]?.message || "Flag diterima!");
      } else {
        toast.error(resData.results[0]?.message || "Flag salah atau ditolak.");
      }
      setFlag('');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal submit flag.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          <span className="category-badge">{challenge.category}</span>
          <h2 className="modal-title">{challenge.name}</h2>
          <div className="modal-points mono text-magenta">{challenge.points} pts</div>
        </div>

        <div className="modal-body">
          <div className="challenge-desc">
            <h4 className="text-cyan mb-2">INTEL</h4>
            <p className="text-muted" dangerouslySetInnerHTML={{ __html: challenge.description }} />
          </div>

          <div className="instance-control glass-panel">
            {isRunning ? (
              <>
                <div className="instance-meta-grid">
                  <div className="meta-item">
                    <span className="meta-label">Status:</span>
                    <span className="text-emerald font-bold uppercase" style={{display: 'flex', alignItems: 'center'}}>
                      <span className="pulse-dot" style={{marginRight: '6px'}}></span>RUNNING
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Target:</span>
                    <a href={`http://${challenge.instance?.endpoint}`} target="_blank" rel="noreferrer" className="text-cyan mono">
                      {challenge.instance?.endpoint}
                    </a>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Sisa Waktu:</span>
                    <span className="text-magenta mono font-bold">{timeLeft}</span>
                  </div>
                </div>
                
                <div className="instance-action-grid">
                  <button className="btn btn-action btn-extend" onClick={() => handleAction('extend')} disabled={loading}>Tambah 5 Menit</button>
                  <button className="btn btn-action btn-reset" onClick={() => handleAction('reset')} disabled={loading}>Reset Factory</button>
                  <button className="btn btn-action btn-stop" onClick={() => handleAction('stop')} disabled={loading}>Hentikan Instance</button>
                  
                  {challenge.is_whitebox && challenge.download_url && (
                    <a href={challenge.download_url} target="_blank" rel="noreferrer" className="btn btn-action btn-download" style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '0.5rem', textDecoration: 'none' }}>
                      Download Source Code
                    </a>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="status-indicator offline mb-2">Instance Tidak Aktif</div>
                <button className="btn btn-primary" style={{width: '100%'}} onClick={() => handleAction('start')} disabled={loading}>
                  {loading ? 'Starting...' : 'Mulai Instance'}
                </button>
              </>
            )}
          </div>

          <div className="submission-box">
            <h4 className="mb-2">Submit Flag</h4>
            <form onSubmit={handleSubmit} className="flag-form">
              <input 
                type="text" 
                className="flag-input mono glass-panel" 
                placeholder="LEEXY{...}" 
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
