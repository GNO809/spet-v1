// ============================================================
// SPET — Shared: Notifications + Paramétrage
// ============================================================

import { useState, useEffect } from 'react';
import {
  Bell, CheckCheck, Trash2, CheckCircle, AlertTriangle,
  Info, Clock,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationService from '@/services/notification.service';
import { formatRelative } from '@/utils/helpers';

const TYPE_CONFIG = {
  SUCCESS: { icon: CheckCircle,   color: '#10b981', bg: '#f0fdf4', label: 'Succès' },
  WARNING: { icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb', label: 'Avertissement' },
  ERROR:   { icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2', label: 'Alerte' },
  INFO:    { icon: Info,          color: '#3b82f6', bg: '#eff6ff', label: 'Information' },
};

function normalizeNotif(n) {
  return {
    id:      n.id,
    title:   n.title,
    message: n.message,
    type:    n.notif_type || n.type || 'INFO',
    read:    n.is_read ?? n.read ?? false,
    date:    n.created_at || n.date,
  };
}

// ── Onglets ───────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',     label: 'Toutes' },
  { id: 'unread',  label: 'Non lues' },
  { id: 'ERROR',   label: 'Alertes' },
  { id: 'INFO',    label: 'Informations' },
  { id: 'SUCCESS', label: 'Succès' },
];

// ── Page principale ───────────────────────────────────────────
export default function Notifications() {
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const { toast, setNotifCount } = useNotification();

  // Chargement initial + rafraîchissement automatique toutes les 30s
  useEffect(() => {
    let mounted = true;

    const fetchAll = async (initial = false) => {
      try {
        const data = await NotificationService.getAll({ page_size: 100 });
        if (!mounted) return;
        const normalized = (data ?? []).map(normalizeNotif);
        setNotifs(prev => {
          // Si de nouvelles notifs non lues arrivent, mettre à jour le badge global
          const newUnread = normalized.filter(n => !n.read).length;
          setNotifCount(newUnread);
          return normalized;
        });
      } catch { /* silence */ } finally {
        if (initial && mounted) setLoading(false);
      }
    };

    fetchAll(true);
    const id = setInterval(() => fetchAll(false), 30000);
    return () => { mounted = false; clearInterval(id); };
  }, [setNotifCount]);

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all')    return true;
    return n.type === filter;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = async id => {
    try {
      await NotificationService.markRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setNotifCount(prev => Math.max(0, prev - 1));
    } catch { toast.error('Erreur', 'Impossible de marquer comme lu.'); }
  };

  const markAllRead = async () => {
    try {
      await NotificationService.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setNotifCount(0);
      toast.success('Tout lu', 'Toutes les notifications sont marquées comme lues.');
    } catch { toast.error('Erreur', 'Impossible de marquer tout comme lu.'); }
  };

  const deleteNotif = async id => {
    try {
      await NotificationService.delete(id);
      const wasUnread = notifs.find(n => n.id === id && !n.read);
      setNotifs(prev => prev.filter(n => n.id !== id));
      if (wasUnread) setNotifCount(prev => Math.max(0, prev - 1));
    } catch { toast.error('Erreur', 'Impossible de supprimer.'); }
  };

  const clearRead = () => {
    const readIds = notifs.filter(n => n.read).map(n => n.id);
    setNotifs(prev => prev.filter(n => !readIds.includes(n.id)));
    toast.info('Nettoyage', 'Notifications lues effacées.');
  };

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Notifications</h2>
          <p className="text-subtitle">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {unreadCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
              <CheckCheck size={14} /> Tout marquer comme lu
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={clearRead}>
            <Trash2 size={14} /> Effacer les lues
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = f.id === 'all'    ? notifs.length
                      : f.id === 'unread' ? unreadCount
                      : notifs.filter(n => n.type === f.id).length;
          return (
            <button key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
              {f.label}
              {count > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: filter === f.id ? '#1a56db' : '#e2e8f0',
                  color: filter === f.id ? 'white' : '#64748b',
                  fontSize: '10px', fontWeight: 700,
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      <div style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0', overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Bell size={40} />
            <h3>Aucune notification</h3>
            <p>Rien à afficher pour ce filtre.</p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: n.read ? 'white' : cfg.bg,
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: cfg.bg, border: `1px solid ${cfg.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} color={cfg.color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: n.read ? 500 : 700, fontSize: '14px', color: '#1e293b' }}>{n.title}</span>
                    <span style={{
                      padding: '1px 7px', borderRadius: '20px',
                      background: cfg.bg, color: cfg.color,
                      fontSize: '10px', fontWeight: 600,
                    }}>{cfg.label}</span>
                    {!n.read && (
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1a56db', flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{n.message}</p>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', display: 'block' }}>
                    <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                    {formatRelative(n.date)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {!n.read && (
                    <button className="btn-icon" onClick={e => { e.stopPropagation(); markRead(n.id); }}
                      title="Marquer comme lu" style={{ width: '30px', height: '30px' }}>
                      <CheckCheck size={13} />
                    </button>
                  )}
                  <button className="btn-icon" onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                    title="Supprimer" style={{ width: '30px', height: '30px', color: '#ef4444' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
