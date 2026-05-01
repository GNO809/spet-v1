// ============================================================
// SPET — Badge Component
// ============================================================

import { EDT_STATUS_LABELS, EDT_STATUS_BADGE, ROLE_LABELS, ROLE_BADGE_CLASS } from '@/utils/constants';

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${EDT_STATUS_BADGE[status] || 'badge-brouillon'}`}>
      {EDT_STATUS_LABELS[status] || status}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge ${ROLE_BADGE_CLASS[role] || 'badge-enseignant'}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export function SessionTypeBadge({ type }) {
  const colors = {
    CM: { bg: '#dbeafe', border: '#1a56db', color: '#1e3a8a' },
    TD: { bg: '#dcfce7', border: '#10b981', color: '#15803d' },
    TP: { bg: '#fef3c7', border: '#f59e0b', color: '#b45309' },
  };
  const c = colors[type] || colors.CM;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '20px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
      fontSize: '11px',
      fontWeight: 700,
    }}>
      {type}
    </span>
  );
}

export function CustomBadge({ label, bg, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px',
      borderRadius: '20px',
      background: bg || '#f1f5f9',
      color: color || '#64748b',
      fontSize: '11px',
      fontWeight: 600,
    }}>
      {label}
    </span>
  );
}

export default StatusBadge;
