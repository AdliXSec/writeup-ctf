import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import '../../layouts/Admin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/admin/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('ctf_token', response.data.token);
        navigate('/admin');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("SYSTEM FAILURE: CONNECTION REJECTED");
      }
    } finally {
      setIsLoading(false);
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
          {error && (
            <div style={{ color: 'var(--admin-red)', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', border: '1px solid var(--admin-red)', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)' }}>
              [!] {error}
            </div>
          )}
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

          <button type="submit" className="btn-admin-action btn-full" style={{ marginTop: '1rem', padding: '1rem' }} disabled={isLoading}>
            {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
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
