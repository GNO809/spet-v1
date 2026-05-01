// ============================================================
// SPET — Room Service
// ============================================================

import api from './api';

/** Normalise une salle Django → format frontend */
export function normalizeRoom(r) {
  if (!r) return null;
  return {
    id:        r.id,
    name:      r.name,
    capacity:  r.capacity,
    type:      r.room_type_display || r.room_type,
    room_type: r.room_type,
    building:  r.building,
    floor:     r.floor ?? 0,
    equipment: r.equipment || [],
    status:    r.status,
    notes:     r.notes || '',
  };
}

const RoomService = {
  getAll: async (params) => {
    const { data } = await api.get('/planning/rooms/', { params });
    const list = data.results ?? data;
    return list.map(normalizeRoom);
  },

  getById: async (id) => {
    const { data } = await api.get(`/planning/rooms/${id}/`);
    return normalizeRoom(data);
  },

  create: async (payload) => {
    const { data } = await api.post('/planning/rooms/', payload);
    return normalizeRoom(data);
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/planning/rooms/${id}/`, payload);
    return normalizeRoom(data);
  },

  delete: async (id) => {
    await api.delete(`/planning/rooms/${id}/`);
  },

  getAvailable: async () => {
    const { data } = await api.get('/planning/rooms/available/');
    return data.map(normalizeRoom);
  },
};

export default RoomService;
