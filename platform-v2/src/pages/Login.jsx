import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/authenticate', { email, password });
      if (response.data.token) {
        localStorage.setItem('ctf_token', response.data.token);
        toast.success('Koneksi berhasil. Selamat datang!');
        // Bisa diredirect ke dashboard / challenges
        navigate('/challenges');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Connection failed. Backend might be unreachable.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="terminal-auth-box">
        <div className="terminal-auth-header">
          <span className="dot bg-red"></span>
          <span className="dot bg-yellow"></span>
          <span className="dot bg-green"></span>
          <span className="terminal-auth-title mono">root@0xl33xy:~# ./auth.sh --mode login</span>
        </div>
        
        <div className="terminal-auth-body mono">
          <div className="terminal-line">
            <span className="terminal-prompt">&gt;</span> 
            Initiating secure connection... [OK]
            <br />
            <span className="terminal-prompt">&gt;</span> 
            Enter credentials to access mainframe:
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="terminal-line" style={{ color: '#ef4444', marginBottom: '1rem' }}>
                <span className="terminal-prompt" style={{ color: '#ef4444' }}>!</span> {error}
              </div>
            )}
            <div className="terminal-input-group">
              <label htmlFor="email" className="terminal-label">Email:</label>
              <input 
                type="email" 
                id="email" 
                className="terminal-input" 
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required 
              />
            </div>
            
            <div className="terminal-input-group">
              <label htmlFor="password" className="terminal-label">Password:</label>
              <input 
                type="password" 
                id="password" 
                className="terminal-input" 
                placeholder="********" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="terminal-submit" disabled={isLoading}>
              {isLoading ? './authenticating...' : './execute_login'}
            </button>
          </form>

          <div className="auth-footer">
            No access token? <Link to="/register" className="auth-link">./request_access</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
