import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import './Profile.css'; // Reusing profile styles

export default function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/users/${username}`);
        setProfile(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Operator not found or classified as HIDDEN.");
        } else {
          setError("Gagal memuat data operator.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <main className="main-content">
        <div className="mono text-muted text-center" style={{ padding: '4rem' }}>
          ./tracing_operator_data...
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="main-content">
        <div className="content-header">
          <h2>Access Denied</h2>
          <p className="subtitle text-red">{error}</p>
        </div>
        <div className="text-center" style={{ marginTop: '2rem' }}>
          <Link to="/scoreboard" className="btn-primary">Return to Scoreboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <div className="content-header">
        <h2>Public Profile</h2>
        <p className="subtitle">Public combat records for operator: {profile.username}</p>
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-card glass-panel">
            <div className="avatar-placeholder">
              <span>0x</span>
            </div>
            <h3 className="profile-name text-magenta" style={{ marginBottom: '1.5rem' }}>{profile.username}</h3>
            
            <div className="profile-stats">
              <div className="stat-box">
                <span className="stat-label">Rank</span>
                <span className="stat-value text-cyan">#{profile.rank}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Score</span>
                <span className="stat-value mono">{profile.score}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-card glass-panel" style={{ marginTop: '1.5rem', textAlign: 'left', padding: '1.5rem' }}>
            <h3 className="panel-title mb-2 text-cyan">Intel Data</h3>
            <div className="profile-input-group">
              <label>Country</label>
              <div className="profile-input" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {profile.country || '-'}
              </div>
            </div>
            
            <div className="profile-input-group">
              <label>Affiliation</label>
              <div className="profile-input" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {profile.affiliation || '-'}
              </div>
            </div>
            
            <div className="profile-input-group mb-0">
              <label>Website</label>
              <div className="profile-input" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {profile.website ? (
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-cyan font-bold" style={{ textDecoration: 'none' }}>
                    {profile.website}
                  </a>
                ) : <span className="text-muted">-</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-main">
          <div className="solves-panel glass-panel">
            <h3 className="panel-title mb-2">Combat Records</h3>
            <div className="terminal-body mono" style={{ minHeight: '200px' }}>
              {profile.solves && profile.solves.length > 0 ? (
                profile.solves.map((solve, idx) => {
                  const timeStr = solve.solved_at ? new Date(solve.solved_at + 'Z').toLocaleString('en-US', { hour12: false }) : '00:00:00';
                  return (
                    <div key={idx} className="solve-line">
                      <span className="solve-time text-muted">[{timeStr}]</span>
                      <span className="solve-action"> ROOTED </span>
                      <span className="solve-target text-cyan font-bold">{solve.challenge}</span>
                      <span className="solve-points text-emerald">+{solve.points} pts</span>
                      {solve.is_first_blood && (
                        <span className="text-magenta font-bold" style={{ marginLeft: '1rem', flexShrink: 0, width: '100px', textAlign: 'right' }}>
                          {solve.blood_tier === 1 ? '🩸 1ST' : solve.blood_tier === 2 ? '🥈 2ND' : '🥉 3RD'}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="mono text-muted text-center" style={{ paddingTop: '2rem' }}>
                  No challenges solved yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
