// ============================================================
// SPET — Stat Card Component
// ============================================================

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg = '#eff6ff',
  iconColor = '#1a56db',
  trend,        // { value: 12, type: 'up' | 'down' | 'neutral', label: 'vs last month' }
  onClick,
}) {
  const trendIcon = {
    up:      <TrendingUp size={12} color="#10b981" />,
    down:    <TrendingDown size={12} color="#ef4444" />,
    neutral: <Minus size={12} color="#94a3b8" />,
  };
  const trendColor = { up: '#10b981', down: '#ef4444', neutral: '#94a3b8' };

  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {Icon && (
        <div
          className="stat-icon"
          style={{
            background: iconBg,
            boxShadow: `0 4px 14px ${iconColor}28`,
          }}
        >
          <Icon size={22} color={iconColor} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            {trendIcon[trend.type]}
            <span style={{ fontSize: '12px', color: trendColor[trend.type], fontWeight: 500 }}>
              {trend.value}
            </span>
            {trend.label && (
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
