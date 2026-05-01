// ============================================================
// SPET — Constants & Configuration
// ============================================================

export const APP_NAME = 'SPET';
export const APP_FULL_NAME = 'Système de Planification des Emplois du Temps';
export const INSTITUTION = 'UFR Sciences et Technologies';
export const UNIVERSITY = 'Université Iba Der Thiam de Thiès';

// ── Roles ──────────────────────────────────────────────────
export const ROLES = {
  ADMIN:      'ADMIN',
  CHEF_DEPT:  'CHEF_DEPT',
  RESP_FIL:   'RESP_FIL',
  ENSEIGNANT: 'ENSEIGNANT',
};

export const ROLE_HIERARCHY = {
  ADMIN:      ['ADMIN', 'CHEF_DEPT', 'RESP_FIL', 'ENSEIGNANT'],
  CHEF_DEPT:  ['CHEF_DEPT',  'ENSEIGNANT'],
  RESP_FIL:   ['RESP_FIL',   'ENSEIGNANT'],
  ENSEIGNANT: ['ENSEIGNANT'],
};

export const ROLE_LABELS = {
  ADMIN:      'Administrateur',
  CHEF_DEPT:  'Chef de Département',
  RESP_FIL:   'Responsable de Filière',
  ENSEIGNANT: 'Enseignant',
};

export const ROLE_BADGE_CLASS = {
  ADMIN:      'badge-admin',
  CHEF_DEPT:  'badge-chef_dept',
  RESP_FIL:   'badge-resp_fil',
  ENSEIGNANT: 'badge-enseignant',
};

// ── EDT Statuses ────────────────────────────────────────────
export const EDT_STATUS = {
  BROUILLON:             'BROUILLON',
  EN_ATTENTE:            'EN_ATTENTE',
  VALIDE:                'VALIDE',
  PUBLIE:                'PUBLIE',
  ARCHIVE:               'ARCHIVE',
  REJETE:                'REJETE',
  EN_ATTENTE_VALIDATION: 'EN_ATTENTE_VALIDATION',
  INCOMPLET:             'INCOMPLET',
};

export const EDT_STATUS_LABELS = {
  BROUILLON:             'Brouillon',
  EN_ATTENTE:            'En attente',
  VALIDE:                'Validé',
  PUBLIE:                'Publié',
  ARCHIVE:               'Archivé',
  REJETE:                'Rejeté',
  EN_ATTENTE_VALIDATION: 'En attente de validation',
  INCOMPLET:             'Incomplet',
};

export const EDT_STATUS_BADGE = {
  BROUILLON:             'badge-brouillon',
  EN_ATTENTE:            'badge-en_attente',
  VALIDE:                'badge-valide',
  PUBLIE:                'badge-publie',
  ARCHIVE:               'badge-archive',
  REJETE:                'badge-rejete',
  EN_ATTENTE_VALIDATION: 'badge-en_attente_valid',
  INCOMPLET:             'badge-incomplet',
};

// ── Session types ───────────────────────────────────────────
export const SESSION_TYPES = {
  CM: 'CM',
  TD: 'TD',
  TP: 'TP',
};

export const SESSION_TYPE_LABELS = {
  CM: 'Cours Magistral',
  TD: 'Travaux Dirigés',
  TP: 'Travaux Pratiques',
};

export const SESSION_TYPE_COLORS = {
  CM: { bg: '#dbeafe', border: '#1a56db', text: '#1e3a8a' },
  TD: { bg: '#dcfce7', border: '#10b981', text: '#15803d' },
  TP: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
};

// ── Days of the week ────────────────────────────────────────
export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '15:00', '16:00', '17:00', '18:00', '19:00',
];

// Créneaux officiels UIDT : 08h-12h (2×2h) / pause 12h-15h / 15h-19h (2×2h)
export const TIME_SLOTS = [
  { label: '08h - 10h', start: '08:00', end: '10:00' },
  { label: '10h - 12h', start: '10:00', end: '12:00' },
  { label: '15h - 17h', start: '15:00', end: '17:00' },
  { label: '17h - 19h', start: '17:00', end: '19:00' },
];

export const PAUSE_SLOT = { label: 'Pause méridienne', start: '12:00', end: '15:00' };

// ── Profile statuses ────────────────────────────────────────
export const PROFILE_STATUS = {
  COMPLET:   'COMPLET',
  INCOMPLET: 'INCOMPLET',
  VALIDE:    'VALIDE',
  REJETE:    'REJETE',
};

// ── Notifications ───────────────────────────────────────────
export const NOTIF_TYPES = {
  INFO:    'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR:   'ERROR',
};

