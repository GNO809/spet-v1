// ============================================================
// SPET — Chef: All Timetables View
// ============================================================

import { useState, useEffect } from 'react';
import { Eye, Download, Calendar } from 'lucide-react';
import TimetableView from '@/components/timetable/TimetableView';
import { StatusBadge } from '@/components/ui/Badge';
import { useNotification } from '@/contexts/NotificationContext';
import TimetableService from '@/services/timetable.service';
import { getQualityColor } from '@/utils/helpers';

export default function ChefTimetables() {
  const [timetables, setTimetables] = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const { toast } = useNotification();

  useEffect(() => {
    TimetableService.getAll({ page_size: 100 })
      .then(res => setTimetables(res.results ?? res))
      .catch(() => toast.error('Erreur', 'Impossible de charger les emplois du temps.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (edt) => {
    setSelected(edt);
    try {
      const data = await TimetableService.getSessions({ timetable: edt.id });
      setSessions(data);
    } catch {
      setSessions([]);
    }
  };

  const handleExportPdf = async (edt) => {
    try {
      const blob = await TimetableService.exportPdf((edt || selected).id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `EDT_${(edt || selected).filiere}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF', 'Export en cours...');
    } catch {
      toast.error('Erreur', 'Export PDF indisponible.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await TimetableService.exportExcel(selected.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `EDT_${selected.filiere}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel', 'Export en cours...');
    } catch {
      toast.error('Erreur', 'Export Excel indisponible.');
    }
  };

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Emplois du temps</h2>
          <p className="text-subtitle">Vue globale de tous les EDT sous votre supervision</p>
        </div>
      </div>

      {selected ? (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ alignSelf: 'flex-start' }}>
            ← Retour à la liste
          </button>
          <TimetableView
            timetable={selected}
            sessions={sessions}
            onExportPdf={handleExportPdf}
            onExportExcel={handleExportExcel}
          />
        </>
      ) : timetables.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} />
          <h3>Aucun emploi du temps</h3>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Filière</th>
                  <th>Semestre</th>
                  <th>Année</th>
                  <th>Responsable</th>
                  <th>Qualité</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timetables.map(edt => (
                  <tr key={edt.id}>
                    <td style={{ fontWeight: 600 }}>{edt.filiere}</td>
                    <td>{edt.semester}</td>
                    <td>{edt.year}</td>
                    <td>{edt.responsable}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar" style={{ width: '60px' }}>
                          <div className="progress-fill" style={{ width: `${edt.quality}%`, background: getQualityColor(edt.quality) }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: getQualityColor(edt.quality) }}>{edt.quality}%</span>
                      </div>
                    </td>
                    <td><StatusBadge status={edt.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleSelect(edt)}>
                          <Eye size={12} /> Voir
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleExportPdf(edt)}>
                          <Download size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
