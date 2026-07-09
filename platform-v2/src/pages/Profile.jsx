import React, { useState } from 'react';
import './Profile.css';

const DUMMY_SOLVES = [
  { id: 1, challenge: 'SQL Injection 101', category: 'Web', points: 100, time: '2023-10-27 14:32:01' },
  { id: 2, challenge: 'Buffer Overflow Basics', category: 'Pwn', points: 150, time: '2023-10-27 15:10:45' },
  { id: 3, challenge: 'RSA Weak Keys', category: 'Crypto', points: 200, time: '2023-10-27 16:45:12' },
  { id: 4, challenge: 'Hidden in Plain Sight', category: 'Forensics', points: 50, time: '2023-10-27 17:05:33' },
];

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [affiliation, setAffiliation] = useState('NullSec Syndicate');
  const [email, setEmail] = useState('root@0xl33xy.ctf');

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    // In real scenario, this would send an API request
  };

  return (
    <main className="main-content">
      <div className="content-header">
        <h2>Operator Profile</h2>
        <p className="subtitle">Entity classification and combat records.</p>
      </div>

      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-card glass-panel">
            <div className="avatar-placeholder">
              <span>0x</span>
            </div>
            <h3 className="profile-username text-cyan">0xR00T</h3>
            
            {isEditing ? (
              <form className="edit-profile-form" onSubmit={handleSave}>
                <div className="profile-input-group">
                  <label>Email Address</label>
                  <input type="email" className="profile-input" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="profile-input-group">
                  <label>Affiliation / Team</label>
                  <input type="text" className="profile-input" value={affiliation} onChange={e => setAffiliation(e.target.value)} />
                </div>
                <div className="profile-input-group">
                  <label>New Password</label>
                  <input type="password" className="profile-input" placeholder="Leave blank to keep" />
                </div>
                <div className="edit-actions">
                  <button type="button" className="btn-cancel mono" onClick={() => setIsEditing(false)}>./abort</button>
                  <button type="submit" className="btn-save mono">./save_config</button>
                </div>
              </form>
            ) : (
              <>
                <p className="profile-email mono">{email}</p>
                <p className="profile-affiliation">{affiliation}</p>
                <button className="btn-edit-profile mono" onClick={() => setIsEditing(true)}>./edit_config</button>
                
                <div className="profile-stats">
                  <div className="stat-box">
                    <span className="stat-label">Global Rank</span>
                    <span className="stat-value text-magenta">#1</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Total Poin</span>
                    <span className="stat-value text-emerald">500</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="profile-main">
          <div className="solves-panel glass-panel">
            <h3 className="panel-title mb-2">Riwayat Solve (Recent Exploits)</h3>
            <div className="terminal-body mono">
              {DUMMY_SOLVES.map((solve) => (
                <div key={solve.id} className="solve-line">
                  <span className="solve-time">[{solve.time}]</span>
                  <span className="solve-action"> ROOTED </span>
                  <span className="solve-target">{solve.challenge}</span>
                  <span className="solve-category">[{solve.category}]</span>
                  <span className="solve-points text-emerald">+{solve.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
