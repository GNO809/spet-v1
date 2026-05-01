// ============================================================
// SPET — Chef de Département: Export
// ============================================================

import { useState, useEffect } from 'react';
import { Download, FileText, Table, Calendar } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { useNotification } from '@/contexts/NotificationContext';
import TimetableService from '@/services/timetable.service';

export default function ChefExport() {
  const [timetables, setTimetables] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState([]);
  const [format,     setFormat]     = useState('pdf');
  const [exporting,  setExporting]  = useState(false);
  const { toast } = useNotification();

  useEffect(() => {
    TimetableService.getAll({ page_size: 100 })
      .then(res => {
        const list = res.results ?? res;
        setTimetables(list.filter(e => ['PUBLIE', 'VALIDE'].includes(e.status)));
      })
      .catch(() => toast.error('Erreur', 'Impossible de charger les emplois du temps.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      toast.warning('Sélection vide', 'Veuillez sélectionner au moins un EDT.');
      return;
    }
    setExporting(true);
    let success = 0;
    for (const id of selected) {
      const edt = timetables.find(e => e.id === id);
      try {
        const blob = format === 'pdf'
          ? await TimetableService.exportPdf(id)
          : await TimetableService.exportExcel(id);
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `EDT_${edt?.filiere || id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(url);
        success++;
      } catch {
        toast.error('Erreur', `Export échoué pour ${edt?.filiere || id}.`);
      }
    }
    if (success > 0) {
      toast.success('Export réussi', `${success} EDT exporté(s) au format ${format.toUpperCase()}.`);
    }
    setExporting(false);
  };

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Exporter les emplois du temps</h2>
          <p className="text-subtitle">Téléchargez les EDT validés ou publiés en PDF ou Excel</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* EDT list */}
        <div className="card-flat">
          <div className="card-header">
            <h3 className="card-title">EDT disponibles à l'export</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(timetables.map(e => e.id))}>
              Tout sélectionner
            </button>
          </div>
          {timetables.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <Calendar size={32} />
              <h3>Aucun EDT disponible</h3>
              <p style={{ fontSize: '13px' }}>Seuls les EDT validés ou publiés sont exportables.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timetables.map(edt => (
                <label key={edt.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${selected.includes(edt.id) ? '#1a56db' : '#e2e8f0'}`,
                  background: selected.includes(edt.id) ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(edt.id)}
                    onChange={() => toggleSelect(edt.id)}
                    style={{ width: '16px', height: '16px', accentColor: '#1a56db' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{edt.filiere}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{edt.semester} · {edt.year}</div>
                  </div>
                  <StatusBadge status={edt.status} />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Export options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-flat">
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Format d'export</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { val: 'pdf',   label: 'PDF',   desc: 'Idéal pour impression et affichage', icon: FileText },
                { val: 'excel', label: 'Excel', desc: 'Pour édition et traitement des données', icon: Table },
              ].map(f => (
                <label key={f.val} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${format === f.val ? '#1a56db' : '#e2e8f0'}`,
                  background: format === f.val ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                }}>
                  <input type="radio" name="format" value={f.val} checked={format === f.val} onChange={() => setFormat(f.val)} style={{ accentColor: '#1a56db' }} />
                  <f.icon size={18} color={format === f.val ? '#1a56db' : '#94a3b8'} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{f.label}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="card-flat" style={{ background: '#f8fafc' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
              <strong>{selected.length}</strong> EDT sélectionné(s)
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleExport}
              disabled={exporting || selected.length === 0}
            >
              {exporting ? 'Export en cours...' : (
                <><Download size={15} /> Exporter {format.toUpperCase()}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
