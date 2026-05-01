// ============================================================
// SPET — Admin Dashboard
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Users, DoorOpen, AlertTriangle, CheckCircle,
  BookOpen, RefreshCw, X, TrendingUp, BarChart3,
  Clock, Activity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { getCurrentDateTime } from '@/utils/helpers';
import UserService from '@/services/user.service';
import RoomService from '@/services/room.service';
import AcademicsService from '@/services/academics.service';
import TimetableService from '@/services/timetable.service';

const dt = getCurrentDateTime();

// ── Maquette DIT (données statiques pédagogiques) ────────────
const VHT_NIVEAUX = [
  { code: 'L1',    label: 'Licence 1',   cm: 210, td: 150, tp: 60,  color: '#1a56db', ecues: 16 },
  { code: 'L2',    label: 'Licence 2',   cm: 195, td: 145, tp: 75,  color: '#0ea5e9', ecues: 19 },
  { code: 'L3-GL', label: 'L3 GL',       cm: 150, td: 120, tp: 60,  color: '#10b981', ecues: 14 },
  { code: 'L3-RT', label: 'L3 RT',       cm: 145, td: 115, tp: 65,  color: '#34d399', ecues: 14 },
  { code: 'M1',    label: 'Master 1',    cm: 120, td: 90,  tp: 45,  color: '#8b5cf6', ecues: 10 },
  { code: 'M2',    label: 'Master 2',    cm: 110, td: 85,  tp: 40,  color: '#a78bfa', ecues: 10 },
];

const JOURS    = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const CRENEAUX = ['08h–10h', '10h–12h', '14h–16h', '16h–18h'];

// correspondance backend day → index JOURS
const DAY_IDX = {
  MON: 0, LUN: 0, LUNDI: 0,
  TUE: 1, MAR: 1, MARDI: 1,
  WED: 2, MER: 2, MERCREDI: 2,
  THU: 3, JEU: 3, JEUDI: 3,
  FRI: 4, VEN: 4, VENDREDI: 4,
  SAT: 5, SAM: 5, SAMEDI: 5,
};

// correspondance heure de début → index CRENEAUX
function slotIndex(start) {
  if (!start) return -1;
  const h = parseInt(start.split(':')[0], 10);
  if (h === 8)  return 0;
  if (h === 10) return 1;
  if (h === 14) return 2;
  if (h === 16) return 3;
  return -1;
}

function heatColor(pct) {
  if (pct >= 90) return { bg: '#1e3a8a', text: '#fff' };
  if (pct >= 70) return { bg: '#1a56db', text: '#fff' };
  if (pct >= 50) return { bg: '#60a5fa', text: '#1e3a8a' };
  if (pct >= 30) return { bg: '#bfdbfe', text: '#1e3a8a' };
  return { bg: '#eff6ff', text: '#94a3b8' };
}

