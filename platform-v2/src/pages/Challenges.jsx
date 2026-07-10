import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ChallengeCard from '../components/ChallengeCard';
import ChallengeModal from '../components/ChallengeModal';
import '../App.css'; 

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChallenges();
    const timer = setInterval(fetchChallenges, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await api.get('/challenges');
      // Format response to match UI expectations
      const formattedData = response.data.map(chal => ({
        ...chal,
        isDynamic: chal.is_dynamic,
        isHidden: chal.is_hidden,
        status: chal.instance?.status || 'stopped'
      }));
      setChallenges(formattedData);
      
      setSelectedChallenge(prev => {
        if (!prev) return null;
        return formattedData.find(c => c.id === prev.id) || prev;
      });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.error || "Gagal memuat tantangan dari server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-content">
      <div className="content-header">
        <h2>Active Challenges</h2>
        <p className="subtitle">Select a target to deploy your instance and capture the flag.</p>
      </div>

      <div className="challenges-grid">
        {loading ? (
          <div className="mono text-muted text-center" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
            ./memuat_modul_tantangan...
          </div>
        ) : error ? (
          <div className="mono text-center" style={{ gridColumn: '1 / -1', padding: '2rem', color: 'var(--admin-red)' }}>
            [!] {error}
          </div>
        ) : challenges.length === 0 ? (
          <div className="mono text-muted text-center" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
            Tidak ada tantangan yang tersedia.
          </div>
        ) : (
          challenges.map(chal => (
            <ChallengeCard 
              key={chal.id} 
              challenge={chal} 
              onClick={setSelectedChallenge}
            />
          ))
        )}
      </div>

      {selectedChallenge && (
        <ChallengeModal 
          challenge={selectedChallenge} 
          onClose={() => setSelectedChallenge(null)} 
          onRefresh={fetchChallenges}
        />
      )}
    </main>
  );
}
