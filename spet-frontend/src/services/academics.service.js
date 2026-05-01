// ============================================================
// SPET — Academics Service (UFR, Départements, Filières, Cours)
// ============================================================

import api from './api';

const AcademicsService = {
  // ── UFR ───────────────────────────────────────────────────────
  getUFRs: async () => {
    const { data } = await api.get('/academics/ufr/');
    return data.results ?? data;
  },

  // ── Départements ──────────────────────────────────────────────
  getDepartments: async (params) => {
    const { data } = await api.get('/academics/departments/', { params });
    return data.results ?? data;
  },

  getDepartmentById: async (id) => {
    const { data } = await api.get(`/academics/departments/${id}/`);
    return data;
  },

  // ── Filières ──────────────────────────────────────────────────
  getFilieres: async (params) => {
    const { data } = await api.get('/academics/filieres/', { params });
    return data.results ?? data;
  },

  getFiliereById: async (id) => {
    const { data } = await api.get(`/academics/filieres/${id}/`);
    return data;
  },

  // ── Années académiques ────────────────────────────────────────
  getAcademicYears: async () => {
    const { data } = await api.get('/academics/academic-years/');
    return data.results ?? data;
  },

  getCurrentYear: async () => {
    const { data } = await api.get('/academics/academic-years/');
    const list = data.results ?? data;
    return list.find(y => y.is_current) || list[0] || null;
  },

  // ── Cours ─────────────────────────────────────────────────────
  getCourses: async (params) => {
    const { data } = await api.get('/academics/courses/', { params });
    return data.results ?? data;
  },

  getCourseById: async (id) => {
    const { data } = await api.get(`/academics/courses/${id}/`);
    return data;
  },

  createCourse: async (payload) => {
    const { data } = await api.post('/academics/courses/', payload);
    return data;
  },

  updateCourse: async (id, payload) => {
    const { data } = await api.patch(`/academics/courses/${id}/`, payload);
    return data;
  },

  deleteCourse: async (id) => {
    await api.delete(`/academics/courses/${id}/`);
  },

  // ── Filières : create / update / delete ───────────────────────
  createFiliere: async (payload) => {
    const { data } = await api.post('/academics/filieres/', payload);
    return data;
  },

  updateFiliere: async (id, payload) => {
    const { data } = await api.patch(`/academics/filieres/${id}/`, payload);
    return data;
  },

  deleteFiliere: async (id) => {
    await api.delete(`/academics/filieres/${id}/`);
  },

  // ── Groupes ───────────────────────────────────────────────────
  getGroups: async (params) => {
    const { data } = await api.get('/academics/groups/', { params });
    return data.results ?? data;
  },
};

export default AcademicsService;
