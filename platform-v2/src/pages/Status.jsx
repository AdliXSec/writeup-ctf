import React, { useState, useEffect } from 'react';
import './Status.css';

const ATTACKS = [
  { id: 1, time: "13:37:01", team: "0xR00T", target: "SQL Injection 101", status: "SUCCESS" },
  { id: 2, time: "13:37:45", team: "NullSec", target: "Buffer Overflow Basics", status: "FAILED" },
  { id: 3, time: "13:38:12", team: "CyberNinja", target: "RSA Weak Keys", status: "SUCCESS" },
];

export default function Status() {
  const [logs, setLogs] = useState(ATTACKS);

  // Simulate incoming attacks
  useEffect(() => {
    const timer = setInterval(() => {
      const isSuccess = Math.random() > 0.5;
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        team: "Player_" + Math.floor(Math.random() * 1000),
        target: "Challenge_" + Math.floor(Math.random() * 10),
        status: isSuccess ? "SUCCESS" : "FAILED"
      };
      setLogs(prev => [newLog, ...prev].slice(0, 15)); // Keep only last 15 logs
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="status-container">
      <div className="content-header text-center">
        <h2>System Status & Live Intel</h2>
        <p className="subtitle">Real-time monitoring of the CTF infrastructure.</p>
      </div>

      <div className="info-grid mb-2">
        {/* Match Information */}
        <div className="metrics-panel glass-panel">
          <h3 className="panel-title">Match Information</h3>
          <div className="info-row">
            <span className="metric-label">State</span>
            <span className="text-cyan font-bold uppercase">running</span>
          </div>
          <div className="info-row">
            <span className="metric-label">Started At</span>
            <span className="mono text-muted">1/1/1970, 7:00:00 AM</span>
          </div>
          <div className="info-row">
            <span className="metric-label">Accepting Submissions</span>
            <span className="text-emerald font-bold">YES</span>
          </div>
        </div>

        {/* Instance Manager */}
        <div className="metrics-panel glass-panel">
          <h3 className="panel-title">Instance Manager</h3>
          <div className="info-row">
            <span className="metric-label">Manager State</span>
            <span className="text-emerald font-bold uppercase">RUNNING</span>
          </div>
          <div className="info-row">
            <span className="metric-label">Architecture</span>
            <span className="text-cyan font-bold">Dynamic On-Demand</span>
          </div>
          <div className="info-row">
            <span className="metric-label">Mode</span>
            <span className="text-magenta font-bold uppercase">JEOPARDY CTF</span>
          </div>
        </div>
      </div>

      <div className="status-grid">
        {/* Server Metrics */}
        <div className="metrics-panel glass-panel">
          <h3 className="panel-title">Server Metrics</h3>
          <div className="metric-item">
            <span className="metric-label">CPU Load</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '45%' }}></div>
            </div>
            <span className="mono">45%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">RAM Usage</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '78%' }}></div>
            </div>
            <span className="mono">78%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Active Instances</span>
            <span className="mono text-cyan" style={{ fontSize: '1.5rem' }}>42</span>
          </div>
        </div>

        {/* Attacks Feed */}
        <div className="terminal-panel glass-panel">
          <div className="terminal-header">
            <div className="mac-buttons">
              <span></span><span></span><span></span>
            </div>
            <div className="terminal-title">live_attacks.log</div>
          </div>
          <div className="terminal-body mono">
            {logs.map(log => (
              <div key={log.id} className="log-line">
                <div className="log-content">
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-team">{log.team}</span>
                  <span className="log-action"> attacked </span>
                  <span className="log-target">{log.target}</span>
                </div>
                <span className={`log-status ${log.status.toLowerCase()}`}>
                  [{log.status}]
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
