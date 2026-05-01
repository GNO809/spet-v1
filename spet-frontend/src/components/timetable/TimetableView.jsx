// ============================================================
// SPET — Timetable (EDT) View Component
// Full weekly grid with session cards
// ============================================================

import { useState } from 'react';
import { Download, Filter, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { SESSION_TYPE_COLORS, DAYS, TIME_SLOTS } from '@/utils/constants';
import { getQualityColor, getQualityLabel } from '@/utils/helpers';

// ── Session card ─────────────────────────────────────────────
function SessionCard({ session }) {
  const [hovered, setHovered] = useState(false);
  const colors = SESSION_TYPE_COLORS[session.type] || SESSION_TYPE_COLORS.CM;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: '6px',
        padding: '6px 8px',
        marginBottom: '4px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? `0 3px 12px ${colors.border}40` : 'none',
        minHeight: '60px',
        position: 'relative',
      }}
      title={`${session.course} — ${session.teacher} — ${session.room}`}
    >
      {/* Type badge */}
      <span style={{
        display: 'inline-block',
        background: colors.border,
        color: 'white',
        fontSize: '9px',
        fontWeight: 700,
        padding: '1px 6px',
        borderRadius: '3px',
        marginBottom: '4px',
        letterSpacing: '0.5px',
      }}>
        {session.type}
      </span>

      <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text, lineHeight: 1.3, marginBottom: '3px' }}>
        {session.course.length > 22 ? session.course.slice(0, 22) + '…' : session.course}
      </div>
      {session.teacher && (
        <div style={{ fontSize: '10px', color: colors.text, opacity: 0.85, marginBottom: '1px' }}>
          👤 {session.teacher}
        </div>
      )}
      <div style={{ fontSize: '10px', color: colors.text, opacity: 0.7, marginTop: '2px' }}>
        📍 {session.room}
      </div>
      {session.group && (
        <div style={{ fontSize: '10px', color: colors.text, opacity: 0.6, marginTop: '1px' }}>
          👥 {session.group.length > 20 ? session.group.slice(0, 20) + '…' : session.group}
        </div>
      )}
      <div style={{ fontSize: '10px', color: colors.text, opacity: 0.7, marginTop: '3px', fontWeight: 500 }}>
        {session.start} – {session.end}
      </div>
    </div>
  );
}

// ── Timetable grid ───────────────────────────────────────────
export function TimetableGrid({ sessions, days = DAYS, slots = TIME_SLOTS }) {
  // Build lookup: day → [sessions]
  const byDay = {};
  days.forEach(d => { byDay[d] = []; });
  sessions.forEach(s => {
    if (byDay[s.day]) byDay[s.day].push(s);
  });

  // Build lookup: day+slot → sessions
  const slotMap = {};
  sessions.forEach(s => {
    const key = `${s.day}|${s.start}`;
    if (!slotMap[key]) slotMap[key] = [];
    slotMap[key].push(s);
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        minWidth: '900px',
      }}>
        <thead>
          <tr>
            <th style={{
              width: '90px',
              padding: '10px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
              color: '#94a3b8',
              textAlign: 'center',
              fontWeight: 600,
            }}>
              Horaire
            </th>
            {days.map(day => (
              <th key={day} style={{
                padding: '10px 12px',
                background: '#1e3a8a',
                border: '1px solid #1a56db',
                fontSize: '12px',
                color: '#ffffff',
                textAlign: 'center',
                fontWeight: 600,
              }}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, si) => (
            <tr key={slot.label}>
              {/* Time label */}
              <td style={{
                padding: '8px 10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
                color: '#64748b',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                verticalAlign: 'top',
                fontWeight: 500,
              }}>
                <div>{slot.start}</div>
                <div style={{ color: '#94a3b8', fontSize: '10px' }}>→ {slot.end}</div>
              </td>

              {/* Day cells */}
              {days.map(day => {
                // Show sessions whose time range overlaps this slot
                const displaySessions = sessions.filter(s =>
                  s.day === day &&
                  s.start < slot.end && s.end > slot.start
                );

                return (
                  <td key={day} style={{
                    padding: '6px',
                    border: '1px solid #e2e8f0',
                    verticalAlign: 'top',
                    minWidth: '130px',
                    background: si % 2 === 0 ? 'white' : '#fafbfd',
                  }}>
                    {displaySessions.map(s => (
                      <SessionCard key={s.id} session={s} />
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Legend ───────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '12px', color: '#64748b' }}>Légende :</span>
      {[
        { type: 'CM', label: 'Cours Magistral' },
        { type: 'TD', label: 'Travaux Dirigés' },
        { type: 'TP', label: 'Travaux Pratiques' },
      ].map(({ type, label }) => {
        const c = SESSION_TYPE_COLORS[type];
        return (
          <span key={type} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', color: '#64748b',
          }}>
            <span style={{
              width: '14px', height: '14px', borderRadius: '3px',
              background: c.bg,
              border: `2px solid ${c.border}`,
            }} />
            <strong style={{ color: c.text }}>{type}</strong> — {label}
          </span>
        );
      })}
    </div>
  );
}

// ── Main TimetableView ────────────────────────────────────────
export default function TimetableView({
  timetable,          // { id, filiere, semester, year, status, quality }
  sessions = [],      // array of session objects
  onExportPdf,
  onExportExcel,
  showActions = true,
}) {
  const [groupFilter, setGroupFilter] = useState('all');

  const groups = ['all', ...new Set(sessions.map(s => s.group).filter(Boolean))];
  const filtered = groupFilter === 'all'
    ? sessions
    : sessions.filter(s => s.group === groupFilter || !s.group);

  const qColor = getQualityColor(timetable?.quality || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header bar */}
      {timetable && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{timetable.filiere}</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
              {timetable.semester} · {timetable.year}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Quality score */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Qualité</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="progress-bar" style={{ width: '80px' }}>
                  <div className="progress-fill" style={{ width: `${timetable.quality}%`, background: qColor }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: qColor }}>
                  {timetable.quality}%
                </span>
              </div>
              <div style={{ fontSize: '11px', color: qColor, fontWeight: 600, marginTop: '2px' }}>
                {getQualityLabel(timetable.quality)}
              </div>
            </div>
            <StatusBadge status={timetable.status} />
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <Legend />
        {showActions && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {groups.length > 2 && (
              <select
                style={{
                  padding: '7px 12px', border: '1px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '13px',
                  background: 'white', color: '#1e293b',
                  fontFamily: 'inherit',
                }}
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
              >
                {groups.map(g => <option key={g} value={g}>{g === 'all' ? 'Tous les groupes' : g}</option>)}
              </select>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onExportPdf}>
              <Download size={13} /> PDF
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onExportExcel}>
              <Download size={13} /> Excel
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
              <Printer size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <h3>Aucune séance planifiée</h3>
            <p>Cet emploi du temps ne contient pas encore de séances.</p>
          </div>
        ) : (
          <TimetableGrid sessions={filtered} />
        )}
      </div>

      {/* Summary */}
      {sessions.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['CM','TD','TP'].map(type => {
            const count = sessions.filter(s => s.type === type).length;
            const c = SESSION_TYPE_COLORS[type];
            return (
              <div key={type} style={{
                padding: '8px 16px',
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: '8px',
                fontSize: '12px',
                color: c.text,
                fontWeight: 600,
              }}>
                {count} séance{count > 1 ? 's' : ''} {type}
              </div>
            );
          })}
          <div style={{
            padding: '8px 16px',
            background: '#f1f5f9',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#64748b',
          }}>
            Total : {sessions.length} séances
          </div>
        </div>
      )}
    </div>
  );
}
