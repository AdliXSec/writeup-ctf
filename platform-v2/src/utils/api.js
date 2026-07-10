import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v2',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // For CORS cookies if needed
});

// Interceptor to add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ctf_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      localStorage.removeItem('ctf_token');
      // Otomatis ter-logout dan kembali ke public page (opsional)
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;
