// ============================================================
// SPET — Enseignant: Mon Emploi du Temps
// ============================================================

import { useState, useEffect } from 'react';
import { Info, BookOpen, Clock, Calendar, MapPin, Users, ChevronDown, ChevronUp, Download } from 'lucide-react';
import TimetableView from '@/components/timetable/TimetableView';
import TimetableService from '@/services/timetable.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { SESSION_TYPE_COLORS, DAYS } from '@/utils/constants';

function computeHours(sessions) {
  return sessions.reduce((total, s) => {
    if (!s.start || !s.end) return total;
    const [sh, sm] = s.start.split(':').map(Number);
    const [eh, em] = s.end.split(':').map(Number);
    return total + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);
}

function SummaryBanner({ sessions, user }) {
  const totalH      = computeHours(sessions);
  const countByType = { CM: 0, TD: 0, TP: 0 };
  sessions.forEach(s => { if (countByType[s.type] !== undefined) countByType[s.type]++; });

  return (
    <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid #dbeafe', borderLeft: '4px solid #1a56db', borderRadius: '0 12px 12px 0', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <Info size={16} color="#1a56db" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Vue personnelle — {user?.firstName} {user?.lastName}</p>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Uniquement vos séances en tant qu'intervenant.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{sessions.length}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={10} /> séances</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{Math.round(totalH * 10) / 10}h</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> volume</div>
        </div>
        {Object.entries(countByType).filter(([, n]) => n > 0).map(([type, n]) => {
          const c = SESSION_TYPE_COLORS[type];
          return (
            <div key={type} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: c.text }}>{n}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: c.text, background: c.bg, border: `1px solid ${c.border}`, padding: '1px 6px', borderRadius: '4px' }}>{type}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionDetailCard({ session, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const c = SESSION_TYPE_COLORS[session.type] || SESSION_TYPE_COLORS.CM;
  const durationMin = (() => {
    if (!session.start || !session.end) return 0;
    const [sh, sm] = session.start.split(':').map(Number);
    const [eh, em] = session.end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  })();

  return (
    <div style={{ borderRadius: '12px', border: `1px solid ${c.border}`, background: c.bg, overflow: 'hidden' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}>
        <div style={{ textAlign: 'center', minWidth: '52px', flexShrink: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: c.text }}>{session.start}</div>
          <div style={{ fontSize: '10px', color: c.text, opacity: 0.7 }}>{session.end}</div>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: '20px', background: c.border, color: 'white', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{session.type}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.course}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>🏫 {session.room}</span><span>👥 {session.group}</span><span>⏱ {durationMin} min</span>
          </div>
        </div>
        <div style={{ color: c.text, flexShrink: 0 }}>{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${c.border}40`, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { icon: MapPin,   label: 'Salle',   value: session.room  },
            { icon: Users,    label: 'Groupe',  value: session.group },
            { icon: Clock,    label: 'Horaires', value: `${session.start} → ${session.end}`, sub: `${durationMin} minutes` },
            { icon: BookOpen, label: 'Type',    value: session.type === 'CM' ? 'Cours Magistral' : session.type === 'TD' ? 'Travaux Dirigés' : 'Travaux Pratiques' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Icon size={13} color={c.text} />
                <span style={{ fontSize: '11px', fontWeight: 600, color: c.text, textTransform: 'uppercase' }}>{label}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{value}</div>
              {sub && <div style={{ fontSize: '11px', color: '#64748b' }}>{sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailedListView({ sessions }) {
  if (sessions.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <Calendar size={40} />
        <h3>Aucune séance trouvée</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Votre emploi du temps sera visible une fois publié.</p>
      </div>
    );
  }
  const byDay = DAYS.reduce((acc, d) => { acc[d] = sessions.filter(s => s.day === d); return acc; }, {});
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {DAYS.filter(d => byDay[d].length > 0).map(day => (
        <div key={day} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #1e3a8a 0%, #1a56db 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{day}</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px' }}>
              {byDay[day].length} séance{byDay[day].length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {byDay[day].sort((a, b) => (a.start || '').localeCompare(b.start || '')).map((s, i) => (
              <SessionDetailCard key={s.id} session={s} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CoursesSummary({ sessions }) {
  const courses = [...new Map(sessions.map(s => [s.course, s])).values()];
  if (courses.length === 0) return null;
  return (
    <div className="card-flat">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <BookOpen size={16} color="#1a56db" />
        <h3 className="card-title">Mes cours ce semestre</h3>
        <span style={{ background: '#eff6ff', color: '#1a56db', fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: '10px' }}>{courses.length}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {courses.map(s => {
          const c = SESSION_TYPE_COLORS[s.type] || SESSION_TYPE_COLORS.CM;
          const count = sessions.filter(x => x.course === s.course).length;
          return (
            <div key={s.course} style={{ padding: '6px 14px', background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{s.course}</span>
              <span style={{ background: c.border, color: 'white', fontSize: '10px', fontWeight: 700, padding: '0px 5px', borderRadius: '8px' }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MyTimetable() {
  const { user }  = useAuth();
  const { toast } = useNotification();
  const [viewMode,  setViewMode]  = useState('list');
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    TimetableService.getSessions()
      .then(setSessions)
      .catch(() => toast.error('Erreur', 'Impossible de charger votre emploi du temps.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  const timetable = {
    filiere: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    status: 'PUBLIE', quality: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="text-page-title">Mon emploi du temps</h2>
          <p className="text-subtitle">Sessions publiées me concernant</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {[{ key: 'list', label: 'Vue détaillée' }, { key: 'grid', label: 'Grille EDT' }].map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} style={{ padding: '8px 14px', border: 'none', background: viewMode === v.key ? '#1a56db' : 'white', color: viewMode === v.key ? 'white' : '#64748b', fontSize: '12px', fontWeight: viewMode === v.key ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>{v.label}</button>
            ))}
          </div>
          <button onClick={() => toast.info('Export', 'Fonctionnalité disponible prochainement.')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', background: 'white', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      <SummaryBanner sessions={sessions} user={user} />
      <CoursesSummary sessions={sessions} />

      {viewMode === 'list' ? (
        <DetailedListView sessions={sessions} />
      ) : (
        <TimetableView timetable={timetable} sessions={sessions}
          onExportPdf={()   => toast.success('Export PDF',   'Téléchargement en cours...')}
          onExportExcel={() => toast.success('Export Excel', 'Téléchargement en cours...')}
        />
      )}
    </div>
  );
}
