import React from 'react';
import './ChallengeCard.css';

export default function ChallengeCard({ challenge, onClick }) {
  const isRunning = challenge.status === 'running';

  return (
    <div className={`challenge-card glass-panel ${challenge.isHidden ? 'disabled' : ''}`} onClick={() => onClick(challenge)}>
      <div className="card-header">
        <div className="title-group">
          <span className="category-badge">{challenge.category}</span>
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
