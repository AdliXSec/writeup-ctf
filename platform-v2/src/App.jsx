import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from './contexts/ToastContext';
import './App.css';

function GlobalErrorHandler() {
  const { addToast } = useToast();

  React.useEffect(() => {
    const handleApiError = (e) => {
      const { status, message } = e.detail;
      // Filter out 401 Unauthorized since it's handled by redirection/clearing token
      if (status !== 401) {
        if (status >= 500 || status === 0) {
          addToast('error', 'Server Error', message, 5000);
        } else if (status >= 400) {
          addToast('warning', 'Request Error', message, 4000);
        }
      }
    };

    window.addEventListener('api-error', handleApiError);
    return () => window.removeEventListener('api-error', handleApiError);
  }, [addToast]);

  return null; // This component doesn't render anything
}

import Home from './pages/Home';
import Challenges from './pages/Challenges';
import Scoreboard from './pages/Scoreboard';
import Status from './pages/Status';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
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

  const navigate = useNavigate();

  // Check auth status based on token presence
  const isAuthenticated = !!localStorage.getItem('ctf_token');

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('ctf_token');
    localStorage.removeItem('adminToken');
    setIsMobileMenuOpen(false);
    navigate('/');
  };

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
        <Link to="/notifications" className={location.pathname === '/notifications' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Alerts</Link>
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''} onClick={() => setIsMobileMenuOpen(false)}>Profile</Link>

        {/* Mobile Login Button */}
        {isAuthenticated ? (
          <button className="btn-nav-login mono mobile-only" onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--accent-magenta)', color: 'var(--accent-magenta)' }}>
            ./logout
          </button>
        ) : (
          <Link to="/login" className="btn-nav-login mono mobile-only" onClick={() => setIsMobileMenuOpen(false)}>
            ./login
          </Link>
        )}
      </nav>
      <div className="nav-actions desktop-only">
        {isAuthenticated ? (
          <button className="btn-nav-login mono" onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--accent-magenta)', color: 'var(--accent-magenta)' }}>
            ./logout
          </button>
        ) : (
          <Link to="/login" className="btn-nav-login mono">
            ./login
          </Link>
        )}
      </div>
    </header>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <>
        <GlobalErrorHandler />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="challenges" element={<AdminChallenges />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="broadcast" element={<AdminBroadcast />} />
        </Route>
      </Routes>
      </>
    );
  }

  return (
    <div className="app-container">
      <GlobalErrorHandler />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/status" element={<Status />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/player/:username" element={<PublicProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