// ── Academic years ──────────────────────────────────────────
export const SEMESTERS = ['Semestre 1', 'Semestre 2'];

// ── API base ────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ── Maquette pédagogique officielle UIDT ────────────────────
// Licence Informatique — UFR SET — 2025-2026
export const MAQUETTE = {
  // ── L1 Tronc Commun ──────────────────────────────────────
  L1_S1: [
    { code: 'INF1111', name: 'Analyse 1',                                volume_cm: 20, volume_td: 20 },
    { code: 'INF1112', name: 'Algèbre 1',                                volume_cm: 20, volume_td: 20 },
    { code: 'INF1121', name: 'Fondamentaux de physique',                 volume_cm: 20, volume_td: 20 },
    { code: 'INF1122', name: 'Électricité',                              volume_cm: 20, volume_td: 20 },
    { code: 'INF1131', name: 'Algorithmique et programmation 1',         volume_cm: 20, volume_td: 20 },
    { code: 'INF1132', name: "Introduction aux systèmes d'exploitation", volume_cm: 20, volume_td: 20 },
    { code: 'INF1141', name: 'Anglais 1',                                volume_cm: 20, volume_td: 20 },
    { code: 'INF1142', name: 'Recherche documentaire',                   volume_cm: 10, volume_td: 10 },
  ],
  L1_S2: [
    { code: 'INF1211', name: 'Analyse 2',                                volume_cm: 20, volume_td: 20 },
    { code: 'INF1212', name: 'Algèbre 2',                                volume_cm: 20, volume_td: 20 },
    { code: 'INF1221', name: 'Ondes et Propagation',                     volume_cm: 20, volume_td: 20 },
    { code: 'INF1222', name: 'Électronique',                             volume_cm: 20, volume_td: 20 },
    { code: 'INF1231', name: 'Algorithmique et Programmation 2',         volume_cm: 20, volume_td: 20 },
    { code: 'INF1232', name: 'Architecture des ordinateurs',             volume_cm: 20, volume_td: 20 },
    { code: 'INF1241', name: 'Anglais 2',                                volume_cm: 20, volume_td: 20 },
    { code: 'INF1242', name: 'Technique de communications',              volume_cm: 10, volume_td: 10 },
  ],
  // ── L2 Tronc Commun ──────────────────────────────────────
  L2_S3: [
    { code: 'INF2311', name: 'Probabilités et Statistiques',             volume_cm: 15, volume_td: 15 },
    { code: 'INF2312', name: 'Calcul Numérique',                         volume_cm: 15, volume_td: 15 },
    { code: 'INF2321', name: "Systèmes d'Exploitation",                  volume_cm: 15, volume_td: 15 },
    { code: 'INF2322', name: 'Introduction aux réseaux',                 volume_cm: 15, volume_td: 15 },
    { code: 'INF2331', name: 'Algorithmique et Structures de données',   volume_cm: 20, volume_td: 20 },
    { code: 'INF2332', name: 'Développement web 1',                      volume_cm: 20, volume_td: 20 },
    { code: 'INF2341', name: "Analyse et Conception des Systèmes d'Info.", volume_cm: 15, volume_td: 15 },
    { code: 'INF2342', name: 'Introduction aux Bases de Données Rel.',   volume_cm: 15, volume_td: 15 },
    { code: 'INF2351', name: 'Projet Personnel Professionnel (PPP)',      volume_cm: 10, volume_td: 10 },
    { code: 'INF2352', name: 'Anglais 3',                                volume_cm: 10, volume_td: 10 },
  ],
  L2_S4: [
    { code: 'INF2411', name: 'Introduction à la sécurité',               volume_cm: 20, volume_td: 20 },
    { code: 'INF2412', name: 'Réseaux locaux',                           volume_cm: 20, volume_td: 20 },
    { code: 'INF2421', name: 'Programmation Orientée Objet 1',           volume_cm: 20, volume_td: 20 },
    { code: 'INF2422', name: 'Analyse et Conception Orientée Objet',     volume_cm: 20, volume_td: 20 },
    { code: 'INF2431', name: 'Technologies XML',                         volume_cm: 20, volume_td: 20 },
    { code: 'INF2432', name: 'Développement web 2',                      volume_cm: 20, volume_td: 20 },
    { code: 'INF2441', name: 'Gestion de projets',                       volume_cm: 10, volume_td: 10 },
    { code: 'INF2442', name: 'Leadership et développement personnel',    volume_cm: 10, volume_td: 10 },
    { code: 'INF2443', name: 'Anglais 4',                                volume_cm: 10, volume_td: 10 },
  ],
  // ── L3 Génie Logiciel ────────────────────────────────────
  L3_GL_S5: [
    { code: 'INF3511', name: 'Programmation des mobiles',                volume_cm: 20, volume_td: 20 },
    { code: 'INF3512', name: 'Programmation Orientée Objet 2',           volume_cm: 20, volume_td: 20 },
    { code: 'INF3521', name: 'Développement Web Avancé',                 volume_cm: 20, volume_td: 20 },
    { code: 'INF3522', name: 'Introduction au Génie Logiciel',           volume_cm: 20, volume_td: 20 },
    { code: 'INF3531', name: 'Bases de données avancées',                volume_cm: 20, volume_td: 20 },
    { code: 'INF3532', name: 'Programmation fonctionnelle',              volume_cm: 20, volume_td: 20 },
    { code: 'INF3541', name: 'Anglais 5',                                volume_cm: 15, volume_td: 15 },
    { code: 'INF3542', name: "Création d'entreprises",                   volume_cm: 15, volume_td: 15 },
  ],
  L3_GL_S6: [
    { code: 'INF3611', name: 'Développement d\'Applications Distribuées', volume_cm: 15, volume_td: 15 },
    { code: 'INF3612', name: 'Langages Automates et Compilation',        volume_cm: 15, volume_td: 15 },
    { code: 'INF3613', name: 'Mesure qualité et performance logicielle', volume_cm: 10, volume_td: 10 },
    { code: 'INF3621', name: 'Recherche documentaire 2 & Rédaction sci.',volume_cm: 10, volume_td: 10 },
    { code: 'INF3622', name: 'Anglais 6',                                volume_cm: 10, volume_td: 10 },
    { code: 'INF3631', name: 'Stage ou Projet Opérationnel',             volume_cm: 0,  volume_td: 0, credits: 18 },
  ],
  // ── L3 Réseaux & Télécommunications ─────────────────────
  L3_RT_S5: [
    { code: 'INF3511', name: 'Réseaux sans-fil',                         volume_cm: 20, volume_td: 20 },
    { code: 'INF3512', name: 'Signaux et systèmes analogiques',          volume_cm: 20, volume_td: 20 },
    { code: 'INF3521', name: 'Programmation des mobiles',                volume_cm: 20, volume_td: 20 },
    { code: 'INF3522', name: "Introduction à l'IoT",                     volume_cm: 20, volume_td: 20 },
    { code: 'INF3531', name: 'Administration réseaux et systèmes',       volume_cm: 20, volume_td: 20 },
    { code: 'INF3532', name: 'Sécurité des réseaux',                     volume_cm: 20, volume_td: 20 },
    { code: 'INF3541', name: 'Anglais 5',                                volume_cm: 15, volume_td: 15 },
    { code: 'INF3542', name: "Création d'entreprise",                    volume_cm: 15, volume_td: 15 },
  ],
  L3_RT_S6: [
    { code: 'INF3611', name: 'Maintenance Informatique',                 volume_cm: 10, volume_td: 20 },
    { code: 'INF3612', name: 'Services réseaux',                         volume_cm: 10, volume_td: 20 },
    { code: 'INF3613', name: 'Modules complémentaires',                  volume_cm: 10, volume_td: 10 },
    { code: 'INF3621', name: 'Recherche documentaire 2 & Rédaction sci.',volume_cm: 10, volume_td: 10 },
    { code: 'INF3622', name: 'Anglais 6',                                volume_cm: 10, volume_td: 10 },
    { code: 'INF3631', name: 'Stage ou Projet Opérationnel',             volume_cm: 0,  volume_td: 0, credits: 18 },
  ],
};

