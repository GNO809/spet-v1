// ============================================================
// SPET — Sidebar Component
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, DoorOpen, Bell, Settings, LogOut,
  ScrollText, GraduationCap, BookOpenCheck,
  Calendar, ClipboardList, Clock, BarChart3,
  UserCheck, CheckCircle2, Mail, Phone,
  ChevronDown, FileText, Layers, Award, ExternalLink,
  Edit,
} from 'lucide-react';
import { useEffect, useRef, useState as _useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { getInitials } from '@/utils/helpers';
import { ROLE_LABELS } from '@/utils/constants';
import { getNiveauxUtilisateur } from '@/utils/constants';
import NotificationService from '@/services/notification.service';
import UserService from '@/services/user.service';

// ── Navigation config per role ───────────────────────────────
const NAV_CONFIG = {
  ADMIN: [
    { group: 'Général',   items: [{ label: 'Tableau de bord',      path: '/admin',          icon: LayoutDashboard }] },
    { group: 'Gestion',   items: [{ label: 'Utilisateurs',          path: '/admin/users',    icon: Users },
                                   { label: 'Salles',                path: '/admin/rooms',    icon: DoorOpen }] },
    { group: 'Académique',items: [{ label: 'Maquette pédagogique',  path: '/admin/maquette', icon: BookOpenCheck },
                                   { label: 'Filières & Niveaux',   path: '/admin/filieres', icon: GraduationCap }] },
    { group: 'Système',   items: [{ label: 'Journal système',       path: '/admin/archive',  icon: ScrollText },
                                   { label: 'Notifications',         path: '/notifications',  icon: Bell },
                                   { label: 'Paramètres',            path: '/settings',       icon: Settings }] },
  ],
  CHEF_DEPT: [
    { group: 'Général',    items: [{ label: 'Tableau de bord',       path: '/chef',             icon: LayoutDashboard }] },
    { group: 'Validation', items: [{ label: 'Validation EDT',        path: '/chef/validation',  icon: CheckCircle2, badgeKey: 'pendingEdts' },
                                    { label: 'Emplois du temps',     path: '/chef/timetables',  icon: Calendar }] },
    { group: 'Supervision',items: [{ label: 'Affectations des cours',path: '/chef/courses',     icon: ClipboardList }] },
    { group: 'Mon enseignement', items: [
                                    { label: 'Mon emploi du temps',  path: '/enseignant/timetable', icon: Calendar },
                                    { label: 'Mes séances',          path: '/enseignant/sessions',  icon: ClipboardList },
                                    { label: 'Mes disponibilités',   path: '/enseignant/avail',     icon: Clock }] },
    { group: 'Autres',     items: [{ label: 'Notifications',         path: '/notifications',    icon: Bell },
                                    { label: 'Paramètres',            path: '/settings',         icon: Settings }] },
  ],
  RESP_FIL: [
    { group: 'Général',        items: [{ label: 'Tableau de bord',       path: '/responsable',         icon: LayoutDashboard }] },
    { group: 'Emplois du temps',items: [{ label: "Gestion de l'emploi du temps", path: '/responsable/edts', icon: Calendar }] },
    { group: 'Gestion',        items: [{ label: 'Validation des profils',path: '/responsable/profils', icon: UserCheck, badgeKey: 'pendingProfiles' }] },
    { group: 'Mon enseignement', items: [
                                    { label: 'Mon emploi du temps',  path: '/enseignant/timetable', icon: Calendar },
                                    { label: 'Mes séances',          path: '/enseignant/sessions',  icon: ClipboardList },
                                    { label: 'Mes disponibilités',   path: '/enseignant/avail',     icon: Clock }] },
    { group: 'Autres',         items: [{ label: 'Notifications',         path: '/notifications',       icon: Bell },
                                        { label: 'Paramètres',            path: '/settings',            icon: Settings }] },
  ],
  ENSEIGNANT: [
    { group: 'Général',       items: [{ label: 'Mon tableau de bord',    path: '/enseignant',          icon: LayoutDashboard }] },
    { group: 'Mes cours',     items: [{ label: 'Mes matières affectées', path: '/enseignant/courses',  icon: BookOpenCheck },
                                       { label: 'Mon emploi du temps',   path: '/enseignant/timetable',icon: Calendar },
                                       { label: 'Mes séances',           path: '/enseignant/sessions', icon: ClipboardList }] },
    { group: 'Disponibilités',items: [{ label: 'Mes disponibilités',     path: '/enseignant/avail',    icon: Clock }] },
    { group: 'Autres',        items: [{ label: 'Notifications',          path: '/notifications',       icon: Bell },
                                       { label: 'Paramètres',            path: '/settings',            icon: Settings }] },
  ],
};

// ── Status config ─────────────────────────────────────────────
const STATUS_CFG = {
  INCOMPLET: { bg: 'rgba(251,191,36,0.25)',  c: '#fde68a', label: 'Incomplet' },
  COMPLET:   { bg: 'rgba(96,165,250,0.25)',  c: '#93c5fd', label: 'Complet'  },
  VALIDE:    { bg: 'rgba(52,211,153,0.25)',  c: '#6ee7b7', label: 'Validé'   },
  REJETE:    { bg: 'rgba(248,113,113,0.25)', c: '#fca5a5', label: 'Rejeté'   },
};

// ── NavItem ───────────────────────────────────────────────────
function NavItem({ item, badge }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.path.split('/').length <= 2}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px',
        borderRadius: isActive ? '0 10px 10px 0' : '10px',
        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.72)',
        background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
        fontWeight: isActive ? 600 : 400, fontSize: '14px',
        borderLeft: isActive ? '3px solid #93c5fd' : '3px solid transparent',
        boxShadow: isActive ? 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 2px 10px rgba(0,0,0,0.18)' : 'none',
        transition: 'all 0.18s ease', textDecoration: 'none',
      })}
      onMouseEnter={e => { if (e.currentTarget.style.background === 'transparent') e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { if (e.currentTarget.style.background === 'rgba(255,255,255,0.08)') e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Icon size={17} />
        {badge > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-7px',
            minWidth: '15px', height: '15px', borderRadius: '8px',
            background: '#ef4444', color: 'white', fontSize: '9px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            boxShadow: '0 0 0 2px rgba(30,58,138,0.8)',
          }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span style={{ flex: 1 }}>{item.label}</span>
    </NavLink>
  );
}

// ── Sidebar ───────────────────────────────────────────────────
export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { toast, notifCount, setNotifCount } = useNotification();
  const navigate = useNavigate();
  const [respBadges, setRespBadges]   = _useState({ pendingProfiles: 0, newCours: 0 });
  const [chefBadges, setChefBadges]   = _useState({ pendingEdts: 0 });
  const [profileOpen, setProfileOpen] = _useState(false);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!isAuthenticated) return;
    let prevCount = 0;
    const poll = async () => {
      try {
        const count = await NotificationService.getUnreadCount();
        setNotifCount(count);
        if (count > prevCount && prevCount !== 0) {
          const diff = count - prevCount;
          toastRef.current.info('Nouvelle notification',
            `${diff} nouvelle${diff > 1 ? 's' : ''} notification${diff > 1 ? 's' : ''}.`);
        }
        prevCount = count;
      } catch { /* noop */ }
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, setNotifCount]);

  useEffect(() => {
    if (user?.role !== 'CHEF_DEPT') return;
    const fetchChef = async () => {
      try {
        const { data } = await import('@/services/api').then(m => m.default.get('/planning/timetables/', { params: { status: 'EN_ATTENTE_VALIDATION', page_size: 1 } }));
        setChefBadges({ pendingEdts: data.count ?? 0 });
      } catch { /* silencieux */ }
    };
    fetchChef();
    const id = setInterval(fetchChef, 60000);
    return () => clearInterval(id);
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'RESP_FIL') return;
    const fetch = () =>
      UserService.getDashboardStats()
        .then(s => setRespBadges({ pendingProfiles: s.pendingProfiles ?? 0, newCours: s.newCours ?? 0 }))
        .catch(() => {});
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [user?.role]);

  const navGroups = NAV_CONFIG[user?.role] || [];

  function getBadge(item) {
    if (item.path === '/notifications')      return notifCount;
    if (item.badgeKey === 'pendingProfiles') return respBadges.pendingProfiles;
    if (item.badgeKey === 'newCours')        return respBadges.newCours;
    if (item.badgeKey === 'pendingEdts')     return chefBadges.pendingEdts;
    return 0;
  }

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion', 'Vous avez été déconnecté avec succès.');
    navigate('/login');
  };

  const st = STATUS_CFG[user?.profileStatus] || STATUS_CFG.INCOMPLET;
  const niveaux = user?.managedNiveaux?.length
    ? user.managedNiveaux
    : (user?.niveauxSouhaites || []);
  const profileEditPath = user?.role === 'ENSEIGNANT'
    ? '/enseignant/profile'
    : '/profile';

  return (
    <>
      {mobileOpen && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      <aside style={{
        position: 'fixed', left: 0, top: 0,
        width: '260px', height: '100vh',
        background: 'linear-gradient(180deg, #1e3a8a 0%, #1a56db 100%)',
        display: 'flex', flexDirection: 'column',
        zIndex: 100, overflowY: 'auto', overflowX: 'hidden',
        transition: 'transform 0.3s ease',
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}
      className={`app-sidebar${mobileOpen ? ' sidebar-open' : ''}`}
      >
        {/* ── Logo ── */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', background: 'white', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.3)', padding: '3px', flexShrink: 0, overflow: 'hidden',
          }}>
            <img src="/logo-ufr.jfif" alt="UFR"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span style="color:#1e3a8a;font-weight:700;font-size:13px">UFR</span>';
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '17px', lineHeight: 1.2 }}>SPET</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginTop: '1px' }}>UFR SET</div>
          </div>
        </div>

        {/* ── Profile block ── */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

          {/* Clickable header row */}
          <button
            onClick={() => setProfileOpen(o => !o)}
            style={{
              width: '100%', padding: '14px 16px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Avatar */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.25)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>
                      {getInitials(`${user?.firstName} ${user?.lastName}`)}
                    </span>
                }
              </div>
              {/* Name / role */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ROLE_LABELS[user?.role] || user?.email}
                </div>
              </div>
              <ChevronDown size={14} color="rgba(255,255,255,0.45)"
                style={{ flexShrink: 0, transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
            </div>
          </button>

          {/* Expandable profile details */}
          <div style={{
            overflow: 'hidden',
            maxHeight: profileOpen ? '600px' : '0',
            transition: 'max-height 0.3s ease',
          }}>
            <div style={{ padding: '0 14px 16px' }}>

              {/* Status badge — masqué si INCOMPLET */}
              {user?.profileStatus && user.profileStatus !== 'INCOMPLET' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                  borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                  background: st.bg, color: st.c, marginBottom: '12px',
                }}>
                  {st.label}
                </span>
              )}

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {user?.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={12} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }}/>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </span>
                  </div>
                )}

                {user?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={12} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }}/>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{user.phone}</span>
                  </div>
                )}

                {user?.grade && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={12} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }}/>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{user.grade}</span>
                  </div>
                )}

                {user?.specialite && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={12} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }}/>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{user.specialite}</span>
                  </div>
                )}

                {user?.filiere && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpenCheck size={12} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }}/>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>{user.filiere}</span>
                  </div>
                )}

                {/* Bio */}
                {user?.bio && (
                  <div style={{ marginTop: '2px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                      {user.bio.length > 120 ? user.bio.slice(0, 120) + '…' : user.bio}
                    </p>
                  </div>
                )}

                {/* Niveaux */}
                {niveaux.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                      <Layers size={11} color="rgba(255,255,255,0.4)"/>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Niveaux</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {niveaux.map(n => (
                        <span key={n} style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                          borderRadius: '6px', background: 'rgba(96,165,250,0.2)',
                          color: '#93c5fd', border: '1px solid rgba(96,165,250,0.3)',
                        }}>{n}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* CV */}
                {user?.cv && (
                  <a href={user.cv} target="_blank" rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '11px', color: '#93c5fd', fontWeight: 600,
                      textDecoration: 'none', marginTop: '2px',
                    }}>
                    <FileText size={12}/> Consulter le CV <ExternalLink size={10}/>
                  </a>
                )}
              </div>

              {/* Edit profile link — masqué pour l'admin */}
              {user?.role !== 'ADMIN' && (
                <button
                  onClick={() => { setProfileOpen(false); navigate(profileEditPath); }}
                  style={{
                    marginTop: '12px', width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '7px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                >
                  <Edit size={12}/> Modifier le profil
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {navGroups.map(group => (
            <div key={group.group}>
              <div style={{
                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '1.2px', color: 'rgba(255,255,255,0.4)',
                padding: '0 12px', marginBottom: '6px',
              }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map(item => (
                  <NavItem key={item.path} item={item} badge={getBadge(item)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div style={{ padding: '12px 16px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px',
              color: '#fca5a5', fontSize: '13px', padding: '9px 12px',
              display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', transition: 'all 0.15s ease', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
