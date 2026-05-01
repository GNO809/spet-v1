// ============================================================
// SPET — Utility Helpers
// ============================================================

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Date / time ──────────────────────────────────────────────
export const formatDate = (date, fmt = 'dd/MM/yyyy') => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt, { locale: fr });
  } catch { return '—'; }
};

export const formatDateTime = (date) => formatDate(date, "dd/MM/yyyy 'à' HH'h'mm");
export const formatRelative  = (date) => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  } catch { return '—'; }
};

export const getCurrentDateTime = () => {
  const now = new Date();
  const days   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return {
    day:  days[now.getDay()],
    date: `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
    time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    full: `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
  };
};

// ── String ───────────────────────────────────────────────────
export const getInitials = (name = '') => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
};

export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const truncate = (str = '', len = 40) =>
  str.length > len ? str.slice(0, len) + '…' : str;

export const slugify = (str = '') =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

// ── Numbers ───────────────────────────────────────────────────
export const formatNumber = (n) =>
  new Intl.NumberFormat('fr-FR').format(n);

export const clamp = (val, min, max) =>
  Math.min(Math.max(val, min), max);

// ── Colors ───────────────────────────────────────────────────
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// ── Storage ───────────────────────────────────────────────────
export const storage = {
  get: (key, fallback = null) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch { /* ignore */ }
  },
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};

// ── EDT quality score ─────────────────────────────────────────
export const getQualityColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

export const getQualityLabel = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Bon';
  if (score >= 60) return 'Acceptable';
  if (score >= 40) return 'Insuffisant';
  return 'Mauvais';
};

// ── Filters ───────────────────────────────────────────────────
export const filterBySearch = (items, query, fields) => {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item =>
    fields.some(f => String(item[f] ?? '').toLowerCase().includes(q))
  );
};

// ── Export helpers ────────────────────────────────────────────
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
