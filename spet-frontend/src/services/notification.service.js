// ============================================================
// SPET — Notification Service
// ============================================================

import api from './api';

const NotificationService = {
  getAll: async (params) => {
    const { data } = await api.get('/notifications/', { params });
    return data.results ?? data;
  },

  markRead: async (id) => {
    const { data } = await api.patch(`/notifications/${id}/`);
    return data;
  },

  markAllRead: async () => {
    const { data } = await api.post('/notifications/mark-all-read/');
    return data;
  },

  delete: async (id) => {
    await api.delete(`/notifications/${id}/`);
  },

  getUnreadCount: async () => {
    const { data } = await api.get('/notifications/unread-count/');
    return data.unread_count ?? 0;
  },
};

export default NotificationService;
