import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://sg-backend-0cs6.onrender.com/';

const client = axios.create({ baseURL: BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/social_gems_admin/login';
    }
    return Promise.reject(err);
  }
);

export default client;
