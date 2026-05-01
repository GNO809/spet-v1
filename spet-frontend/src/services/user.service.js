// ============================================================
// SPET — User Service
// ============================================================

import api from './api';
import { normalizeUser } from './auth.service';

const UserService = {
  // ── Utilisateurs ─────────────────────────────────────────────
  getAll: async (params) => {
    const { data } = await api.get('/users/', { params });
    // Support pagination DRF (results) ou tableau direct
    const list = data.results ?? data;
    return { ...data, results: list.map(normalizeUser) };
  },

  getById: async (id) => {
    const { data } = await api.get(`/users/${id}/`);
    return normalizeUser(data);
  },

  create: async (payload) => {
    const { data } = await api.post('/users/', payload);
    return normalizeUser(data);
  },

  update: async (id, payload) => {
    const { data } = await api.patch(`/users/${id}/`, payload);
    return normalizeUser(data);
  },

  delete: async (id) => {
    await api.delete(`/users/${id}/`);
  },

  toggleActive: async (id) => {
    const { data } = await api.post(`/users/${id}/toggle-active/`);
    return normalizeUser(data);
  },

  // ── Enseignants ───────────────────────────────────────────────
  getTeachers: async (params) => {
    const { data } = await api.get('/users/teachers/', { params });
    const list = data.results ?? data;
    return list.map(normalizeUser);
  },

  // ── Profil propre (enseignant) ────────────────────────────────
  updateMyProfile: async (payload) => {
    // Do NOT set Content-Type manually for FormData — Axios must set it with the
    // multipart boundary, otherwise the server can't parse the file upload.
    const { data } = await api.patch('/auth/me/', payload);
    return normalizeUser(data);
  },

  // ── Validation profil ─────────────────────────────────────────
  validateProfile: async (id, profileStatus) => {
    const { data } = await api.patch(`/users/${id}/validate-profile/`, { profile_status: profileStatus });
    return normalizeUser(data);
  },

  // ── Disponibilités enseignant ─────────────────────────────────
  getMyAvailabilities: async () => {
    const { data } = await api.get('/planning/availabilities/my/');
    return data;
  },

  setAvailabilities: async (slots) => {
    const { data } = await api.post('/planning/availabilities/bulk/', { slots });
    return data;
  },

  // ── Dashboard stats ───────────────────────────────────────────
  getDashboardStats: async () => {
    const { data } = await api.get('/dashboard/');
    return data;
  },
};

export default UserService;
