import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../layouts/Admin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = (e) => {
    e.preventDefault();
    // Simulasi login admin
    if(username === 'admin' && password === 'admin') {
      navigate('/admin');
    } else {
      alert("ROOT ACCESS DENIED");
    }
  };

  return (
    <div className="admin-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Background elements */}
      <div className="admin-bg-grid"></div>
      <div className="admin-bg-glow" style={{ top: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px' }}></div>

      <div className="admin-card" style={{ width: '100%', maxWidth: '400px', margin: '0 1rem', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="admin-brand mono text-red" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            &gt;_ ROOT<span className="blink-cursor">|</span>
          </div>
          <p className="text-muted mono" style={{ fontSize: '0.85rem' }}>RESTRICTED SYSTEM ACCESS</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="admin-label mono">Username</label>
            <input 
              type="text" 
              className="admin-input" 
              placeholder="root_admin" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          
          <div>
            <label className="admin-label mono">Password</label>
            <input 
              type="password" 
              className="admin-input" 
              placeholder="••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-admin-action btn-full" style={{ marginTop: '1rem', padding: '1rem' }}>
            AUTHENTICATE
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            type="button" 
            className="btn-admin-return mono" 
            style={{ width: '100%', border: 'none' }}
            onClick={() => navigate('/')}
          >
            ← RETURN TO PUBLIC
          </button>
        </div>
      </div>
    </div>
  );
}
