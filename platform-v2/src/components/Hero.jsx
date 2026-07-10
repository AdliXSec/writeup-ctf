import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const PHRASES = [
  "0xL33XY CTF",
  "Hack For Fun, Not For Profit"
];

const HACKING_SCENARIO = [
  { text: "operator@leexy:~$ nmap -p- -sV 10.10.13.37", delay: 800 },
  { text: "Starting Nmap 7.93 ( https://nmap.org )", delay: 500 },
  { text: "PORT     STATE SERVICE    VERSION", delay: 200 },
  { text: "80/tcp   open  http       nginx 1.18.0", delay: 200 },
  { text: "1337/tcp open  tcpwrapped", delay: 800 },
  { text: "operator@leexy:~$ ./0day_exploit.py --target 10.10.13.37:1337", delay: 1200 },
  { text: "[*] Initializing buffer overflow sequence...", delay: 600 },
  { text: "[*] Sending padding (1024 bytes)...", delay: 400 },
  { text: "[*] Overwriting EIP with 0x080484b6...", delay: 500 },
  { text: "[+] Shellcode injected successfully!", delay: 300 },
  { text: "[*] Spawning root shell...", delay: 800 },
  { text: "root@target:~# whoami", delay: 500 },
  { text: "root", delay: 300 },
  { text: "root@target:~# cat /root/flag.txt", delay: 600 },
  { text: "LEEXY{b0f_m4st3r_0v3rfl0w_pwn3d}", delay: 4000 }
];

export default function Hero() {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [visibleLines, setVisibleLines] = useState(0);
  const [showClear, setShowClear] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const animateTerminal = (currentLine) => {
      if (!isMounted) return;

      if (currentLine < HACKING_SCENARIO.length) {
        setShowClear(false);
        setVisibleLines(currentLine + 1);
        timeoutId = setTimeout(() => animateTerminal(currentLine + 1), HACKING_SCENARIO[currentLine].delay);
      } else {
        // Animation finished, wait 5s then show clear
        timeoutId = setTimeout(() => {
          if (!isMounted) return;
          setShowClear(true);

          // Wait 800ms after typing clear to actually clear
          timeoutId = setTimeout(() => {
            if (!isMounted) return;
            setVisibleLines(0);
            setShowClear(false);

            // Start again after 800ms
            timeoutId = setTimeout(() => animateTerminal(0), 800);
          }, 800);
        }, 5000);
      }
    };

    timeoutId = setTimeout(() => animateTerminal(0), 800);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-split-layout">
          <div className="hero-left">
            <h1 className="hero-title mono text-left">
              <span className="text-cyan">&gt;_ </span>
              <span className="typewriter-text">{text}</span>
              <span className="cursor">|</span>
            </h1>
            <p className="hero-subtitle text-left">
              Advanced cybersecurity training grounds. Deploy dedicated instances, hunt for vulnerabilities, and climb the global leaderboards.
            </p>
            <div className="hero-actions text-left">
              <Link to="/challenges" className="btn btn-primary glass-panel">Start Hacking</Link>
              <Link to="/scoreboard" className="btn btn-secondary glass-panel">View Scoreboard</Link>
            </div>
          </div>

          <div className="hero-right">
            <div className="mock-terminal glass-panel">
              <div className="terminal-header">
                <div className="mac-buttons">
                  <span></span><span></span><span></span>
                </div>
                <div className="terminal-title mono">root@kali:~</div>
              </div>
              <div className="terminal-body mono text-left">
                {HACKING_SCENARIO.slice(0, visibleLines).map((item, idx) => (
                  <div key={idx} className={`term-line ${item.text.startsWith('LEEXY{') ? 'text-magenta font-bold glitch-text' : item.text.startsWith('[+]') ? 'text-emerald' : 'text-muted'}`}>
                    {item.text}
                  </div>
                ))}
                {showClear && (
                  <div className="term-line text-muted">operator@leexy:~$ clear</div>
                )}
                <div className="term-cursor">_</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Background Decor */}
      <div className="decor-left mono text-muted">
        <div>SYS.INIT...</div>
        <div>MEM_CHECK: OK</div>
        <div>VULN_SCAN: RUNNING</div>
        <div>0x4F 0x50 0x45 0x52</div>
        <div className="glitch-text">ACCESS_GRANTED</div>
      </div>
      <div className="decor-right mono text-muted">
        <div>&gt; /dev/null</div>
        <div>PORT 1337: LISTENING</div>
        <div>TARGET_LOCKED</div>
        <div>0x41 0x43 0x4B</div>
        <div className="glitch-text">AWAITING_INPUT_</div>
      </div>
    </section>
  );
}
