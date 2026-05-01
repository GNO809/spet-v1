// ============================================================
// SPET — Journal du Système
// Données réelles via /api/v1/audit/logs/
// ============================================================

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ScrollText, Search, X, RefreshCw, Download, ChevronDown,
  User, BookOpen, DoorOpen, Calendar, Shield, Settings,
  LogIn, LogOut, Plus, Edit2, Trash2, CheckCircle,
  AlertTriangle, XCircle, Eye, Activity, Zap,
  Radio,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';

// ── Constantes ───────────────────────────────────────────────
const ACTIONS = {
  LOGIN:    { label: 'LOGIN',    color: '#10b981', Icon: LogIn },
  LOGOUT:   { label: 'LOGOUT',  color: '#64748b', Icon: LogOut },
  CREATE:   { label: 'CREATE',  color: '#1a56db', Icon: Plus },
  UPDATE:   { label: 'UPDATE',  color: '#f59e0b', Icon: Edit2 },
  DELETE:   { label: 'DELETE',  color: '#ef4444', Icon: Trash2 },
  PUBLISH:  { label: 'PUBLISH', color: '#8b5cf6', Icon: Zap },
  VALIDATE: { label: 'VALID.',  color: '#10b981', Icon: CheckCircle },
  REJECT:   { label: 'REJECT',  color: '#ef4444', Icon: XCircle },
  VIEW:     { label: 'VIEW',    color: '#0ea5e9', Icon: Eye },
  EXPORT:   { label: 'EXPORT',  color: '#64748b', Icon: Download },
  ERROR:    { label: 'ERROR',   color: '#ef4444', Icon: XCircle },
  WARNING:  { label: 'WARN',    color: '#f59e0b', Icon: AlertTriangle },
};

const MODULES = {
  AUTH:      { label: 'AUTH',      Icon: Shield },
  USERS:     { label: 'USERS',     Icon: User },
  MAQUETTE:  { label: 'MAQUETTE',  Icon: BookOpen },
  ROOMS:     { label: 'ROOMS',     Icon: DoorOpen },
  TIMETABLE: { label: 'TIMETABLE', Icon: Calendar },
  SETTINGS:  { label: 'SETTINGS',  Icon: Settings },
  SYSTEM:    { label: 'SYSTEM',    Icon: Activity },
};

const SEVERITY = {
  INFO:    { color: '#0ea5e9', dot: '#0ea5e9', label: 'INFO' },
  SUCCESS: { color: '#10b981', dot: '#10b981', label: 'OK' },
  WARNING: { color: '#f59e0b', dot: '#f59e0b', label: 'WARN' },
  ERROR:   { color: '#ef4444', dot: '#ef4444', label: 'ERR' },
};

// ── Utilitaires temps ────────────────────────────────────────
function ts(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function relTs(isoStr) {
  if (!isoStr) return '—';
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s`;
  if (diff < 3600)  return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}j`;
}

// ── Composants de badge ───────────────────────────────────────
function ActionTag({ action }) {
  const cfg = ACTIONS[action] || ACTIONS.VIEW;
  const Ico = cfg.Icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 800,
      background: `${cfg.color}18`, color: cfg.color,
      fontFamily: 'monospace', letterSpacing: '0.3px', whiteSpace: 'nowrap',
      border: `1px solid ${cfg.color}30`,
    }}>
      <Ico size={9} />
      {cfg.label}
    </span>
  );
}

function ModuleTag({ module }) {
  const cfg = MODULES[module] || MODULES.SYSTEM;
  const Ico = cfg.Icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
      background: '#f1f5f9', color: '#475569',
      fontFamily: 'monospace', whiteSpace: 'nowrap',
    }}>
      <Ico size={9} />
      {cfg.label}
    </span>
  );
}