// Mapping niveau/semestre → clé MAQUETTE
export const NIVEAU_SEMESTRE_MAP = {
  'L1-S1':    'L1_S1',
  'L1-S2':    'L1_S2',
  'L2-S3':    'L2_S3',
  'L2-S4':    'L2_S4',
  'L3-GL-S5': 'L3_GL_S5',
  'L3-GL-S6': 'L3_GL_S6',
  'L3-RT-S5': 'L3_RT_S5',
  'L3-RT-S6': 'L3_RT_S6',
};

// Tous les niveaux disponibles
export const NIVEAUX = [
  { key: 'L1-S1',    label: 'L1 — Semestre 1',            niveau: 'L1',    semestre: 'S1',  option: 'TC' },
  { key: 'L1-S2',    label: 'L1 — Semestre 2',            niveau: 'L1',    semestre: 'S2',  option: 'TC' },
  { key: 'L2-S3',    label: 'L2 — Semestre 3',            niveau: 'L2',    semestre: 'S3',  option: 'TC' },
  { key: 'L2-S4',    label: 'L2 — Semestre 4',            niveau: 'L2',    semestre: 'S4',  option: 'TC' },
  { key: 'L3-GL-S5', label: 'L3 Génie Logiciel — S5',     niveau: 'L3-GL', semestre: 'S5',  option: 'GL' },
  { key: 'L3-GL-S6', label: 'L3 Génie Logiciel — S6',     niveau: 'L3-GL', semestre: 'S6',  option: 'GL' },
  { key: 'L3-RT-S5', label: 'L3 Réseaux & Télécom — S5',  niveau: 'L3-RT', semestre: 'S5',  option: 'RT' },
  { key: 'L3-RT-S6', label: 'L3 Réseaux & Télécom — S6',  niveau: 'L3-RT', semestre: 'S6',  option: 'RT' },
  { key: 'M1-S7',    label: 'Master 1 — Semestre 7',       niveau: 'M1',    semestre: 'S7',  option: '' },
  { key: 'M1-S8',    label: 'Master 1 — Semestre 8',       niveau: 'M1',    semestre: 'S8',  option: '' },
  { key: 'M2-S9',    label: 'Master 2 — Semestre 9',       niveau: 'M2',    semestre: 'S9',  option: '' },
  { key: 'M2-S10',   label: 'Master 2 — Semestre 10',      niveau: 'M2',    semestre: 'S10', option: '' },
];

