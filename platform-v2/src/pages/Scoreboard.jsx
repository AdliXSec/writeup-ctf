import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Scoreboard.css';





export default function Scoreboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScoreboard();
    const timer = setInterval(fetchScoreboard, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchScoreboard = async () => {
    try {
      const response = await api.get('/scoreboard');
      // Format backend response: "total" -> "score"
      const formatted = response.data.map(item => ({
        rank: item.rank,
        team: item.team,
        score: item.total,
        country: item.country || '-',
        affiliation: item.affiliation || '-',
        avatar: "💻" // Generic avatar for now
      }));
      setLeaderboard(formatted);
    } catch (error) {
      console.error("Failed to fetch scoreboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  return (
    <div className="scoreboard-container">
      <div className="content-header text-center">
        <h2>Global Scoreboard</h2>
        <p className="subtitle">The elite hackers who dominated the cyberspace.</p>
      </div>

      {/* Podium Section */}
      {loading ? (
        <div className="mono text-muted text-center" style={{ margin: '3rem 0' }}>./fetching_scores...</div>
      ) : top3.length > 0 ? (
        <div className="podium-container">
          {/* Rank 2 */}
          {top3.length > 1 && (
            <div className="podium-item rank-2 glass-panel">
              <div className="avatar">{top3[1].avatar}</div>
              <div className="team-name text-cyan">
                <Link to={`/player/${top3[1].team}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {top3[1].team}
                </Link>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{top3[1].country} • {top3[1].affiliation}</div>
              <div className="score mono">{top3[1].score}</div>
              <div className="podium-base base-silver">2nd</div>
            </div>
          )}

          {/* Rank 1 */}
          <div className="podium-item rank-1 glass-panel">
            <div className="crown">👑</div>
            <div className="avatar">{top3[0].avatar}</div>
            <div className="team-name text-magenta">
              <Link to={`/player/${top3[0].team}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                {top3[0].team}
              </Link>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{top3[0].country} • {top3[0].affiliation}</div>
            <div className="score mono">{top3[0].score}</div>
            <div className="podium-base base-gold">1st</div>
          </div>

          {/* Rank 3 */}
          {top3.length > 2 && (
            <div className="podium-item rank-3 glass-panel">
              <div className="avatar">{top3[2].avatar}</div>
              <div className="team-name text-cyan">
                <Link to={`/player/${top3[2].team}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {top3[2].team}
                </Link>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{top3[2].country} • {top3[2].affiliation}</div>
              <div className="score mono">{top3[2].score}</div>
              <div className="podium-base base-bronze">3rd</div>
            </div>
          )}
        </div>
      ) : (
        <div className="mono text-muted text-center" style={{ margin: '3rem 0' }}>Belum ada skor yang dicetak.</div>
      )}



      {/* Table Section */}
      <div className="leaderboard-table-wrapper glass-panel">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Country</th>
              <th>Affiliation</th>
              <th className="text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {others.map((team) => (
              <tr key={team.rank}>
                <td className="mono text-muted">#{team.rank}</td>
                <td>
                  <span className="team-avatar">{team.avatar}</span>
                  <Link to={`/player/${team.team}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }} className="text-cyan">
                    {team.team}
                  </Link>
                </td>
                <td>{team.country}</td>
                <td>{team.affiliation}</td>
                <td className="text-right mono font-bold text-magenta">{team.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
