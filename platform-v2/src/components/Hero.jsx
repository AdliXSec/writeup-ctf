import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const PHRASES = [
  "0xL33XY CTF",
  "Hack For Fun, Not For Profit"
];

export default function Hero() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    let timer;
    const handleTyping = () => {
      const i = loopNum % PHRASES.length;
      const fullText = PHRASES[i];

      setText(
        isDeleting
          ? fullText.substring(0, text.length - 1)
          : fullText.substring(0, text.length + 1)
      );

      // Typing Speed Logistics
      setTypingSpeed(isDeleting ? 50 : 150);

      // If word is completely typed
      if (!isDeleting && text === fullText) {
        // Pause before deleting
        timer = setTimeout(() => setIsDeleting(true), 2000);
      } 
      // If word is completely deleted
      else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        // Pause before typing next word
        setTypingSpeed(500); 
      } else {
        // Normal typing/deleting tick
        timer = setTimeout(handleTyping, typingSpeed);
      }
    };

    timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, typingSpeed]);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title mono">
          <span className="text-cyan">&gt;_ </span>
          <span className="typewriter-text">{text}</span>
          <span className="cursor">|</span>
        </h1>
        <p className="hero-subtitle">
          Advanced cybersecurity training grounds. Deploy dedicated instances, hunt for vulnerabilities, and climb the global leaderboards.
        </p>
        <div className="hero-actions">
          <Link to="/challenges" className="btn btn-primary glass-panel">Start Hacking</Link>
          <Link to="/scoreboard" className="btn btn-secondary glass-panel">View Scoreboard</Link>
        </div>
      </div>
    </section>
  );
}
