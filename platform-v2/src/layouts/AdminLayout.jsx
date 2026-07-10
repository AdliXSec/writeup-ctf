import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('ctf_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin') {
        navigate('/admin/login');
      }
    } catch (e) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('ctf_token');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Background elements */}
      <div className="admin-bg-grid"></div>
      <div className="admin-bg-glow"></div>

      {/* Top Navbar */}
      <nav className="admin-navbar glass-panel">
        <div className="admin-nav-left">
          <div className="admin-brand mono">
            <span className="text-red">&gt;_ </span>ROOT<span className="blink-cursor">|</span>
          </div>
        </div>
        
        <div className="admin-nav-center">
          <NavLink to="/admin" end className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            OVERVIEW
          </NavLink>
          <NavLink to="/admin/challenges" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            CHALLENGES
          </NavLink>
          <NavLink to="/admin/users" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            MONITOR
          </NavLink>
          <NavLink to="/admin/broadcast" className={({isActive}) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            BROADCAST
          </NavLink>
        </div>

        <div className="admin-nav-right">
          <div className="admin-status mono text-red" style={{ marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="pulse-dot red"></span> LIVE
          </div>
          <button className="btn-admin-return mono" onClick={() => navigate('/')}>PUBLIC</button>
          <button className="btn-admin-logout mono" onClick={handleLogout}>EXIT</button>
        </div>
      </nav>

      <main className="admin-main-container">
        <Outlet />
      </main>
    </div>
  );
}
