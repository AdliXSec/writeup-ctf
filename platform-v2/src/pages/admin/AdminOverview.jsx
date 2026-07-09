import React from 'react';

export default function AdminOverview() {
  return (
    <div className="admin-overview">
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-card text-center" style={{ marginBottom: 0 }}>
          <div className="text-3xl font-bold text-cyan" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1,337</div>
          <div className="text-muted mono" style={{ fontSize: '0.8rem' }}>TOTAL PLAYERS</div>
        </div>
        <div className="admin-card text-center" style={{ marginBottom: 0, borderColor: 'var(--admin-red)' }}>
          <div className="text-3xl font-bold text-red" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>42</div>
          <div className="text-muted mono" style={{ fontSize: '0.8rem' }}>BANNED</div>
        </div>
        <div className="admin-card text-center" style={{ marginBottom: 0, borderColor: 'var(--accent-emerald)' }}>
          <div className="text-3xl font-bold text-emerald" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#10b981' }}>15</div>
          <div className="text-muted mono" style={{ fontSize: '0.8rem' }}>ACTIVE INSTANCES</div>
        </div>
        <div className="admin-card text-center" style={{ marginBottom: 0, borderColor: 'var(--accent-magenta)' }}>
          <div className="text-3xl font-bold text-magenta" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#d946ef' }}>892</div>
          <div className="text-muted mono" style={{ fontSize: '0.8rem' }}>TOTAL SOLVES</div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">Waktu & Kendali Lomba</h3>
        
        <div className="admin-action-row">
          <button className="btn-admin-action btn-warning">PAUSE GAME</button>
          <button className="btn-admin-action btn-info">FREEZE SCOREBOARD</button>
        </div>

        <form className="admin-form-grid">
          <div>
            <label className="admin-label">Start Time (UTC)</label>
            <input type="datetime-local" className="admin-input" />
          </div>
          <div>
            <label className="admin-label">End Time (UTC)</label>
            <input type="datetime-local" className="admin-input" />
          </div>
          <div>
            <button type="button" className="btn-admin-action btn-full">SIMPAN JADWAL</button>
          </div>
        </form>
      </div>
    </div>
  );
}
