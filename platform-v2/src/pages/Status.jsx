import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './Status.css';

export default function Status() {
  const [logs, setLogs] = useState([]);
  const [gameStatus, setGameStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statusRes, attacksRes] = await Promise.all([
        api.get('/game/status'),
        api.get('/attacks')
      ]);
      setGameStatus(statusRes.data);
      setLogs(attacksRes.data.items || []);
    } catch (err) {
      console.error("Failed to fetch status data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 10000); // Polling every 10s
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
          {gameStatus ? (
            <>
              <div className="info-row">
                <span className="metric-label">State</span>
                <span className="text-cyan font-bold uppercase">{gameStatus.match?.state}</span>
              </div>
              <div className="info-row">
                <span className="metric-label">Started At</span>
                <span className="mono text-muted">{gameStatus.match?.started_at || "Not Started"}</span>
              </div>
              <div className="info-row">
                <span className="metric-label">Accepting Submissions</span>
                <span className={`font-bold ${gameStatus.match?.accepting_submissions ? 'text-emerald' : 'text-red'}`}>
                  {gameStatus.match?.accepting_submissions ? 'YES' : 'NO'}
                </span>
              </div>
            </>
          ) : (
            <div className="mono text-muted">./fetching...</div>
          )}
        </div>

        {/* Instance Manager */}
        <div className="metrics-panel glass-panel">
          <h3 className="panel-title">Instance Manager</h3>
          {gameStatus ? (
            <>
              <div className="info-row">
                <span className="metric-label">Manager State</span>
                <span className="text-emerald font-bold uppercase">{gameStatus.scheduler?.state}</span>
              </div>
              <div className="info-row">
                <span className="metric-label">Architecture</span>
                <span className="text-cyan font-bold">Dynamic On-Demand</span>
              </div>
              <div className="info-row">
                <span className="metric-label">Mode</span>
                <span className="text-magenta font-bold uppercase">JEOPARDY CTF</span>
              </div>
            </>
          ) : (
            <div className="mono text-muted">./fetching...</div>
          )}
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
            {logs.map(log => {
              // Extract time from solved_at
              const timeStr = log.solved_at ? new Date(log.solved_at + 'Z').toLocaleTimeString('en-US', { hour12: false }) : '00:00:00';
              return (
                <div key={log.id} className="log-line">
                  <div className="log-content">
                    <span className="log-time">[{timeStr}]</span>
                    <span className="log-team">{log.attacker}</span>
                    <span className="log-action"> compromised </span>
                    <span className="log-target">Challenge #{log.service}</span>
                  </div>
                  <span className="log-status success">
                    [SUCCESS]
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
