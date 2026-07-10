import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import './Profile.css';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({ username: '', email: '', website: '', affiliation: '', country: '' });
  const [password, setPassword] = useState('');
  
  const [rank, setRank] = useState('-');
  const [score, setScore] = useState(0);
  const [solves, setSolves] = useState([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    fetchProfileData();
    
    // Pause auto-refresh if user is currently typing/editing to prevent overwriting inputs
    if (isEditing) return;
    
    const timer = setInterval(fetchProfileData, 10000);
    return () => clearInterval(timer);
  }, [isEditing]);

  const fetchProfileData = async () => {
    try {
      const sessionRes = await api.get('/session');
      const user = sessionRes.data;
      setUserData({
        username: user.name || '',
        email: user.email || '',
        website: user.website || '',
        affiliation: user.affiliation || '',
        country: user.country || ''
      });

      // Try to fetch scoreboard to get rank & score
      try {
        const scoreboardRes = await api.get('/scoreboard');
        const myRank = scoreboardRes.data.find(s => s.team === user.name);
        if (myRank) {
          setRank(myRank.rank);
          setScore(myRank.total);
        }
      } catch (e) {
        console.error("Scoreboard fetch failed");
      }

      // Try to fetch attacks to filter own solves
      try {
        const attacksRes = await api.get('/attacks');
        const mySolves = attacksRes.data.items.filter(item => item.attacker === user.name);
        setSolves(mySolves);
      } catch (e) {
        console.error("Attacks fetch failed");
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: userData.username,
        email: userData.email,
        website: userData.website,
        affiliation: userData.affiliation,
        country: userData.country
      };
      if (password) payload.password = password;

      await api.patch('/profile', payload);
      toast.success('Profil berhasil diperbarui!');
      setIsEditing(false);
      setPassword('');
      fetchProfileData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyimpan profil.");
    }
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
            <h3 className="profile-username text-cyan">{userData.username || 'OPERATOR'}</h3>
            
            {isEditing ? (
              <form className="edit-profile-form" onSubmit={handleSave}>
                <div className="profile-input-group">
                  <label>Username</label>
                  <input type="text" className="profile-input" value={userData.username} onChange={e => setUserData({...userData, username: e.target.value})} required />
                </div>
                <div className="profile-input-group">
                  <label>Email Address</label>
                  <input type="email" className="profile-input" value={userData.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
                <div className="profile-input-group">
                  <label>Website</label>
                  <input type="text" className="profile-input" value={userData.website} onChange={e => setUserData({...userData, website: e.target.value})} />
                </div>
                <div className="profile-input-group">
                  <label>Affiliation / Team</label>
                  <input type="text" className="profile-input" value={userData.affiliation} onChange={e => setUserData({...userData, affiliation: e.target.value})} />
                </div>
                <div className="profile-input-group">
                  <label>Country</label>
                  <input type="text" className="profile-input" value={userData.country} onChange={e => setUserData({...userData, country: e.target.value})} />
                </div>
                <div className="profile-input-group">
                  <label>New Password</label>
                  <input type="password" className="profile-input" placeholder="Leave blank to keep" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="edit-actions">
                  <button type="button" className="btn-cancel mono" onClick={() => setIsEditing(false)}>./abort</button>
                  <button type="submit" className="btn-save mono">./save_config</button>
                </div>
              </form>
            ) : (
              <>
                <p className="profile-email mono">{userData.email}</p>
                <p className="profile-affiliation">{userData.affiliation || 'Unknown Affiliation'}</p>
                <button className="btn-edit-profile mono" onClick={() => setIsEditing(true)}>./edit_config</button>
                
                <div className="profile-stats">
                  <div className="stat-box">
                    <span className="stat-label">Global Rank</span>
                    <span className="stat-value text-magenta">#{rank}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Total Poin</span>
                    <span className="stat-value text-emerald">{score}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="profile-main">
          <div className="solves-panel glass-panel">
            <h3 className="panel-title mb-2">Riwayat Solve (Recent Exploits)</h3>
            <div className="terminal-body mono" style={{ minHeight: '200px' }}>
              {loading ? (
                <div className="text-muted text-center" style={{ paddingTop: '2rem' }}>./memuat_log...</div>
              ) : solves.length === 0 ? (
                <div className="text-muted text-center" style={{ paddingTop: '2rem' }}>Belum ada eksploit yang berhasil diretas.</div>
              ) : (
                solves.map((solve) => {
                  const timeStr = solve.solved_at ? new Date(solve.solved_at + 'Z').toLocaleTimeString('en-US', { hour12: false }) : '00:00:00';
                  return (
                    <div key={solve.id} className="solve-line">
                      <span className="solve-time">[{timeStr}]</span>
                      <span className="solve-action"> ROOTED </span>
                      <span className="solve-target">Challenge #{solve.service}</span>
                      <span className="solve-points text-emerald">[SUCCESS]</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