// Toutes les matières à plat (pour recherche globale)
export const ALL_MAQUETTE_COURSES = Object.entries(MAQUETTE).flatMap(([niveauKey, courses]) =>
  courses.map(c => ({ ...c, niveauKey }))
);

// ─────────────────────────────────────────────────────────────
// Mapping : valeur niveau backend → clés NIVEAUX frontend
//
// Valeurs backend (Niveau choices) :
//   'L1', 'L2', 'L3-GL', 'L3-RT', 'M1', 'M2'
// Un responsable peut gérer PLUSIEURS niveaux (managed_filiere_niveaux).
// ─────────────────────────────────────────────────────────────
export const FILIERE_NIVEAUX = {
  L1:      ['L1-S1',    'L1-S2'],
  L2:      ['L2-S3',    'L2-S4'],
  'L3-GL': ['L3-GL-S5', 'L3-GL-S6'],
  'L3-RT': ['L3-RT-S5', 'L3-RT-S6'],
  M1:      ['M1-S7',    'M1-S8'],
  M2:      ['M2-S9',    'M2-S10'],
};

export const FILIERE_GROUPE_LABELS = {
  L1:      'Licence 1 (S1 + S2)',
  L2:      'Licence 2 (S3 + S4)',
  'L3-GL': 'L3 Génie Logiciel (S5 + S6)',
  'L3-RT': 'L3 Réseaux & Télécom (S5 + S6)',
  M1:      'Master 1',
  M2:      'Master 2',
};

/**
 * Retourne les niveaux FRONTEND que ce responsable gère.
 *
 * Source prioritaire : user.managedNiveaux (tableau renvoyé par l'API,
 * ex: ['L1','L2'] ou ['L3-GL','L3-RT']).
 * Fallback : user.filiereNiveau (valeur unique).
 * Si rien n'est trouvé : renvoie tous les NIVEAUX (cas admin / non configuré).
 */
export function getNiveauxUtilisateur(user) {
  if (!user) return NIVEAUX;

  // 1. Tableau managed_filiere_niveaux (source fiable du backend)
  const managed = Array.isArray(user.managedNiveaux) ? user.managedNiveaux : [];
  if (managed.length > 0) {
    const keys = managed.flatMap(n => FILIERE_NIVEAUX[n] || []);
    const result = NIVEAUX.filter(n => keys.includes(n.key));
    if (result.length > 0) return result;
  }

  // 2. Fallback : filiereNiveau unique
  const raw = (user.filiereNiveau || '').trim();
  if (raw && FILIERE_NIVEAUX[raw]) {
    return NIVEAUX.filter(n => FILIERE_NIVEAUX[raw].includes(n.key));
  }

  // 3. Dernier fallback : tout afficher (admin, non configuré)
  return NIVEAUX;
}

/**
 * Retourne un label lisible pour le périmètre de ce responsable.
 * Ex: "L1 + L2" ou "L3-GL + L3-RT" ou "Master 1 + Master 2"
 */
export function getGroupeLabel(user) {
  if (!user) return 'Licence Informatique';
  const managed = Array.isArray(user.managedNiveaux) ? user.managedNiveaux : [];
  if (managed.length > 0) {
    return managed.map(n => FILIERE_GROUPE_LABELS[n] || n).join(' + ');
  }
  const raw = (user.filiereNiveau || user.filiere || '').trim();
  return FILIERE_GROUPE_LABELS[raw] || raw || 'Licence Informatique';
}
