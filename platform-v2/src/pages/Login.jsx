import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

export default function Login() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy login action
    window.location.href = '/challenges';
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
            <div className="terminal-input-group">
              <label htmlFor="username" className="terminal-label">Username:</label>
              <input 
                type="text" 
                id="username" 
                className="terminal-input" 
                placeholder="root"
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
                required 
              />
            </div>

            <button type="submit" className="terminal-submit">
              ./execute_login
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
