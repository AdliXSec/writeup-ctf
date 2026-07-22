import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'Z');
    if (isNaN(date)) return dateStr;
    return date.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="notifications-container">
      <div className="content-header text-center">
        <h2>System Messages</h2>
        <p className="subtitle">Incoming transmissions and critical alerts.</p>
      </div>

      <div className="notifications-list">
        {loading && notifications.length === 0 ? (
          <div className="mono text-muted text-center" style={{ margin: '3rem 0' }}>./fetching_transmissions...</div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif.id} className="notification-card glass-panel">
              <div className="notification-header">
                <span className="notification-title">{notif.title}</span>
                <span className="notification-time mono text-muted">{formatDate(notif.created_at)}</span>
              </div>
              <div className="notification-body">{notif.message}</div>
            </div>
          ))
        ) : (
          <div className="mono text-muted text-center" style={{ margin: '3rem 0' }}>No incoming transmissions.</div>
        )}
      </div>
    </div>
  );
}
