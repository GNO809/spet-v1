// ============================================================
// SPET — Tableau de bord Chef de Département
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Clock, CheckCircle, AlertTriangle,
  ChevronRight, Calendar, TrendingUp, ArrowRight,
  RefreshCw, Users, BookOpen, Send,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDate, formatRelative, getQualityColor } from '@/utils/helpers';
import ChefService from '@/services/chef.service';

// ── Mini bar chart SVG ────────────────────────────────────────
function BarChart({ data, height = 120 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 36;
  const gap  = 12;
  const total = data.length * (barW + gap) - gap;

  return (
    <svg width={total} height={height + 32} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / max) * height);
        const x = i * (barW + gap);
        const y = height - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH}
              rx="4" fill={d.color || '#1a56db'} opacity="0.85" />
            <text x={x + barW / 2} y={height + 14} textAnchor="middle"
              fontSize="10" fill="#94a3b8" fontFamily="Inter, sans-serif">
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle"
                fontSize="11" fill="#475569" fontWeight="600" fontFamily="Inter, sans-serif">
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Mini sparkline ────────────────────────────────────────────
function Sparkline({ data, color = '#1a56db', height = 48, width = 180 }) {
  if (!data.length) return null;
  const allZero = data.every(v => v === 0);
  const max = allZero ? 1 : Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = allZero ? height : height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={allZero ? '#cbd5e1' : color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={allZero ? '4 3' : undefined} />
    </svg>
  );
}

// ── Ligne d'activité récente ──────────────────────────────────
function ActivityRow({ item, isLast }) {
  const actionColors = {
    CREATE:   { bg: '#dbeafe', c: '#1e3a8a', label: 'Création' },
    UPDATE:   { bg: '#fef3c7', c: '#b45309', label: 'Modification' },
    VALIDATE: { bg: '#dcfce7', c: '#15803d', label: 'Validation' },
    REJECT:   { bg: '#fee2e2', c: '#dc2626', label: 'Rejet' },
    PUBLISH:  { bg: '#ede9fe', c: '#5b21b6', label: 'Publication' },
    DELETE:   { bg: '#fee2e2', c: '#dc2626', label: 'Suppression' },
    LOGIN:    { bg: '#f0fdf4', c: '#15803d', label: 'Connexion' },
  };
  const ac = actionColors[item.action] || { bg: '#f1f5f9', c: '#64748b', label: item.action };

  return (
    <tr style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
        {formatDate(item.created_at, 'dd/MM HH:mm')}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 500, fontSize: '13px', color: '#1e293b' }}>
          {item.user_name || item.user || '—'}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.target || ''}</div>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
          background: ac.bg, color: ac.c, fontSize: '11px', fontWeight: 600,
        }}>
          {ac.label}
        </span>
      </td>
      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#64748b' }}>
        {item.module || '—'}
      </td>
    </tr>
  );
}

