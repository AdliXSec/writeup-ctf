import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import './Home.css';

export default function Home() {
  // Dummy countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 35,
    seconds: 50
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) days--;
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
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
            <h3 className="text-center text-magenta font-bold mb-2">Competition Ends In</h3>
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