// ── WelcomeCard ──────────────────────────────────────────────
function WelcomeCard({ user, onRefresh, refreshing }) {
  return (
    <div className="welcome-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
      <div>
        <h2 style={{ margin: 0 }}>Bonjour, {user?.firstName}</h2>
        <p style={{ marginTop: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{dt.full} — {dt.time}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>Administrateur</span>
        <button
          onClick={onRefresh} disabled={refreshing}
          style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 600,
            padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, loading }) {
  return (
    <div className="stat-card" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div className="stat-icon" style={{ background: iconBg }}>
        <Icon size={22} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {loading ? <span style={{ fontSize: '16px', color: '#94a3b8' }}>—</span> : value}
        </div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Volume horaire par niveau (données maquette statiques) ───
function VHTChart() {
  const maxTotal = Math.max(...VHT_NIVEAUX.map(n => n.cm + n.td + n.tp));
  return (
    <div className="card-flat">
      <div className="card-header">
        <div>
          <h3 className="card-title">Volume Horaire Total par Niveau</h3>
          <p className="card-subtitle">Répartition CM · TD · TP — Maquette DIT</p>
        </div>
        <BarChart3 size={18} color="#94a3b8" />
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['CM', '#1a56db'], ['TD', '#60a5fa'], ['TP / TPE', '#bfdbfe']].map(([l, c]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: c, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {VHT_NIVEAUX.map(n => {
          const total = n.cm + n.td + n.tp;
          const pctCm = (n.cm / total) * 100;
          const pctTd = (n.td / total) * 100;
          const pctTp = (n.tp / total) * 100;
          const barWidth = (total / maxTotal) * 100;
          return (
            <div key={n.code}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{n.label}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{n.ecues} UE</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{total}h</span>
              </div>
              <div style={{ height: '20px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', width: `${barWidth}%`, minWidth: '40%' }}>
                <div style={{ display: 'flex', height: '100%' }}>
                  <div title={`CM : ${n.cm}h`} style={{ width: `${pctCm}%`, background: '#1a56db' }} />
                  <div title={`TD : ${n.td}h`} style={{ width: `${pctTd}%`, background: '#60a5fa' }} />
                  <div title={`TP : ${n.tp}h`} style={{ width: `${pctTp}%`, background: '#bfdbfe' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '3px' }}>
                <span style={{ fontSize: '10px', color: '#1a56db', fontWeight: 600 }}>CM {n.cm}h</span>
                <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 600 }}>TD {n.td}h</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>TP {n.tp}h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Répartition CM/TD/TP (anneau) ────────────────────────────
function RepartitionChart() {
  const totCm = VHT_NIVEAUX.reduce((s, n) => s + n.cm, 0);
  const totTd = VHT_NIVEAUX.reduce((s, n) => s + n.td, 0);
  const totTp = VHT_NIVEAUX.reduce((s, n) => s + n.tp, 0);
  const grand = totCm + totTd + totTp;
  const segments = [
    { label: 'Cours Magistraux', val: totCm, pct: Math.round((totCm / grand) * 100), color: '#1a56db' },
    { label: 'Travaux Dirigés',  val: totTd, pct: Math.round((totTd / grand) * 100), color: '#60a5fa' },
    { label: 'TP / TPE',         val: totTp, pct: Math.round((totTp / grand) * 100), color: '#bfdbfe' },
  ];
  let acc = 0;
  const stops = segments.map(s => { const start = acc; acc += s.pct; return `${s.color} ${start}% ${acc}%`; }).join(', ');
  return (
    <div className="card-flat">
      <div className="card-header">
        <div>
          <h3 className="card-title">Répartition globale des heures</h3>
          <p className="card-subtitle">CM · TD · TP — ensemble de la maquette</p>
        </div>
        <TrendingUp size={18} color="#94a3b8" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: `conic-gradient(${stops})`, boxShadow: '0 4px 20px rgba(26,86,219,0.15)' }} />
          <div style={{ position: 'absolute', inset: '22px', borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{grand}h</div>
            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {segments.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{s.val}h — <strong style={{ color: s.color }}>{s.pct}%</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Heatmap occupation réelle des salles ─────────────────────
function HeatmapChart({ sessions, totalRooms }) {
  // Construire la grille depuis les vraies séances
  const grid = Array.from({ length: 6 }, () => Array(4).fill(0));

  sessions.forEach(s => {
    const di = DAY_IDX[(s.day || '').toUpperCase()];
    const ci = slotIndex(s.start);
    if (di !== undefined && ci !== -1) grid[di][ci]++;
  });

  const roomCount = totalRooms || 1;
  const hasData = sessions.length > 0;

  return (
    <div className="card-flat">
      <div className="card-header">
        <div>
          <h3 className="card-title">Occupation des salles</h3>
          <p className="card-subtitle">% des salles occupées par créneau</p>
        </div>
        <Activity size={18} color="#94a3b8" />
      </div>

      {!hasData ? (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94a3b8' }}>
          <Activity size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          <div style={{ fontSize: '13px', fontWeight: 500 }}>Aucune séance planifiée</div>
          <div style={{ fontSize: '11px', marginTop: '4px' }}>Les données apparaîtront une fois les EDT générés</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '360px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(4, 1fr)', gap: '4px', marginBottom: '4px' }}>
              <div />
              {CRENEAUX.map(c => (
                <div key={c} style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textAlign: 'center', padding: '3px 0' }}>{c}</div>
              ))}
            </div>
            {grid.map((row, ji) => (
              <div key={ji} style={{ display: 'grid', gridTemplateColumns: '48px repeat(4, 1fr)', gap: '4px', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center' }}>{JOURS[ji]}</div>
                {row.map((count, ci) => {
                  const pct = Math.round((count / roomCount) * 100);
                  const { bg, text } = heatColor(pct);
                  return (
                    <div key={ci} title={`${JOURS[ji]} ${CRENEAUX[ci]} : ${count} séance(s) — ${pct}%`}
                      style={{ background: bg, color: text, borderRadius: '6px', padding: '8px 2px', textAlign: 'center', fontSize: '11px', fontWeight: 700 }}>
                      {pct}%
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Occupation :</span>
        {[['< 30%', '#eff6ff', '#1e293b'], ['30–50%', '#bfdbfe', '#1e293b'], ['50–70%', '#60a5fa', '#fff'], ['70–90%', '#1a56db', '#fff'], ['> 90%', '#1e3a8a', '#fff']].map(([l, bg, fg]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748b' }}>
            <span style={{ width: '14px', height: '10px', background: bg, borderRadius: '2px', border: '1px solid #e2e8f0', display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Conflits & alertes (données réelles) ─────────────────────
function ConflictsWidget({ conflits }) {
  const errors   = conflits.filter(c => c.type === 'error').length;
  const warnings = conflits.filter(c => c.type === 'warning').length;
  return (
    <div className="card-flat">
      <div className="card-header">
        <div>
          <h3 className="card-title">Conflits & alertes</h3>
          <p className="card-subtitle">
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{errors} erreur{errors !== 1 ? 's' : ''}</span>
            {' · '}
            <span style={{ color: '#d97706', fontWeight: 600 }}>{warnings} avert.</span>
          </p>
        </div>
        <AlertTriangle size={18} color={conflits.length > 0 ? '#f59e0b' : '#10b981'} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {conflits.map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '9px',
            padding: '9px 11px',
            background: c.type === 'error' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${c.type === 'error' ? '#fecaca' : '#fde68a'}`,
            borderLeft: `3px solid ${c.type === 'error' ? '#ef4444' : '#f59e0b'}`,
            borderRadius: '6px',
          }}>
            <AlertTriangle size={13} color={c.type === 'error' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ flex: 1, fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{c.msg}</span>
          </div>
        ))}
        {conflits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#10b981' }}>
            <CheckCircle size={26} style={{ margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Aucun conflit détecté</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Tous les emplois du temps sont cohérents</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Charge horaire réelle des enseignants ────────────────────
function EnseignantsCharge({ sessions }) {
  const teacherMap = {};
  sessions.forEach(s => {
    if (!s.teacherId || !s.teacher) return;
    if (!teacherMap[s.teacherId]) teacherMap[s.teacherId] = { nom: s.teacher, minutes: 0 };
    teacherMap[s.teacherId].minutes += s.duration || 120;
  });

  const top5 = Object.values(teacherMap)
    .map(t => ({ ...t, heures: Math.round((t.minutes / 60) * 10) / 10 }))
    .sort((a, b) => b.heures - a.heures)
    .slice(0, 5);

  const maxH = top5.length > 0 ? Math.max(...top5.map(t => t.heures)) : 1;

  return (
    <div className="card-flat">
      <div className="card-header">
        <div>
          <h3 className="card-title">Charge des enseignants</h3>
          <p className="card-subtitle">Heures planifiées — Top 5</p>
        </div>
        <Clock size={18} color="#94a3b8" />
      </div>

      {top5.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94a3b8' }}>
          <Clock size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          <div style={{ fontSize: '13px', fontWeight: 500 }}>Aucune séance planifiée</div>
          <div style={{ fontSize: '11px', marginTop: '4px' }}>Les données apparaîtront une fois les EDT générés</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {top5.map((e, i) => {
            const colors = ['#1a56db', '#10b981', '#8b5cf6', '#f59e0b', '#0ea5e9'];
            const color = colors[i] || '#1a56db';
            const pct = (e.heures / maxH) * 100;
            return (
              <div key={e.nom}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {e.nom}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color }}>{e.heures}h</span>
                </div>
                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Disponibilité salles ──────────────────────────────────────
function RoomsAvailability({ rooms }) {
  const [filter, setFilter] = useState('all');
  const statusCfg = {
    available:   { color: '#10b981', bg: '#f0fdf4', label: 'Libre' },
    occupied:    { color: '#ef4444', bg: '#fef2f2', label: 'Occupée' },
    maintenance: { color: '#94a3b8', bg: '#f8fafc', label: 'Maintenance' },
  };
  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);
  const counts = {
    available:   rooms.filter(r => r.status === 'available').length,
    occupied:    rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  };
  return (
    <div className="card-flat">
      <div className="card-header">
        <div>
          <h3 className="card-title">Salles — état actuel</h3>
          <p className="card-subtitle">
            <span style={{ color: '#10b981', fontWeight: 600 }}>{counts.available} libres</span>
            {' · '}
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{counts.occupied} occupées</span>
            {counts.maintenance > 0 && ` · ${counts.maintenance} maintenance`}
          </p>
        </div>
        <DoorOpen size={18} color="#94a3b8" />
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {[['all', 'Toutes'], ['available', 'Libres'], ['occupied', 'Occupées']].map(([v, l]) => (
          <button key={v} className={`chip ${filter === v ? 'active' : ''}`}
            onClick={() => setFilter(v)} style={{ fontSize: '11px', padding: '3px 10px' }}>{l}</button>
        ))}
      </div>
      {rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>Aucune salle enregistrée</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', maxHeight: '160px', overflowY: 'auto' }}>
          {filtered.map(s => {
            const cfg = statusCfg[s.status] || statusCfg.available;
            return (
              <div key={s.id || s.name} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 7px', borderRadius: '6px',
                background: cfg.bg, border: `1px solid ${cfg.color}30`, fontSize: '11px',
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ──────────────────────────────────────
export default function AdminDashboard() {
  const { user }  = useAuth();
  const { toast } = useNotification();

  const [stats,      setStats]      = useState({ totalUsers: 0, totalEnseignants: 0, totalRooms: 0, availableRooms: 0, totalMatieres: 0, totalConflits: 0 });
  const [rooms,      setRooms]      = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [conflits,   setConflits]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [usersRes, teachersRes, roomsRes, coursesRes, timetablesRes, sessionsRes] = await Promise.allSettled([
        UserService.getAll({ page_size: 1 }),
        UserService.getTeachers(),
        RoomService.getAll({ page_size: 500 }),
        AcademicsService.getCourses({ page_size: 1 }),
        TimetableService.getAll({ page_size: 200 }),
        TimetableService.getSessions({ page_size: 2000 }),
      ]);

      const totalUsers = usersRes.status === 'fulfilled'
        ? (usersRes.value.count ?? usersRes.value.results?.length ?? 0) : 0;

      const totalEnseignants = teachersRes.status === 'fulfilled'
        ? (Array.isArray(teachersRes.value) ? teachersRes.value.length : 0) : 0;

      const roomArr = roomsRes.status === 'fulfilled'
        ? (Array.isArray(roomsRes.value) ? roomsRes.value : []) : [];

      const totalCourses = coursesRes.status === 'fulfilled'
        ? (coursesRes.value.count ?? coursesRes.value.results?.length ?? 0) : 0;

      const timetables = timetablesRes.status === 'fulfilled'
        ? (timetablesRes.value.results ?? []) : [];

      const sessionArr = sessionsRes.status === 'fulfilled'
        ? (Array.isArray(sessionsRes.value) ? sessionsRes.value : []) : [];

      // Conflits réels : un item par EDT qui a des conflits
      const conflitItems = timetables
        .filter(t => t.conflictsCount > 0)
        .map(t => ({
          id: t.id,
          type: 'error',
          msg: `EDT ${t.filiere} — Sem. ${t.semester} · ${t.conflictsCount} conflit(s) détecté(s)`,
        }));

      // EDTs en attente de validation → avertissements
      const pendingItems = timetables
        .filter(t => t.status === 'EN_ATTENTE_VALIDATION')
        .map(t => ({
          id: `pending-${t.id}`,
          type: 'warning',
          msg: `EDT ${t.filiere} — Sem. ${t.semester} · en attente de validation`,
        }));

      const totalConflits = timetables.reduce((s, t) => s + (t.conflictsCount || 0), 0);
      const MAQUETTE_TOTAL = VHT_NIVEAUX.reduce((s, n) => s + n.ecues, 0);

      setRooms(roomArr);
      setSessions(sessionArr);
      setConflits([...conflitItems, ...pendingItems]);
      setStats({
        totalUsers,
        totalEnseignants,
        totalRooms:      roomArr.length,
        availableRooms:  roomArr.filter(r => r.status === 'available').length,
        totalMatieres:   totalCourses > 0 ? totalCourses : MAQUETTE_TOTAL,
        totalConflits,
      });
    } catch {
      toast.error('Erreur', 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className="loader" style={{ margin: '60px auto' }} />;

  const occupPct = stats.totalRooms > 0
    ? Math.round(((stats.totalRooms - stats.availableRooms) / stats.totalRooms) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', animation: 'fadeIn 0.3s ease' }}>

      <WelcomeCard user={user} onRefresh={() => fetchStats(true)} refreshing={refreshing} />

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="kpi-grid">
        <StatCard
          label="Utilisateurs actifs"
          value={stats.totalUsers}
          sub={`dont ${stats.totalEnseignants} enseignant${stats.totalEnseignants !== 1 ? 's' : ''}`}
          icon={Users} iconBg="#eff6ff" iconColor="#1a56db"
        />
        <StatCard
          label="Salles disponibles"
          value={`${stats.availableRooms} / ${stats.totalRooms}`}
          sub={`${occupPct}% d'occupation`}
          icon={DoorOpen} iconBg="#f0fdf4" iconColor="#10b981"
        />
        <StatCard
          label="UE"
          value={stats.totalMatieres}
          sub="L1 → M2, tous semestres"
          icon={BookOpen} iconBg="#fdf4ff" iconColor="#8b5cf6"
        />
        <StatCard
          label="Conflits détectés"
          value={stats.totalConflits}
          sub={stats.totalConflits === 0 ? 'Aucun conflit' : `${stats.totalConflits} conflit(s) à résoudre`}
          icon={AlertTriangle}
          iconBg={stats.totalConflits > 0 ? '#fffbeb' : '#f0fdf4'}
          iconColor={stats.totalConflits > 0 ? '#d97706' : '#10b981'}
        />
      </div>

      {/* Ligne 2 : VHT + Répartition */}
      <div className="dashboard-charts-row" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
        <VHTChart />
        <RepartitionChart />
      </div>

      {/* Ligne 3 : Heatmap + Conflits */}
      <div className="dashboard-widgets-row" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
        <HeatmapChart sessions={sessions} totalRooms={stats.totalRooms} />
        <ConflictsWidget conflits={conflits} />
      </div>

      {/* Ligne 4 : Charge + Salles */}
      <div className="dashboard-bottom-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <EnseignantsCharge sessions={sessions} />
        <RoomsAvailability rooms={rooms} />
      </div>
    </div>
  );
}