// ── Carte EDT en attente ──────────────────────────────────────
function PendingEdtCard({ edt, onAction }) {
  const qColor = getQualityColor(edt.quality ?? 0);
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '10px',
      border: '1px solid #fde68a',
      background: '#fffbeb',
      marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{edt.filiere}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            {edt.semester} · Par {edt.responsable || '—'}
          </div>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '2px 8px',
          borderRadius: '20px', background: '#fef3c7', color: '#b45309',
        }}>En attente</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ flex: 1, height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: `${edt.quality ?? 0}%`, background: qColor, borderRadius: '2px' }} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 700, color: qColor, minWidth: '36px', textAlign: 'right' }}>
          {edt.quality ?? 0}%
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => onAction(edt)}
          style={{
            flex: 1, padding: '6px 10px', borderRadius: '6px', border: 'none',
            background: '#1e3a8a', color: 'white', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}>
          <CheckCircle size={12} /> Valider
        </button>
        <Link to="/chef/validation" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0',
            background: 'white', color: '#64748b', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <ArrowRight size={12} /> Détails
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function ChefDashboard() {
  const { user }   = useAuth();
  const { toast }  = useNotification();
  const navigate   = useNavigate();

  const [stats,      setStats]      = useState(null);
  const [activites,  setActivites]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashData, auditData] = await Promise.all([
        ChefService.getDashboard(),
        ChefService.getAuditLogs({ page_size: 5, ordering: '-created_at' }).catch(() => ({ results: [] })),
      ]);
      setStats(dashData);
      const logs = auditData.results ?? auditData ?? [];
      setActivites(Array.isArray(logs) ? logs.slice(0, 5) : []);
    } catch (err) {
      toast.error('Erreur', 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { charger(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div className="loader" />
      </div>
    );
  }

  const d = stats || {};

  // Stats cartes
  const filieresCount = d.filieres?.length ?? d.totalFilieres ?? 0;
  const enAttenteCount = (d.pendingEdtsDetail || []).filter(e =>
    ['EN_ATTENTE_VALIDATION', 'EN_ATTENTE'].includes(e.status)
  ).length || d.pendingEdts || 0;
  const publiesCount  = d.publishedEdts ?? d.totalPublished ?? 0;
  const conflitsCount = d.unresolvedConflicts ?? d.totalConflicts ?? 0;

  // Données graphique barres : statuts EDT
  const edtParStatut = [
    { label: 'Brouillon',   value: d.brouillons   ?? 0, color: '#94a3b8' },
    { label: 'Soumis',      value: d.pendingEdts  ?? enAttenteCount, color: '#f59e0b' },
    { label: 'Validé',      value: d.valides      ?? 0, color: '#10b981' },
    { label: 'Publié',      value: publiesCount,         color: '#1a56db' },
    { label: 'Archivé',     value: d.archives     ?? 0, color: '#cbd5e1' },
  ];

  // Sparkline soumissions sur 6 mois (données réelles uniquement)
  const sparkData = Array.isArray(d.submissionsPerMonth) && d.submissionsPerMonth.length
    ? d.submissionsPerMonth
    : [0, 0, 0, 0, 0, 0];

  // EDT en attente (liste)
  const edtEnAttente = (d.pendingEdtsDetail || [])
    .filter(e => ['EN_ATTENTE_VALIDATION', 'EN_ATTENTE'].includes(e.status))
    .slice(0, 4);

  const handleQuickValidate = (edt) => {
    navigate(`/chef/validation`, { state: { selectedId: edt.id } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── En-tête ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1a56db 100%)',
        borderRadius: '14px',
        padding: '24px 28px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
            Bonjour, {user?.firstName}
          </h2>
          <p style={{ margin: '6px 0 0', opacity: 0.8, fontSize: '13px' }}>
            Chef de Département · {d.departmentName || 'Informatique'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {enAttenteCount > 0 && (
            <Link to="/chef/validation" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}>
                <Clock size={16} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  {enAttenteCount} EDT à valider
                </span>
                <ChevronRight size={14} />
              </div>
            </Link>
          )}
          <button onClick={() => charger(false)} disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white', lineHeight: 0,
            }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── 4 StatCards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard
          label="Filières supervisées"
          value={filieresCount}
          sub="Dans votre département"
          icon={GraduationCap}
          iconBg="#eff6ff"
          iconColor="#1a56db"
        />
        <StatCard
          label="EDT en attente"
          value={enAttenteCount}
          sub="À valider ou rejeter"
          icon={Clock}
          iconBg="#fff7ed"
          iconColor="#f59e0b"
          onClick={() => navigate('/chef/validation')}
        />
        <StatCard
          label="EDT publiés"
          value={publiesCount}
          sub="Ce semestre"
          icon={CheckCircle}
          iconBg="#f0fdf4"
          iconColor="#10b981"
        />
        <StatCard
          label="Conflits détectés"
          value={conflitsCount}
          sub={conflitsCount > 0 ? 'Non résolus' : 'Aucun conflit'}
          icon={AlertTriangle}
          iconBg={conflitsCount > 0 ? '#fee2e2' : '#f0fdf4'}
          iconColor={conflitsCount > 0 ? '#ef4444' : '#10b981'}
        />
      </div>

      {/* ── Graphiques + EDT en attente ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Bar chart EDT par statut */}
        <div className="card-flat">
          <div className="card-header">
            <h3 className="card-title">Répartition des EDT par statut</h3>
          </div>
          <div style={{ paddingTop: '8px', overflowX: 'auto' }}>
            <BarChart data={edtParStatut} height={100} />
          </div>
        </div>

        {/* Sparkline soumissions */}
        <div className="card-flat">
          <div className="card-header">
            <h3 className="card-title">Soumissions — 6 derniers mois</h3>
            <TrendingUp size={16} color="#10b981" />
          </div>
          {(() => {
            const total = sparkData.reduce((a, b) => a + b, 0);
            return (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', paddingTop: '8px' }}>
                <Sparkline data={sparkData} color="#1a56db" height={64} width={200} />
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: total === 0 ? '#94a3b8' : '#1e293b' }}>
                    {total}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>EDT soumis</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>sur 6 mois</div>
                </div>
              </div>
            );
          })()}

          {/* Stats Enseignants / Cours rapides */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '10px', marginTop: '20px', paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
          }}>
            {[
              { label: 'Enseignants',    value: d.totalEnseignants ?? 0, icon: Users,    color: '#1a56db', bg: '#eff6ff' },
              { label: 'Cours planifiés', value: d.totalCourses   ?? 0, icon: BookOpen, color: '#10b981', bg: '#f0fdf4' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', background: bg,
              }}>
                <Icon size={18} color={color} />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EDT en attente + Activités récentes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '20px' }}>

        {/* EDT en attente */}
        <div className="card-flat">
          <div className="card-header">
            <h3 className="card-title">EDT en attente de validation</h3>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px',
              borderRadius: '20px', background: '#fff7ed', color: '#d97706',
            }}>{enAttenteCount}</span>
          </div>

          {edtEnAttente.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
              <CheckCircle size={32} color="#10b981" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Aucun EDT en attente</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Tous les EDT ont été traités.</div>
            </div>
          ) : (
            <>
              {edtEnAttente.map(edt => (
                <PendingEdtCard key={edt.id} edt={edt} onAction={handleQuickValidate} />
              ))}
              {enAttenteCount > 4 && (
                <Link to="/chef/validation" style={{ textDecoration: 'none' }}>
                  <div style={{
                    textAlign: 'center', padding: '10px',
                    fontSize: '13px', color: '#1a56db', fontWeight: 600,
                    borderTop: '1px solid #f1f5f9', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}>
                    Voir toutes les validations en attente
                    <ArrowRight size={14} />
                  </div>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Activités récentes */}
        <div className="card-flat">
          <div className="card-header">
            <h3 className="card-title">Activités récentes</h3>
            <Link to="/chef/audit" style={{ fontSize: '12px', color: '#1a56db', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              Tout voir <ChevronRight size={12} />
            </Link>
          </div>

          {activites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8', fontSize: '13px' }}>
              Aucune activité récente.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acteur</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Module</th>
                  </tr>
                </thead>
                <tbody>
                  {activites.map((a, i) => (
                    <ActivityRow key={i} item={a} isLast={i === activites.length - 1} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Vue filières ── */}
      {(d.filieres || []).length > 0 && (
        <div className="card-flat">
          <div className="card-header">
            <h3 className="card-title">Vue des filières</h3>
            <Link to="/chef/timetables" style={{ fontSize: '12px', color: '#1a56db', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              Tous les EDT <ChevronRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', paddingTop: '4px' }}>
            {(d.filieres || []).map((f, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: '10px',
                border: '1px solid #e2e8f0', background: '#fafafa',
              }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>
                  {f.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                  {f.enseignants || 0} enseignants · {f.etudiants || 0} étudiants
                </div>
                <StatusBadge status={f.edtStatus || 'BROUILLON'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
