import React from 'react';
import './ChallengeCard.css';

export default function ChallengeCard({ challenge, onClick }) {
  const isRunning = challenge.status === 'running';

  return (
    <div className={`challenge-card glass-panel ${challenge.isHidden ? 'disabled' : ''}`} onClick={() => onClick(challenge)}>
      <div className="card-header">
        <div className="title-group">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="category-badge">{challenge.category}</span>
            <span style={{
              padding: '2px 8px', borderRadius: '4px', fontSize: '0.7em', fontWeight: 'bold', textTransform: 'uppercase',
              backgroundColor: challenge.level === 'Easy' ? 'rgba(16, 185, 129, 0.2)' : challenge.level === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : challenge.level === 'Hard' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              color: challenge.level === 'Easy' ? '#10b981' : challenge.level === 'Medium' ? '#f59e0b' : challenge.level === 'Hard' ? '#ef4444' : '#8b5cf6',
              border: `1px solid ${challenge.level === 'Easy' ? '#10b981' : challenge.level === 'Medium' ? '#f59e0b' : challenge.level === 'Hard' ? '#ef4444' : '#8b5cf6'}`
            }}>
              {challenge.level || 'Easy'}
            </span>
          </div>
          <h3>
            {challenge.name}
            {challenge.isHidden && <span className="hidden-badge">DISABLED</span>}
          </h3>
        </div>
        <div className="points-display">
          <span className="mono points-val">{challenge.points} pts</span>
          {challenge.isDynamic && <div className="dynamic-badge" title="Dynamic Scoring">📉 DYNAMIC</div>}
        </div>
      </div>
      
      <div className="card-footer">
        {isRunning ? (
          <div className="status-indicator running">
            <span className="pulse-dot"></span> RUNNING
          </div>
        ) : (
          <div className="status-indicator offline">OFFLINE</div>
        )}
        
        <div className="action-hint">Buka &rarr;</div>
      </div>
    </div>
  );
}
