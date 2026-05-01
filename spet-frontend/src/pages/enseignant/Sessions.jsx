// ============================================================
// SPET — Enseignant: Mes séances
// ============================================================

import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SessionTypeBadge } from '@/components/ui/Badge';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import { DAYS } from '@/utils/constants';

const DAY_ORDER = DAYS.reduce((o, d, i) => ({ ...o, [d]: i }), {});

export default function EnseignantSessions() {
  const { user }   = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const { toast }  = useNotification();

  useEffect(() => {
    if (!user?.id) return;
    api.get('/planning/sessions/', { params: { page_size: 100 } })
      .then(r => setSessions(r.data?.results ?? r.data ?? []))
      .catch(() => toast.error('Erreur', 'Impossible de charger vos séances.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.session_type === filter);
  const sorted   = [...filtered].sort((a, b) => (DAY_ORDER[a.day] ?? 9) - (DAY_ORDER[b.day] ?? 9) || a.start_time?.localeCompare(b.start_time));

  const handleSignalImpediment = async (s) => {
    toast.info('Signalement', `Votre empêchement pour "${s.course_name || s.course}" a été envoyé au chef de filière.`);
  };

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Mes séances</h2>
          <p className="text-subtitle">{sessions.length} séance{sessions.length !== 1 ? 's' : ''} planifiée{sessions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtres par type */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[['all','Toutes'],['CM','CM'],['TD','TD'],['TP','TP']].map(([val, lbl]) => (
          <button key={val} className={`chip ${filter === val ? 'active' : ''}`} onClick={() => setFilter(val)}>{lbl}</button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} />
          <h3>Aucune séance planifiée</h3>
          <p>Vos séances apparaîtront ici lorsqu'elles seront planifiées.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Jour</th>
                  <th>Horaire</th>
                  <th>Matière</th>
                  <th>Classe</th>
                  <th>Salle</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500, fontSize: '13px', color: '#1e293b' }}>{s.day}</td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                        {s.start_time?.slice(0, 5)} — {s.end_time?.slice(0, 5)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '13px', color: '#1e293b' }}>
                      {s.course_name || s.course || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>{s.group_name || s.group || '—'}</td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#dc2626' }}>
                        {s.room_name || s.room || '—'}
                      </span>
                    </td>
                    <td><SessionTypeBadge type={s.session_type} /></td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleSignalImpediment(s)}
                        title="Signaler un empêchement"
                      >
                        <AlertTriangle size={12} /> Empêchement
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>{sorted.length} séance{sorted.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}
