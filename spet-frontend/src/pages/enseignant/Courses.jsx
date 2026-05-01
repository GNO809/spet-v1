// ============================================================
// SPET — Enseignant: Mes matières affectées
// ============================================================

import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { SessionTypeBadge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import AcademicsService from '@/services/academics.service';

function StatusBadge({ value }) {
  const cfg = value ? { bg: '#dcfce7', color: '#16a34a', label: 'Planifié' } : { bg: '#fef3c7', color: '#d97706', label: 'Non planifié' };
  return <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
}

export default function EnseignantCourses() {
  const { user }   = useAuth();
  const { toast }  = useNotification();
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    AcademicsService.getCourses({ teacher: user.id, page_size: 200 })
      .then(setCourses)
      .catch(() => toast.error('Erreur', 'Impossible de charger vos matières.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const totalCM = courses.reduce((s, c) => s + (c.volume_cm || 0), 0);
  const totalTD = courses.reduce((s, c) => s + (c.volume_td || 0), 0);

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Mes matières affectées</h2>
          <p className="text-subtitle">{courses.length} cours · {totalCM}h CM · {totalTD}h TD/TP</p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} />
          <h3>Aucune matière affectée</h3>
          <p>Aucun cours ne vous a encore été affecté ce semestre.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Intitulé</th>
                  <th>Niveau / Option</th>
                  <th>Semestre</th>
                  <th style={{ textAlign: 'center' }}>CM (h)</th>
                  <th style={{ textAlign: 'center' }}>TD/TP (h)</th>
                  <th>Types</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#1e293b' }}>
                        {c.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, fontSize: '13px', color: '#1e293b' }}>{c.name}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {c.filiere_name || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>—</td>
                    <td style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: c.volume_cm > 0 ? '#1a56db' : '#cbd5e1' }}>
                      {c.volume_cm}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: (c.volume_td + c.volume_tp) > 0 ? '#10b981' : '#cbd5e1' }}>
                      {c.volume_td + c.volume_tp}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {c.volume_cm > 0 && <SessionTypeBadge type="CM" />}
                        {c.volume_td > 0 && <SessionTypeBadge type="TD" />}
                        {c.volume_tp > 0 && <SessionTypeBadge type="TP" />}
                      </div>
                    </td>
                    <td><StatusBadge value={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>{courses.length} matière{courses.length !== 1 ? 's' : ''} · Volume total : {totalCM + totalTD}h</span>
          </div>
        </div>
      )}
    </div>
  );
}
