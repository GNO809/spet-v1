// ============================================================
// SPET — Axios API client
// ============================================================

import axios from 'axios';
import { storage } from '@/utils/helpers';
import { API_BASE_URL } from '@/utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ── Request interceptor — attach JWT ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = storage.get('spet_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle auth errors ─────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = storage.get('spet_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        // Utilise la même baseURL (proxy Vite ou absolue)
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        storage.set('spet_access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        storage.remove('spet_access_token');
        storage.remove('spet_refresh_token');
        storage.remove('spet_user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
