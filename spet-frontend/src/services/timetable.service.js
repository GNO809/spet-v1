// ============================================================
// SPET — Timetable (EDT) Service
// ============================================================

import api from './api';

/** Normalise un EDT Django → format frontend */
export function normalizeTimetable(t) {
  if (!t) return null;
  return {
    id:          t.id,
    filiere:     t.filiere_name  || t.filiere,
    filiereId:   t.filiere,
    niveau:      t.filiere_niveau || '',
    semester:    t.semestre,
    year:        t.year_label    || '',
    academicYear: t.academic_year,
    status:      t.status,
    quality:     t.quality_score ?? 0,
    sessionsCount: t.sessions_count ?? 0,
    conflictsCount: t.conflicts_count ?? 0,
    responsable: t.created_by_name || '',
    createdById: t.created_by,
    rejectionReason: t.rejection_reason || '',
    notes:       t.notes || '',
    createdAt:   t.created_at,
    updatedAt:   t.updated_at,
    publishedAt: t.published_at,
    sessions:    t.sessions || [],
  };
}

/** Normalise une séance Django → format frontend */
export function normalizeSession(s) {
  if (!s) return null;
  return {
    id:       s.id,
    day:      s.day,
    start:    s.start_time ? s.start_time.slice(0, 5) : '',
    end:      s.end_time   ? s.end_time.slice(0, 5)   : '',
    type:     s.session_type,
    course:   s.course_name  || '',
    courseId: s.course,
    teacher:  s.teacher_name || '',
    teacherId: s.teacher,
    room:     s.room_name    || '',
    roomId:   s.room,
    group:    s.group_label  || '',
    groupId:  s.group,
    timetableId: s.timetable,
    semestre:    s.timetable_semestre || null,
    duration: s.duration_minutes,
  };
}

const TimetableService = {
  // ── EDT CRUD ──────────────────────────────────────────────────
  getAll: async (params) => {
    const { data } = await api.get('/planning/timetables/', { params });
    const list = data.results ?? data;
    return { ...data, results: list.map(normalizeTimetable) };
  },

  getById: async (id) => {
    const { data } = await api.get(`/planning/timetables/${id}/`);
    return normalizeTimetable(data);
  },

  create: async (payload) => {
    const { data } = await api.post('/planning/timetables/', payload);
    return normalizeTimetable(data);
  },

  update: async (id, payload) => {
    const { data } = await api.patch(`/planning/timetables/${id}/`, payload);
    return normalizeTimetable(data);
  },

  delete: async (id) => {
    await api.delete(`/planning/timetables/${id}/`);
  },

  // ── Actions workflow ──────────────────────────────────────────
  submit:   async (id) =>
    api.post(`/planning/timetables/${id}/action/`, { action: 'submit'   }).then(r => normalizeTimetable(r.data)),
  validate: async (id, notes = '') =>
    api.post(`/planning/timetables/${id}/action/`, { action: 'validate', notes }).then(r => normalizeTimetable(r.data)),
  reject:   async (id, rejection_reason = '') =>
    api.post(`/planning/timetables/${id}/action/`, { action: 'reject',   rejection_reason }).then(r => normalizeTimetable(r.data)),
  publish:  async (id) =>
    api.post(`/planning/timetables/${id}/action/`, { action: 'publish'  }).then(r => normalizeTimetable(r.data)),
  archive:  async (id) =>
    api.post(`/planning/timetables/${id}/action/`, { action: 'archive'  }).then(r => normalizeTimetable(r.data)),

  detectConflicts: async (id) =>
    api.post(`/planning/timetables/${id}/detect-conflicts/`).then(r => r.data),

  // ── Export ────────────────────────────────────────────────────
  exportPdf:   (id) => api.get(`/exports/timetable/${id}/pdf/`,   { responseType: 'blob' }).then(r => r.data),
  exportExcel: (id) => api.get(`/exports/timetable/${id}/excel/`, { responseType: 'blob' }).then(r => r.data),

  // ── Séances ───────────────────────────────────────────────────
  getSessions: async (params) => {
    const { data } = await api.get('/planning/sessions/', { params });
    const list = data.results ?? data;
    return list.map(normalizeSession);
  },

  createSession: async (payload) => {
    const { data } = await api.post('/planning/sessions/', payload);
    return normalizeSession(data);
  },

  updateSession: async (id, payload) => {
    const { data } = await api.put(`/planning/sessions/${id}/`, payload);
    return normalizeSession(data);
  },

  deleteSession: async (id) => {
    await api.delete(`/planning/sessions/${id}/`);
  },

  // ── Génération automatique ────────────────────────────────────
  generateSessions: async (id) => {
    const { data } = await api.post(`/planning/timetables/${id}/generate/`);
    return data;
  },
};

export default TimetableService;
