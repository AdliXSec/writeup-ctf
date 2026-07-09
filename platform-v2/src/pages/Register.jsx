import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

export default function Register() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy register action
    window.location.href = '/login';
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
            <div className="terminal-input-group">
              <label htmlFor="username" className="terminal-label">Username:</label>
              <input 
                type="text" 
                id="username" 
                className="terminal-input" 
                placeholder="hacker1337" 
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
              ./generate_token
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
