import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext();

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    
    // Default duration if missing or invalid
    const time = typeof duration === 'number' ? duration : 4000;
    
    if (time > 0) {
      setTimeout(() => {
        removeToast(id);
      }, time);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = (msg, duration) => addToast('success', null, msg, duration);
  const error = (msg, duration) => addToast('error', null, msg, duration);
  const info = (msg, duration) => addToast('info', null, msg, duration);
  const warning = (msg, duration) => addToast('warning', null, msg, duration);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'i'}
              {toast.type === 'warning' && '!'}
            </div>
            <div className="toast-message mono">
              {toast.title && <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '1.05em' }}>{toast.title}</strong>}
              {toast.message}
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
