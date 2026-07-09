import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './Scoreboard.css';

const LEADERBOARD_DATA = [
  { rank: 1, team: "0xR00T", score: 14500, avatar: "🔥" },
  { rank: 2, team: "CyberNinja", score: 13200, avatar: "🥷" },
  { rank: 3, team: "ByteMe", score: 12800, avatar: "💀" },
  { rank: 4, team: "PwnHub", score: 11000, avatar: "💻" },
  { rank: 5, team: "NullSec", score: 9500, avatar: "🛡️" },
  { rank: 6, team: "Noobs", score: 8000, avatar: "👶" },
];

// Dummy data for progression graph
const CHART_DATA = [
  { time: '10:00', '0xR00T': 2000, 'CyberNinja': 1500, 'ByteMe': 1800, 'PwnHub': 1000, 'NullSec': 800, 'Noobs': 500 },
  { time: '11:00', '0xR00T': 4500, 'CyberNinja': 3200, 'ByteMe': 3000, 'PwnHub': 2200, 'NullSec': 1500, 'Noobs': 1000 },
  { time: '12:00', '0xR00T': 6000, 'CyberNinja': 5500, 'ByteMe': 4200, 'PwnHub': 3800, 'NullSec': 2500, 'Noobs': 2000 },
  { time: '13:00', '0xR00T': 8500, 'CyberNinja': 7800, 'ByteMe': 6000, 'PwnHub': 5500, 'NullSec': 4200, 'Noobs': 3500 },
  { time: '14:00', '0xR00T': 11000, 'CyberNinja': 10500, 'ByteMe': 9500, 'PwnHub': 7500, 'NullSec': 6000, 'Noobs': 5200 },
  { time: '15:00', '0xR00T': 13000, 'CyberNinja': 12000, 'ByteMe': 11500, 'PwnHub': 9000, 'NullSec': 7800, 'Noobs': 6500 },
  { time: '16:00', '0xR00T': 14500, 'CyberNinja': 13200, 'ByteMe': 12800, 'PwnHub': 11000, 'NullSec': 9500, 'Noobs': 8000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip glass-panel">
        <p className="label mono text-muted mb-2">{`Time: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="intro font-bold mono" style={{ color: entry.color }}>
            {`${entry.name} : ${entry.value} pts`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Scoreboard() {
  const top3 = LEADERBOARD_DATA.slice(0, 3);
  const others = LEADERBOARD_DATA.slice(3);

  return (
    <div className="scoreboard-container">
      <div className="content-header text-center">
        <h2>Global Scoreboard</h2>
        <p className="subtitle">The elite hackers who dominated the cyberspace.</p>
      </div>

      {/* Podium Section */}
      <div className="podium-container">
        {/* Rank 2 */}
        <div className="podium-item rank-2 glass-panel">
          <div className="avatar">{top3[1].avatar}</div>
          <div className="team-name text-cyan">{top3[1].team}</div>
          <div className="score mono">{top3[1].score}</div>
          <div className="podium-base base-silver">2nd</div>
        </div>

        {/* Rank 1 */}
        <div className="podium-item rank-1 glass-panel">
          <div className="crown">👑</div>
          <div className="avatar">{top3[0].avatar}</div>
          <div className="team-name text-magenta">{top3[0].team}</div>
          <div className="score mono">{top3[0].score}</div>
          <div className="podium-base base-gold">1st</div>
        </div>

        {/* Rank 3 */}
        <div className="podium-item rank-3 glass-panel">
          <div className="avatar">{top3[2].avatar}</div>
          <div className="team-name text-cyan">{top3[2].team}</div>
          <div className="score mono">{top3[2].score}</div>
          <div className="podium-base base-bronze">3rd</div>
        </div>
      </div>

      {/* Line Chart Section */}
      <div className="chart-wrapper glass-panel mb-2">
        <h3 className="chart-title">Global Score Progression</h3>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <LineChart
              data={CHART_DATA}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              <Line 
                type="monotone" 
                dataKey="0xR00T" 
                stroke="var(--accent-magenta)" 
                strokeWidth={3} 
                dot={{ fill: 'var(--bg-dark)', stroke: 'var(--accent-magenta)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 8, stroke: 'var(--accent-magenta)', strokeWidth: 2 }} 
                animationDuration={2000}
              />
              <Line 
                type="monotone" 
                dataKey="CyberNinja" 
                stroke="var(--accent-cyan)" 
                strokeWidth={3}
                dot={{ fill: 'var(--bg-dark)', stroke: 'var(--accent-cyan)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 8, stroke: 'var(--accent-cyan)', strokeWidth: 2 }}
                animationDuration={2000}
              />
              <Line 
                type="monotone" 
                dataKey="ByteMe" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: 'var(--bg-dark)', stroke: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
                animationDuration={2000}
              />
              <Line 
                type="monotone" 
                dataKey="PwnHub" 
                stroke="#eab308" 
                strokeWidth={2}
                dot={{ fill: 'var(--bg-dark)', stroke: '#eab308', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, stroke: '#eab308', strokeWidth: 2 }}
                animationDuration={2000}
              />
              <Line 
                type="monotone" 
                dataKey="NullSec" 
                stroke="#f43f5e" 
                strokeWidth={2}
                dot={{ fill: 'var(--bg-dark)', stroke: '#f43f5e', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, stroke: '#f43f5e', strokeWidth: 2 }}
                animationDuration={2000}
              />
              <Line 
                type="monotone" 
                dataKey="Noobs" 
                stroke="#64748b" 
                strokeWidth={2}
                dot={{ fill: 'var(--bg-dark)', stroke: '#64748b', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, stroke: '#64748b', strokeWidth: 2 }}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="leaderboard-table-wrapper glass-panel">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th className="text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {others.map((team) => (
              <tr key={team.rank}>
                <td className="mono text-muted">#{team.rank}</td>
                <td>
                  <span className="team-avatar">{team.avatar}</span>
                  {team.team}
                </td>
                <td className="text-right mono text-cyan">{team.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
