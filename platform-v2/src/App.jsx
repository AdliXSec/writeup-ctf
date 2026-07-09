import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

import Home from './pages/Home';
import Challenges from './pages/Challenges';
import Scoreboard from './pages/Scoreboard';
import Status from './pages/Status';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminChallenges from './pages/admin/AdminChallenges';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBroadcast from './pages/admin/AdminBroadcast';
import AdminLogin from './pages/admin/AdminLogin';

function Navbar() {
  const location = useLocation();
  const [typedText, setTypedText] = React.useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const fullText = "0xL33XY CTF";

  React.useEffect(() => {
    let timeout;
    let i = 0;
    
    const typeWriter = () => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
        timeout = setTimeout(typeWriter, 150); // Typing speed
      } else {
        // Pause for 5 seconds when complete, then restart
        timeout = setTimeout(() => {
          i = 0;
          setTypedText('');
          typeWriter();
        }, 5000); 
      }
    };

    typeWriter();
    
    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <header className="navbar">
      <div className="nav-brand">
        <span className="mono text-cyan">&gt;_ </span>
        {typedText}
        <span className="brand-cursor">|</span>
      </div>

      <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
      </button>

      <nav className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
        <Link to="/challenges" className={location.pathname === '/challenges' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Challenges</Link>
        <Link to="/scoreboard" className={location.pathname === '/scoreboard' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Scoreboard</Link>
        <Link to="/status" className={location.pathname === '/status' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Status</Link>
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>

        {/* Mobile Login Button */}
        <Link to="/login" className="btn-nav-login mono mobile-only" onClick={() => setIsMobileMenuOpen(false)}>
          ./login
        </Link>
      </nav>
      <div className="nav-actions desktop-only">
        <Link to="/login" className="btn-nav-login mono">
          ./login
        </Link>
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="challenges" element={<AdminChallenges />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="broadcast" element={<AdminBroadcast />} />
        </Route>
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/status" element={<Status />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
