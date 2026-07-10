import React, { useState, useEffect } from 'react';
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
              <div className="team-name text-cyan">{top3[1].team}</div>
              <div className="score mono">{top3[1].score}</div>
              <div className="podium-base base-silver">2nd</div>
            </div>
          )}

          {/* Rank 1 */}
          <div className="podium-item rank-1 glass-panel">
            <div className="crown">👑</div>
            <div className="avatar">{top3[0].avatar}</div>
            <div className="team-name text-magenta">{top3[0].team}</div>
            <div className="score mono">{top3[0].score}</div>
            <div className="podium-base base-gold">1st</div>
          </div>

          {/* Rank 3 */}
          {top3.length > 2 && (
            <div className="podium-item rank-3 glass-panel">
              <div className="avatar">{top3[2].avatar}</div>
              <div className="team-name text-cyan">{top3[2].team}</div>
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