// ── Entrée de log (timeline) ─────────────────────────────────
function LogEntry({ log, expanded, onToggle }) {
  const sev = SEVERITY[log.severity] || SEVERITY.INFO;

  return (
    <div style={{
      position: 'relative',
      paddingLeft: '28px',
      borderLeft: `2px solid ${expanded ? sev.color : '#e2e8f0'}`,
      marginLeft: '10px',
      transition: 'border-color 0.2s ease',
    }}>
      <div style={{
        position: 'absolute', left: '-7px', top: '14px',
        width: '12px', height: '12px', borderRadius: '50%',
        background: sev.dot, border: '2px solid #fff',
        boxShadow: `0 0 0 2px ${sev.dot}40`, flexShrink: 0,
      }} />

      <div
        onClick={onToggle}
        style={{
          background: expanded ? `${sev.color}08` : '#fafafa',
          border: `1px solid ${expanded ? sev.color + '30' : '#f1f5f9'}`,
          borderRadius: '8px', padding: '10px 14px', marginBottom: '8px',
          cursor: 'pointer', transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#f8fafc'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = '#fafafa'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8',
            background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {ts(log.timestamp)}
          </span>
          <ActionTag action={log.action} />
          <ModuleTag module={log.module} />
          <span style={{
            flex: 1, fontSize: '12px', color: '#1e293b', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: '100px',
          }} title={log.detail}>
            {log.detail}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{log.user_display}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}>{log.ip_address || '—'}</span>
          </div>
          <span style={{
            fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
            color: sev.color, flexShrink: 0,
          }}>{relTs(log.timestamp)}</span>
          <ChevronDown size={13} color="#94a3b8" style={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease', flexShrink: 0,
          }} />
        </div>
      </div>

      {expanded && (
        <div style={{
          background: '#fff', border: `1px solid ${sev.color}30`,
          borderLeft: `3px solid ${sev.color}`, borderRadius: '6px',
          padding: '12px 16px', marginBottom: '10px', marginTop: '-6px',
          fontFamily: 'monospace', fontSize: '11px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {[
              ['ID',          `#${log.id}`],
              ['Horodatage',  ts(log.timestamp)],
              ['Action',      ACTIONS[log.action]?.label || log.action],
              ['Module',      MODULES[log.module]?.label || log.module],
              ['Utilisateur', log.user_display],
              ['Adresse IP',  log.ip_address || '—'],
              ['Cible',       log.target || '—'],
              ['Gravité',     SEVERITY[log.severity]?.label || log.severity],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontSize: '11px', color: '#374151', fontWeight: 600, wordBreak: 'break-all' }}>{v}</div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Description</div>
              <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: 500, lineHeight: 1.6, fontFamily: 'inherit' }}>{log.detail}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Barre de stats ────────────────────────────────────────────
function StatBar({ logs }) {
  const now = Date.now();
  const today    = logs.filter(l => (now - new Date(l.timestamp).getTime()) < 86400000).length;
  const lastHour = logs.filter(l => (now - new Date(l.timestamp).getTime()) < 3600000).length;
  const errors   = logs.filter(l => l.severity === 'ERROR').length;
  const warnings = logs.filter(l => l.severity === 'WARNING').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }} className="kpi-grid">
      {[
        { label: "Aujourd'hui",   value: today,    color: '#1a56db', bg: '#eff6ff',  Icon: Activity },
        { label: 'Dernière heure', value: lastHour, color: '#8b5cf6', bg: '#fdf4ff',  Icon: Radio },
        { label: 'Erreurs',        value: errors,   color: '#ef4444', bg: '#fef2f2',  Icon: XCircle },
        { label: 'Avertissements', value: warnings, color: '#f59e0b', bg: '#fffbeb',  Icon: AlertTriangle },
      ].map(it => (
        <div key={it.label} style={{
          background: it.bg, borderRadius: '10px', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
          border: `1px solid ${it.color}20`,
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: `${it.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <it.Icon size={18} color={it.color} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: it.color, lineHeight: 1 }}>{it.value}</div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>{it.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Séparateur de date ────────────────────────────────────────
function DateSep({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0 6px 10px' }}>
      <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      <span style={{
        fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase',
        letterSpacing: '1px', fontFamily: 'monospace', background: '#f8fafc',
        padding: '2px 10px', borderRadius: '20px', border: '1px solid #e2e8f0',
      }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
    </div>
  );
}

function groupByDate(logs) {
  const groups = {};
  const now = new Date();
  const yd  = new Date(now); yd.setDate(yd.getDate() - 1);
  logs.forEach(l => {
    const d = new Date(l.timestamp);
    let label;
    if (d.toDateString() === now.toDateString())     label = "Aujourd'hui";
    else if (d.toDateString() === yd.toDateString()) label = 'Hier';
    else label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(l);
  });
  return groups;
}

// ── Page principale ───────────────────────────────────────────
export default function AdminJournal() {
  const { toast } = useNotification();

  const [logs,        setLogs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [actionFil,   setActionFil]   = useState('all');
  const [moduleFil,   setModuleFil]   = useState('all');
  const [severityFil, setSeverityFil] = useState('all');
  const [expandedId,  setExpandedId]  = useState(null);
  const [live,        setLive]        = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const PER = 50;
  const liveTimer = useRef(null);

  // ── Chargement réel depuis l'API ──────────────────────────
  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const params = { page_size: PER, page, ordering: '-timestamp' };
      if (actionFil   !== 'all') params.action   = actionFil;
      if (moduleFil   !== 'all') params.module    = moduleFil;
      if (severityFil !== 'all') params.severity  = severityFil;
      if (search)                params.search    = search;

      const { data } = await api.get('/audit/logs/', { params });
      const rows = data.results ?? data;
      setLogs(Array.isArray(rows) ? rows : []);
      setTotal(data.count ?? (Array.isArray(rows) ? rows.length : 0));
    } catch (err) {
      if (!silent) toast.error('Erreur', 'Impossible de charger le journal.');
    } finally {
      if (!silent) setRefreshing(false);
      setLoading(false);
    }
  }, [page, actionFil, moduleFil, severityFil, search, toast]);

  // Chargement initial + quand les filtres/page changent
  useEffect(() => { fetchLogs(false); }, [fetchLogs]);

  // Live : polling toutes les 10s
  useEffect(() => {
    if (live) {
      liveTimer.current = setInterval(() => fetchLogs(true), 10000);
    } else {
      clearInterval(liveTimer.current);
    }
    return () => clearInterval(liveTimer.current);
  }, [live, fetchLogs]);

  const handleRefresh = () => {
    setPage(1);
    fetchLogs(false).then(() => toast.info('Journal actualisé', 'Derniers événements chargés.'));
  };

  // Filtres côté client (sur les logs déjà chargés si pas de pagination serveur)
  const filtered = useMemo(() => logs, [logs]);

  const totalPages = Math.ceil(total / PER);
  const groups     = useMemo(() => groupByDate(filtered), [filtered]);

  // Export CSV
  const exportCSV = () => {
    const head = ['ID', 'Horodatage', 'Action', 'Module', 'Gravité', 'Utilisateur', 'IP', 'Cible', 'Description'];
    const rows = filtered.map(l => [
      l.id, ts(l.timestamp), l.action, l.module, l.severity,
      l.user_display, l.ip_address || '',
      (l.target || '').replace(/,/g, ''), l.detail.replace(/,/g, ''),
    ]);
    const csv = [head, ...rows].map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `journal_spet_${Date.now()}.csv` });
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export réussi', `${filtered.length} entrées exportées.`);
  };

  const hasFilters = search || actionFil !== 'all' || moduleFil !== 'all' || severityFil !== 'all';

  const resetFilters = () => {
    setSearch(''); setActionFil('all'); setModuleFil('all'); setSeverityFil('all'); setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>

      {/* ── En-tête ── */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '18px 24px',
        border: '1px solid #e2e8f0', borderLeft: '4px solid #1a56db',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ScrollText size={20} color="#1a56db" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>Journal du Système</div>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {total} entrée{total !== 1 ? 's' : ''} · données en temps réel
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setLive(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
            background: live ? '#fef2f2' : '#f8fafc',
            border: `1px solid ${live ? '#fecaca' : '#e2e8f0'}`,
            color: live ? '#ef4444' : '#64748b', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: live ? '#ef4444' : '#94a3b8',
              animation: live ? 'pulse 1.5s ease infinite' : 'none', flexShrink: 0,
            }} />
            {live ? 'EN DIRECT' : 'EN PAUSE'}
          </button>

          <button onClick={handleRefresh} disabled={refreshing} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            background: '#f8fafc', border: '1px solid #e2e8f0',
            color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </button>

          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            color: '#1a56db', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Download size={12} /> CSV
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      {!loading && <StatBar logs={logs} />}

      {/* ── Filtres ── */}
      <div style={{
        background: '#fff', borderRadius: '10px', padding: '14px 16px',
        border: '1px solid #e2e8f0', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher — utilisateur, IP, description…"
            style={{
              width: '100%', padding: '7px 10px 7px 32px', fontSize: '12px',
              border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
              fontFamily: 'monospace', background: '#f8fafc', color: '#1e293b', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={13} color="#94a3b8" />
            </button>
          )}
        </div>

        {[
          { label: 'Action',  val: actionFil,   set: v => { setActionFil(v);   setPage(1); }, opts: Object.entries(ACTIONS).map(([k,v]) => [k, v.label]) },
          { label: 'Module',  val: moduleFil,   set: v => { setModuleFil(v);   setPage(1); }, opts: Object.entries(MODULES).map(([k,v]) => [k, v.label]) },
          { label: 'Gravité', val: severityFil, set: v => { setSeverityFil(v); setPage(1); }, opts: Object.entries(SEVERITY).map(([k,v]) => [k, v.label]) },
        ].map(({ label, val, set, opts }) => (
          <select key={label} value={val} onChange={e => set(e.target.value)} style={{
            padding: '7px 10px', fontSize: '11px', border: '1px solid #e2e8f0',
            borderRadius: '8px', background: '#f8fafc', color: '#374151',
            cursor: 'pointer', fontFamily: 'monospace', outline: 'none',
          }}>
            <option value="all">Tous ({label})</option>
            {opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        ))}

        {hasFilters && (
          <button onClick={resetFilters} style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '7px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer',
          }}>
            <X size={12} /> Réinitialiser
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {total} résultat{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Flux timeline ── */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="loader" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <ScrollText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Aucune entrée dans le journal</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {hasFilters ? 'Modifiez vos filtres' : 'Les événements apparaîtront ici dès qu\'une action est effectuée'}
            </div>
          </div>
        ) : (
          Object.entries(groups).map(([dateLabel, entries]) => (
            <div key={dateLabel}>
              <DateSep label={dateLabel} />
              {entries.map(log => (
                <LogEntry
                  key={log.id}
                  log={log}
                  expanded={expandedId === log.id}
                  onToggle={() => setExpandedId(prev => prev === log.id ? null : log.id)}
                />
              ))}
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            {[
              { label: '«', fn: () => setPage(1),          dis: page === 1 },
              { label: '‹', fn: () => setPage(p => p-1),  dis: page === 1 },
              { label: '›', fn: () => setPage(p => p+1),  dis: page === totalPages },
              { label: '»', fn: () => setPage(totalPages), dis: page === totalPages },
            ].map((b, i) => (
              <button key={i} onClick={b.fn} disabled={b.dis} style={{
                width: '32px', height: '32px', borderRadius: '6px',
                border: '1px solid #e2e8f0', background: '#f8fafc',
                color: b.dis ? '#cbd5e1' : '#374151', cursor: b.dis ? 'default' : 'pointer',
                fontSize: '14px', fontWeight: 700, fontFamily: 'monospace',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{b.label}</button>
            ))}
            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', margin: '0 4px' }}>
              Page {page} / {totalPages}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
