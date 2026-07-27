import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import api from '../utils/api';
import './Home.css';

export default function Home() {
  const [timerTitle, setTimerTitle] = useState('Competition Status');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    let interval;
    const fetchStatus = async () => {
      try {
        const res = await api.get('/game/status');
        const match = res.data.match;
        
        // Backend returns "YYYY-MM-DD HH:MM:SS" in UTC. Append Z to parse correctly.
        const startTimeStr = match.started_at ? match.started_at.replace(' ', 'T') + 'Z' : null;
        const endTimeStr = match.end_time ? match.end_time.replace(' ', 'T') + 'Z' : null;

        const startTime = startTimeStr ? new Date(startTimeStr).getTime() : null;
        const endTime = endTimeStr ? new Date(endTimeStr).getTime() : null;

        interval = setInterval(() => {
          const now = new Date().getTime();
          let target = null;

          if (startTime && now < startTime) {
            setTimerTitle('Competition Starts In');
            target = startTime;
          } else if (endTime && now < endTime) {
            setTimerTitle('Competition Ends In');
            target = endTime;
          } else if (endTime && now >= endTime) {
            setTimerTitle('Competition Has Ended');
            target = null;
          } else if (startTime && !endTime) {
            setTimerTitle('Competition Is Live');
            target = null;
          } else {
            setTimerTitle('Schedule TBA');
            target = null;
          }

          if (target) {
            const distance = target - now;
            setTimeLeft({
              days: Math.floor(distance / (1000 * 60 * 60 * 24)),
              hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
          } else {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          }
        }, 1000);
      } catch (err) {
        console.error("Failed to fetch game status", err);
      }
    };
    
    fetchStatus();
    return () => { if (interval) clearInterval(interval); };
  }, []);

  return (
    <div className="home-container">
      <Hero />
      
      {/* About Section */}
      <section className="about-section">
        <h2 className="section-title">Mission Briefing</h2>
        <div className="about-box glass-panel">
          <div className="about-header">
            <span className="dot bg-red"></span>
            <span className="dot bg-yellow"></span>
            <span className="dot bg-green"></span>
            <span className="about-title mono text-muted">root@0xl33xy:~# cat about.txt</span>
          </div>
          <div className="about-body">
            <p className="mono">
              <span className="text-cyan">&gt;</span> Welcome to the ultimate cybersecurity proving ground. 0xL33XY CTF is designed to test your mettle in real-world exploitation scenarios, ranging from web application vulnerabilities to binary exploitation and cryptography.
            </p>
            <br />
            <p className="mono">
              <span className="text-magenta">&gt;</span> Unlike traditional Jeopardy CTFs, our platform utilizes an advanced on-demand instance architecture. Every challenge provides an isolated, dynamic environment dedicated entirely to your team, ensuring a noise-free hacking experience.
            </p>
            <br />
            <p className="mono">
              <span className="text-emerald">&gt;</span> Good luck, and hack the planet. <span className="cursor" style={{fontWeight: 700}}>|</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Platform Features</h2>
        <div className="features-grid">
          <div className="feature-card glass-panel">
            <span className="feature-icon">⚡</span>
            <h3 className="text-cyan">Dynamic Instances</h3>
            <p>Spin up isolated Docker containers for each challenge. Say goodbye to shared target interference and unstable services.</p>
          </div>
          <div className="feature-card glass-panel">
            <span className="feature-icon">📦</span>
            <h3 className="text-magenta">Whitebox Capable</h3>
            <p>Download the exact source code running on the server. Analyze, find the 0-day, and exploit it before your competitors.</p>
          </div>
          <div className="feature-card glass-panel">
            <span className="feature-icon">🏆</span>
            <h3 className="text-cyan">Real-time Analytics</h3>
            <p>Monitor your position on the global leaderboard and watch the live attacks feed as other hackers compromise the infrastructure.</p>
          </div>
        </div>
      </section>

      {/* Event Info Section (Rules & Time) */}
      <section className="event-info-section">
        <div className="event-info-grid">
          
          {/* Countdown Timer */}
          <div className="time-section glass-panel">
            <h3 className="text-center text-magenta font-bold mb-2">{timerTitle}</h3>
            <div className="countdown-wrapper mono">
              <div className="countdown-box">
                <span className="countdown-val">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="countdown-label">Days</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-val">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-val">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="countdown-label">Mins</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-val">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="countdown-label">Secs</span>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="rules-section glass-panel">
            <h3 className="text-cyan font-bold mb-2">Rules of Engagement</h3>
            <ul className="rules-list">
              <li>Do not attack the CTF infrastructure or platform. Only attack the designated challenge instances.</li>
              <li>Do not perform Denial of Service (DoS) attacks or brute-force the flag submission endpoint.</li>
              <li>Flag sharing between teams is strictly prohibited and will result in an immediate ban.</li>
              <li>All flags follow the standard format: <code>L33XY{"{"}flag_content{"}"}</code>.</li>
            </ul>
          </div>

        </div>
      </section>
      
    </div>
  );
}
