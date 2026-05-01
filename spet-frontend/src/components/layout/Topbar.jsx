// ============================================================
// SPET — Topbar Component
// ============================================================

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Menu, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { getInitials, getCurrentDateTime } from '@/utils/helpers';

// ── Page title map ─────────────────────────────────────────────
const PAGE_TITLES = {
  // ── Admin ──────────────────────────────────────────────────
  '/admin':            { title: 'Tableau de bord',          breadcrumb: ['Admin'] },
  '/admin/users':      { title: 'Gestion des utilisateurs', breadcrumb: ['Admin', 'Utilisateurs'] },
  '/admin/rooms':      { title: 'Gestion des salles',       breadcrumb: ['Admin', 'Salles'] },
  '/admin/filieres':   { title: 'Filières & Niveaux',       breadcrumb: ['Admin', 'Filières'] },
  '/admin/maquette':   { title: 'Maquette pédagogique',     breadcrumb: ['Admin', 'Maquette'] },
  '/admin/archive':    { title: 'Journal système',          breadcrumb: ['Admin', 'Archive'] },
  // ── Chef de Département ────────────────────────────────────
  '/chef':             { title: 'Tableau de bord',          breadcrumb: ['Chef Département'] },
  '/chef/courses':     { title: 'Affectations des cours',   breadcrumb: ['Chef Département', 'Affectations'] },
  '/chef/timetables':  { title: 'Emplois du temps',         breadcrumb: ['Chef Département', 'EDT'] },
  '/chef/validation':  { title: 'Validation EDT',           breadcrumb: ['Chef Département', 'Validation'] },
  '/chef/exports':     { title: 'Export',                   breadcrumb: ['Chef Département', 'Export'] },
  // ── Responsable de Filière ─────────────────────────────────
  '/responsable':      { title: 'Tableau de bord',          breadcrumb: ['Resp. Filière'] },
  '/responsable/edts': { title: "Gestion de l'emploi du temps", breadcrumb: ['Resp. Filière', 'EDT'] },
  '/responsable/profils': { title: 'Validation des profils',breadcrumb: ['Resp. Filière', 'Profils'] },
  // ── Enseignant ─────────────────────────────────────────────
  '/enseignant':           { title: 'Mon tableau de bord',  breadcrumb: ['Enseignant'] },
  '/enseignant/profile':   { title: 'Mon profil',           breadcrumb: ['Enseignant', 'Profil'] },
  '/enseignant/courses':   { title: 'Mes matières',         breadcrumb: ['Enseignant', 'Matières'] },
  '/enseignant/timetable': { title: 'Mon emploi du temps',  breadcrumb: ['Enseignant', 'EDT'] },
  '/enseignant/sessions':  { title: 'Mes séances',          breadcrumb: ['Enseignant', 'Séances'] },
  '/enseignant/avail':     { title: 'Mes disponibilités',   breadcrumb: ['Enseignant', 'Disponibilités'] },
  // ── Commun ─────────────────────────────────────────────────
  '/notifications':    { title: 'Notifications',            breadcrumb: ['Notifications'] },
  '/settings':         { title: 'Paramètres',               breadcrumb: ['Paramètres'] },
};

// ── Datetime live clock ────────────────────────────────────────
function LiveClock() {
  const [dt, setDt] = useState(getCurrentDateTime());

  useEffect(() => {
    const interval = setInterval(() => setDt(getCurrentDateTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span>{dt.day}</span>
      <span style={{ color: '#cbd5e1' }}>|</span>
      <span>{dt.date}</span>
      <span style={{ color: '#cbd5e1' }}>|</span>
      <strong style={{ color: '#1e293b' }}>{dt.time}</strong>
    </span>
  );
}

// ── Topbar ─────────────────────────────────────────────────────
export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const { notifCount } = useNotification();
  const location = useLocation();

  const pageInfo = PAGE_TITLES[location.pathname] || {
    title: 'SPET',
    breadcrumb: ['UFR SET'],
  };

  return (
    <header style={{
      position: 'sticky',
      top: '4px',
      height: '56px',
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(226,232,240,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      zIndex: 50,
      boxShadow: '0 2px 24px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
    }}>
      {/* Left — breadcrumb + mobile menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onMenuClick}
          style={{
            background: 'none', border: 'none',
            color: '#64748b', cursor: 'pointer',
            padding: '6px', borderRadius: '8px',
            display: 'flex', alignItems: 'center',
          }}
          className="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>

        <nav className="topbar-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>UFR SET</span>
          {pageInfo.breadcrumb.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ChevronRight size={12} color="#cbd5e1" />
              <span style={{
                fontSize: '12px',
                color: i === pageInfo.breadcrumb.length - 1 ? '#1a56db' : '#94a3b8',
                fontWeight: i === pageInfo.breadcrumb.length - 1 ? 500 : 400,
              }}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Center — page title */}
      <span className="topbar-title" style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '15px',
        fontWeight: 600,
        color: '#1e293b',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        {pageInfo.title}
      </span>

      {/* Right — clock, notifs, avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span className="topbar-clock"><LiveClock /></span>

        {/* Notifications bell */}
        <Link to="/notifications" style={{ position: 'relative', color: '#64748b', display: 'flex' }}>
          <Bell size={20} />
          {notifCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px', right: '-6px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
              width: '18px', height: '18px',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid white',
            }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e3a8a, #1a56db)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            fontSize: '13px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {getInitials(`${user?.firstName} ${user?.lastName}`)}
          </div>
          <span className="topbar-username" style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
            {user?.firstName}
          </span>
        </Link>
      </div>
    </header>
  );
}
