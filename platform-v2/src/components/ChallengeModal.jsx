import React, { useState } from 'react';
import './ChallengeModal.css';

export default function ChallengeModal({ challenge, onClose }) {
  const [flag, setFlag] = useState('');
  
  if (!challenge) return null;

  const isRunning = challenge.status === 'running';

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Flag submitted: ${flag}`);
    setFlag('');
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
            <p className="text-muted">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
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
                    <a href="http://localhost:10207" target="_blank" rel="noreferrer" className="text-cyan mono">localhost:10207</a>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Sisa Waktu:</span>
                    <span className="text-magenta mono font-bold">9m 43s</span>
                  </div>
                </div>
                
                <div className="instance-action-grid">
                  <button className="btn btn-action btn-extend">Tambah 5 Menit</button>
                  <button className="btn btn-action btn-reset">Reset Factory</button>
                  <button className="btn btn-action btn-stop">Hentikan Instance</button>
                </div>
              </>
            ) : (
              <>
                <div className="status-indicator offline mb-2">Instance Tidak Aktif</div>
                <button className="btn btn-primary" style={{width: '100%'}}>Mulai Instance</button>
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
              <button type="submit" className="btn btn-primary">Submit</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
