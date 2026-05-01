// ============================================================
// SPET — Enseignant: Dashboard
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, BookOpen, Bell, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { getCurrentDateTime } from '@/utils/helpers';
import { NOTIF_TYPES } from '@/utils/constants';
import UserService from '@/services/user.service';
import NotificationService from '@/services/notification.service';

const dt = getCurrentDateTime();

const NOTIF_ICON = {
  SUCCESS: <CheckCircle size={16} color="#10b981" />,
  WARNING: <AlertTriangle size={16} color="#f59e0b" />,
  ERROR:   <AlertTriangle size={16} color="#ef4444" />,
  INFO:    <Bell size={16} color="#3b82f6" />,
};

export default function EnseignantDashboard() {
  const { user } = useAuth();
  const { toast } = useNotification();
  const [stats,        setStats]        = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      UserService.getDashboardStats(),
      NotificationService.getAll({ page_size: 3 }),
    ]).then(([s, n]) => {
      setStats(s);
      setNotifications(n);
    }).catch(() => toast.error('Erreur', 'Impossible de charger le tableau de bord.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  const data          = stats || {};
  const todaySessions = data.todaySessions || [];
  const courses       = data.courses       || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="welcome-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Bonjour, {user.firstName}</h2>
            <p style={{ marginTop: '4px' }}>{dt.full} · {user.department}</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{user.grade || 'Enseignant'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-enseignant" style={{ fontSize: '12px', padding: '5px 14px' }}>Enseignant</span>
            <div style={{ marginTop: '8px' }}>
              <StatusBadge status={user.profileStatus || 'INCOMPLET'} />
            </div>
          </div>
        </div>
      </div>

      {user.profileStatus === 'INCOMPLET' && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>Votre profil est incomplet. <Link to="/enseignant/profile" style={{ color: '#d97706', fontWeight: 600 }}>Compléter mon profil →</Link></span>
        </div>
      )}

      <div className="grid-4">
        <StatCard label="Mes cours"      value={courses.length}            sub="Ce semestre"         icon={BookOpen}  iconBg="#eff6ff" iconColor="#1a56db" />
        <StatCard label="Heures cours"   value={data.totalHours ?? 0}      sub="Volume horaire total" icon={Clock}     iconBg="#f0fdf4" iconColor="#10b981" />
        <StatCard label="Séances auj."   value={todaySessions.length}      sub={dt.day}               icon={Calendar}  iconBg="#fffbeb" iconColor="#d97706" />
        <StatCard label="Notifications"  value={data.unreadNotifs ?? 0}    sub="Non lues"             icon={Bell}      iconBg="#fdf4ff" iconColor="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Séances du jour */}
        <div className="card-flat">
          <div className="card-header">
            <div>
              <h3 className="card-title">Séances du jour — {dt.day}</h3>
              <p className="card-subtitle">{dt.date}</p>
            </div>
            <Link to="/enseignant/timetable" style={{ fontSize: '12px', color: '#1a56db', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Mon EDT complet <ChevronRight size={12} />
            </Link>
          </div>
          {todaySessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todaySessions.map((s, i) => {
                const colors      = { CM: '#dbeafe', TD: '#dcfce7', TP: '#fef3c7' };
                const textColors  = { CM: '#1e3a8a', TD: '#15803d', TP: '#b45309' };
                const borderColors = { CM: '#1a56db', TD: '#10b981', TP: '#f59e0b' };
                return (
                  <div key={i} style={{ display: 'flex', gap: '14px', padding: '12px 14px', borderRadius: '10px', background: colors[s.type] || '#f1f5f9', border: `1px solid ${borderColors[s.type] || '#e2e8f0'}` }}>
                    <div style={{ textAlign: 'center', minWidth: '48px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: textColors[s.type] || '#1e293b' }}>{s.start}</div>
                      <div style={{ fontSize: '10px', color: textColors[s.type] || '#64748b', opacity: 0.7 }}>{s.end}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: textColors[s.type] || '#1e293b' }}>{s.course}</div>
                      <div style={{ fontSize: '12px', color: textColors[s.type] || '#64748b', opacity: 0.8, marginTop: '2px' }}>
                        📍 {s.room} · 👥 {s.group}
                      </div>
                    </div>
                    <span style={{ alignSelf: 'center', padding: '2px 8px', borderRadius: '20px', background: borderColors[s.type] || '#64748b', color: 'white', fontSize: '10px', fontWeight: 700 }}>{s.type}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px' }}>
              <Calendar size={32} />
              <h3>Aucune séance aujourd'hui</h3>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card-flat">
          <div className="card-header">
            <h3 className="card-title">Notifications récentes</h3>
            <Link to="/notifications" style={{ fontSize: '12px', color: '#1a56db', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Toutes <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', padding: '16px 0' }}>Aucune notification</p>
            ) : (
              notifications.map((n, i) => (
                <div key={n.id} style={{ display: 'flex', gap: '10px', padding: '12px 0', borderBottom: i < notifications.length - 1 ? '1px solid #f1f5f9' : 'none', opacity: n.read ? 0.7 : 1 }}>
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>{NOTIF_ICON[n.notif_type || n.type] || NOTIF_ICON.INFO}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 400 : 600, fontSize: '13px', color: '#1e293b' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>{n.message}</div>
                  </div>
                  {!n.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1a56db', flexShrink: 0, marginTop: '5px' }} />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
