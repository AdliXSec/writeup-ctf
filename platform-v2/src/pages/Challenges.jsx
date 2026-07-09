import React, { useState } from 'react';
import ChallengeCard from '../components/ChallengeCard';
import ChallengeModal from '../components/ChallengeModal';
import '../App.css'; // For grid layout

const DUMMY_CHALLENGES = [
  {
    id: 1,
    name: "SQL Injection 101",
    category: "Web",
    points: 150,
    isDynamic: true,
    isHidden: false,
    status: "stopped"
  },
  {
    id: 2,
    name: "Buffer Overflow Basics",
    category: "Pwn",
    points: 400,
    isDynamic: true,
    isHidden: false,
    status: "running"
  },
  {
    id: 3,
    name: "RSA Weak Keys",
    category: "Crypto",
    points: 300,
    isDynamic: false,
    isHidden: false,
    status: "stopped"
  },
  {
    id: 4,
    name: "Admin Panel Bypass",
    category: "Web",
    points: 500,
    isDynamic: true,
    isHidden: true,
    status: "stopped"
  }
];

export default function Challenges() {
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  return (
    <main className="main-content">
      <div className="content-header">
        <h2>Active Challenges</h2>
        <p className="subtitle">Select a target to deploy your instance and capture the flag.</p>
      </div>

      <div className="challenges-grid">
        {DUMMY_CHALLENGES.map(chal => (
          <ChallengeCard 
            key={chal.id} 
            challenge={chal} 
            onClick={setSelectedChallenge}
          />
        ))}
      </div>

      {selectedChallenge && (
        <ChallengeModal 
          challenge={selectedChallenge} 
          onClose={() => setSelectedChallenge(null)} 
        />
      )}
    </main>
  );
}
