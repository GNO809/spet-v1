// ============================================================
// SPET — Authentication Service
// ============================================================

import api from './api';
import { storage } from '@/utils/helpers';

/** Normalise un objet User Django → format frontend */
export function normalizeUser(u) {
  if (!u) return null;
  return {
    id:            u.id,
    email:         u.email,
    username:      u.username,
    firstName:     u.first_name,
    lastName:      u.last_name,
    role:          u.role,
    phone:         u.phone,
    grade:         u.grade,
    profileStatus: u.profile_status,
    status:        u.is_active ? 'active' : 'inactive',
    department:    u.department_name || null,
    departmentId:  u.department     || null,
    filiere:       u.filiere_name   || null,
    filiereId:     u.filiere        || null,
    filiereNiveau:  u.filiere_niveau          || null,
    managedNiveaux:   u.managed_filiere_niveaux || [],
    avatar:           u.avatar             || null,
    specialite:       u.specialite         || '',
    bio:              u.bio                || '',
    cv:               u.cv ? (u.cv.startsWith('http') ? u.cv : `http://localhost:8000${u.cv.startsWith('/') ? '' : '/media/'}${u.cv}`) : null,
    niveauxSouhaites: u.niveaux_souhaites  || [],
    createdAt:        u.date_joined ? u.date_joined.slice(0, 10) : '',
  };
}

const AuthService = {
  /** POST /auth/login/ */
  login: async (email, password) => {
    const { data } = await api.post('/auth/login/', { email, password });
    storage.set('spet_access_token',  data.access);
    storage.set('spet_refresh_token', data.refresh);
    return data;
  },

  /** POST /auth/refresh/ */
  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh/', { refresh: refreshToken });
    storage.set('spet_access_token', data.access);
    return data;
  },

  /** GET /auth/me/ */
  getProfile: async () => {
    const { data } = await api.get('/auth/me/');
    return normalizeUser(data);
  },

  /** POST /auth/logout/ */
  logout: async () => {
    const refresh = storage.get('spet_refresh_token');
    try { await api.post('/auth/logout/', { refresh }); } catch { /* noop */ }
    storage.remove('spet_access_token');
    storage.remove('spet_refresh_token');
    storage.remove('spet_user');
  },

  /** POST /auth/change-password/ */
  changePassword: async (oldPassword, newPassword) => {
    const { data } = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword,
    });
    return data;
  },

  /** POST /auth/password-reset/ */
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/password-reset/', { email });
    return data;
  },

  /** POST /auth/password-reset/confirm/ */
  resetPassword: async (uid, token, newPassword, newPassword2) => {
    const { data } = await api.post('/auth/password-reset/confirm/', {
      uid,
      token,
      new_password:  newPassword,
      new_password2: newPassword2,
    });
    return data;
  },

  isAuthenticated: () => !!storage.get('spet_access_token'),
};

export default AuthService;
