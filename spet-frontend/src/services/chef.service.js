// ============================================================
// SPET — Chef de Département : Service API
// ============================================================

import api from './api';
import { normalizeTimetable, normalizeSession } from './timetable.service';

// ── Normalisation enseignant ──────────────────────────────────
function normalizeTeacher(t) {
  return {
    id:          t.id,
    firstName:   t.first_name  || t.firstName  || '',
    lastName:    t.last_name   || t.lastName   || '',
    fullName:    t.full_name   || `${t.first_name || ''} ${t.last_name || ''}`.trim(),
    email:       t.email       || '',
    grade:       t.grade       || '',
    department:  t.department  || '',
    modules:     t.modules     || [],
    profileStatus: t.profile_status || t.profileStatus || '',
    isActive:    t.is_active   ?? true,
  };
}

// ── Normalisation cours ───────────────────────────────────────
function normalizeCourse(c) {
  return {
    id:           c.id,
    code:         c.code        || '',
    name:         c.name        || '',
    credits:      c.credits     || 0,
    volumeCm:     c.volume_cm   || 0,
    volumeTd:     c.volume_td   || 0,
    volumeTp:     c.volume_tp   || 0,
    totalHours:   c.total_hours || (c.volume_cm || 0) + (c.volume_td || 0) + (c.volume_tp || 0),
    teacher:      c.teacher     || null,
    teacherName:  c.teacher_name || c.teacherName || null,
    filiere:      c.filiere     || null,
    filiereName:  c.filiere_name || '',
    isActive:     c.is_active   ?? true,
  };
}

const ChefService = {

  // ── Tableau de bord ───────────────────────────────────────────
  getDashboard: async () => {
    const { data } = await api.get('/dashboard/');
    return data;
  },

  // ── Emplois du temps ──────────────────────────────────────────
  getTimetables: async (params = {}) => {
    const { data } = await api.get('/planning/timetables/', { params });
    const list = data.results ?? data;
    return {
      count:   data.count ?? list.length,
      results: list.map(normalizeTimetable),
    };
  },

  getTimetableById: async (id) => {
    const { data } = await api.get(`/planning/timetables/${id}/`);
    return normalizeTimetable(data);
  },

  // ── Séances d'un EDT ─────────────────────────────────────────
  getSessions: async (timetableId) => {
    const { data } = await api.get('/planning/sessions/', {
      params: { timetable: timetableId, page_size: 300 },
    });
    const list = data.results ?? data;
    return list.map(normalizeSession);
  },

  // ── Détection de conflits ─────────────────────────────────────
  detectConflicts: async (id) => {
    const { data } = await api.post(`/planning/timetables/${id}/detect-conflicts/`);
    return data; // { conflicts_found, quality_score }
  },

  // ── Validation workflow ───────────────────────────────────────
  validerEdt: async (id, notes = '') => {
    const { data } = await api.post(`/planning/timetables/${id}/action/`, {
      action: 'validate',
      notes,
    });
    return normalizeTimetable(data);
  },

  rejeterEdt: async (id, rejection_reason) => {
    const { data } = await api.post(`/planning/timetables/${id}/action/`, {
      action: 'reject',
      rejection_reason,
    });
    return normalizeTimetable(data);
  },

  publierEdt: async (id) => {
    const { data } = await api.post(`/planning/timetables/${id}/action/`, {
      action: 'publish',
    });
    return normalizeTimetable(data);
  },

  // ── Exports ───────────────────────────────────────────────────
  exportPdf: (id) =>
    api.get(`/exports/timetable/${id}/pdf/`, { responseType: 'blob' }).then(r => r.data),

  exportExcel: (id) =>
    api.get(`/exports/timetable/${id}/excel/`, { responseType: 'blob' }).then(r => r.data),

  // ── Cours ─────────────────────────────────────────────────────
  getCours: async (params = {}) => {
    const { data } = await api.get('/academics/courses/', { params });
    const list = data.results ?? data;
    return list.map(normalizeCourse);
  },

  updateCours: async (id, payload) => {
    const { data } = await api.patch(`/academics/courses/${id}/`, payload);
    return normalizeCourse(data);
  },

  // ── Enseignants ───────────────────────────────────────────────
  getEnseignants: async (params = {}) => {
    const { data } = await api.get('/users/teachers/', { params });
    const list = data.results ?? data;
    return list.map(normalizeTeacher);
  },

  // ── Filières ──────────────────────────────────────────────────
  getFilieres: async (params = {}) => {
    const { data } = await api.get('/academics/filieres/', { params });
    return data.results ?? data;
  },

  // ── Journal d'audit ───────────────────────────────────────────
  getAuditLogs: async (params = {}) => {
    const { data } = await api.get('/audit/logs/', { params });
    return data;
  },

  // ── Statistiques (dérivées du dashboard + données académiques) ─
  getStatsEnseignants: async () => {
    const [cours, enseignants] = await Promise.all([
      api.get('/academics/courses/', { params: { page_size: 500 } }).then(r => (r.data.results ?? r.data).map(normalizeCourse)),
      api.get('/users/teachers/', { params: { page_size: 200 } }).then(r => (r.data.results ?? r.data).map(normalizeTeacher)),
    ]);

    // Calcul charge horaire par enseignant
    const chargeMap = {};
    cours.forEach(c => {
      if (!c.teacher) return;
      if (!chargeMap[c.teacher]) {
        chargeMap[c.teacher] = { cm: 0, td: 0, tp: 0, total: 0 };
      }
      chargeMap[c.teacher].cm    += c.volumeCm;
      chargeMap[c.teacher].td    += c.volumeTd;
      chargeMap[c.teacher].tp    += c.volumeTp;
      chargeMap[c.teacher].total += c.volumeCm + c.volumeTd + c.volumeTp;
    });

    return enseignants.map(e => ({
      ...e,
      charge: chargeMap[e.id] || { cm: 0, td: 0, tp: 0, total: 0 },
    }));
  },

  getStatsSalles: async () => {
    const { data } = await api.get('/planning/rooms/', { params: { page_size: 200 } });
    return data.results ?? data;
  },
};

export default ChefService;
