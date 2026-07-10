import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
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
      await api.post('/register', { username, email, password });
      
      // Auto-login or redirect to login after successful registration
      toast.success('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Connection failed. Backend might be unreachable.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="terminal-auth-box register-mode">
        <div className="terminal-auth-header">
          <span className="dot bg-red"></span>
          <span className="dot bg-yellow"></span>
          <span className="dot bg-green"></span>
          <span className="terminal-auth-title mono">root@0xl33xy:~# ./auth.sh --mode register</span>
        </div>
        
        <div className="terminal-auth-body mono">
          <div className="terminal-line">
            <span className="terminal-prompt magenta">&gt;</span> 
            Initializing new entity registration... [OK]
            <br />
            <span className="terminal-prompt magenta">&gt;</span> 
            Provide details to generate access token:
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="terminal-line" style={{ color: '#ef4444', marginBottom: '1rem' }}>
                <span className="terminal-prompt" style={{ color: '#ef4444' }}>!</span> {error}
              </div>
            )}
            
            <div className="terminal-input-group">
              <label htmlFor="username" className="terminal-label">Username:</label>
              <input 
                type="text" 
                id="username" 
                className="terminal-input" 
                placeholder="hacker1337" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off"
                required 
              />
            </div>

            <div className="terminal-input-group">
              <label htmlFor="email" className="terminal-label">Email:</label>
              <input 
                type="email" 
                id="email" 
                className="terminal-input" 
                placeholder="hacker@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="terminal-input-group">
              <label htmlFor="affiliation" className="terminal-label">Affiliation:</label>
              <input 
                type="text" 
                id="affiliation" 
                className="terminal-input" 
                placeholder="(Optional)" 
                value={affiliation}
                onChange={e => setAffiliation(e.target.value)}
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
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="terminal-submit" disabled={isLoading}>
              {isLoading ? './generating...' : './generate_token'}
            </button>
          </form>

          <div className="auth-footer">
            Entity already exists? <Link to="/login" className="auth-link">./execute_login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
