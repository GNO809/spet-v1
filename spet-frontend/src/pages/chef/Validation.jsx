// ============================================================
// SPET — Chef de Département: Validation EDT (split-panel)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, Download, AlertTriangle,
  Clock, Calendar, User, BarChart2, ChevronRight, Eye,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { useNotification } from '@/contexts/NotificationContext';
import TimetableService from '@/services/timetable.service';
import { SESSION_TYPE_COLORS, DAYS } from '@/utils/constants';

const GRID_SLOTS = [
  { start: '08:00', end: '10:00', label: '08h–10h' },
  { start: '10:00', end: '12:00', label: '10h–12h' },
  { start: '15:00', end: '17:00', label: '15h–17h' },
  { start: '17:00', end: '19:00', label: '17h–19h' },
];
import { getQualityColor, getQualityLabel } from '@/utils/helpers';

// ── Inline quality gauge (SVG circle) ────────────────────────
function QualityGauge({ score }) {
  const r      = 40;
  const circ   = 2 * Math.PI * r;
  const pct    = Math.min(100, Math.max(0, score)) / 100;
  const color  = getQualityColor(score);
  const label  = getQualityLabel(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>{score}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="10" fill="#94a3b8">/ 100</text>
      </svg>
      <span style={{ fontSize: '12px', fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

// ── Mini read-only timetable grid ─────────────────────────────
function MiniGrid({ sessions }) {
  const bySlot = {};
  sessions.forEach(s => {
    const key = `${s.day}__${s.start}`;
    if (!bySlot[key]) bySlot[key] = [];
    bySlot[key].push(s);
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '480px' }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', width: '90px', textAlign: 'center', color: '#64748b', fontWeight: 600, fontSize: '10px' }}>
              Créneau
            </th>
            {DAYS.map(d => (
              <th key={d} style={{ padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', color: '#1e293b', fontWeight: 600, fontSize: '11px' }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRID_SLOTS.map(slot => (
            <tr key={slot.start}>
              <td style={{ padding: '4px 6px', border: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'center', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap', fontSize: '10px' }}>
                {slot.label}
              </td>
              {DAYS.map(day => {
                const key   = `${day}__${slot.start}`;
                const cells = bySlot[key] || [];
                return (
                  <td key={day} style={{ padding: '3px', border: '1px solid #e2e8f0', verticalAlign: 'top', minHeight: '48px', minWidth: '80px' }}>
                    {cells.map((s, i) => {
                      const c = SESSION_TYPE_COLORS[s.type] || SESSION_TYPE_COLORS.CM;
                      return (
                        <div key={i} style={{
                          background: c.bg, borderLeft: `2px solid ${c.border}`,
                          borderRadius: '4px', padding: '3px 5px', marginBottom: '2px',
                        }}>
                          <div style={{ fontWeight: 700, color: c.text, fontSize: '10px', marginBottom: '1px' }}>
                            {s.type}
                          </div>
                          <div style={{ color: c.text, fontSize: '10px', lineHeight: 1.2, fontWeight: 600 }}>
                            {s.course.length > 16 ? s.course.slice(0, 16) + '…' : s.course}
                          </div>
                          {s.teacher && (
                            <div style={{ color: c.text, opacity: 0.85, fontSize: '9px', marginTop: '1px' }}>
                              👤 {s.teacher}
                            </div>
                          )}
                          <div style={{ color: c.text, opacity: 0.7, fontSize: '9px', marginTop: '1px' }}>
                            📍 {s.room || '—'}
                          </div>
                        </div>
                      );
                    })}
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

// ── Left panel EDT card ───────────────────────────────────────
function EdtListItem({ edt, selected, onClick, onValidate, onReject }) {
  const isSelected   = selected?.id === edt.id;
  const qColor       = getQualityColor(edt.quality);
  const hasConflicts = edt.conflictsCount > 0;
  const isPending    = ['EN_ATTENTE', 'EN_ATTENTE_VALIDATION'].includes(edt.status);

  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid #f1f5f9',
        cursor: 'pointer',
        background: isSelected ? '#eff6ff' : 'transparent',
        borderLeft: isSelected ? '3px solid #1a56db' : '3px solid transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {edt.filiere}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            {edt.semester} · {edt.year}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px', flexShrink:0 }}>
          <StatusBadge status={edt.status} />
          <ChevronRight size={14} color={isSelected ? '#1a56db' : '#cbd5e1'} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
          <div style={{ flex: 1, height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${edt.quality}%`, height: '100%', background: qColor, borderRadius: '2px', transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: qColor, whiteSpace: 'nowrap' }}>{edt.quality}%</span>
        </div>
        {hasConflicts && (
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#ef4444', background: '#fef2f2', borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap' }}>
            {edt.conflictsCount} conflit{edt.conflictsCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
        <User size={10} color="#94a3b8" />
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{edt.responsable}</span>
        <span style={{ fontSize: '10px', color: '#cbd5e1', marginLeft: '4px' }}>·</span>
        <Calendar size={10} color="#94a3b8" />
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
          {edt.createdAt ? new Date(edt.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
        </span>
      </div>

      {/* Boutons d'action rapide pour les EDTs en attente */}
      {isPending && (
        <div
          style={{ display: 'flex', gap: '6px', marginTop: '10px' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="btn btn-danger btn-sm"
            style={{ flex: 1, fontSize: '11px', padding: '5px 8px' }}
            onClick={() => onReject(edt)}
          >
            <XCircle size={11} /> Rejeter
          </button>
          <button
            className="btn btn-success btn-sm"
            style={{ flex: 1, fontSize: '11px', padding: '5px 8px' }}
            onClick={() => onValidate(edt)}
          >
            <CheckCircle size={11} /> Valider
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function ChefValidation() {
  const [edts,      setEdts]      = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [sessions,  setSessions]  = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [sessLoading, setSessLoading] = useState(false);
  const [modal,     setModal]     = useState({ open: false, type: '' }); // type: validate | reject | publish
  const [note,      setNote]      = useState('');
  const [saving,    setSaving]    = useState(false);
  const { toast } = useNotification();

  const loadEdts = useCallback(async () => {
    try {
      const res = await TimetableService.getAll({ page_size: 200 });
      const list = res.results ?? res;
      setEdts(list);
      // Re-sync selected if it still exists
      setSelected(prev => prev ? (list.find(e => e.id === prev.id) ?? null) : null);
    } catch (err) {
      toast.error('Erreur', 'Impossible de charger les EDT.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadEdts(); }, [loadEdts]);

  const handleSelect = async (edt) => {
    setSelected(edt);
    setSessions([]);
    setConflicts(null);
    setSessLoading(true);
    try {
      const [sess, conf] = await Promise.all([
        TimetableService.getSessions({ timetable: edt.id, page_size: 300 }),
        TimetableService.detectConflicts(edt.id).catch(() => null),
      ]);
      setSessions(sess);
      setConflicts(conf);
    } catch {
      setSessions([]);
    } finally {
      setSessLoading(false);
    }
  };

  const openModal = (type) => { setModal({ open: true, type }); setNote(''); };
  const closeModal = () => setModal({ open: false, type: '' });

  const quickValidate = (edt) => { setSelected(edt); setModal({ open: true, type: 'validate' }); setNote(''); };
  const quickReject   = (edt) => { setSelected(edt); setModal({ open: true, type: 'reject'   }); setNote(''); };

  const handleAction = async () => {
    if (modal.type === 'reject' && !note.trim()) {
      toast.warning('Champ requis', 'La raison du rejet est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      let updated;
      if (modal.type === 'validate') {
        updated = await TimetableService.validate(selected.id, note);
        toast.success('EDT validé', `L'EDT de ${selected.filiere} a été validé — le responsable peut maintenant le publier.`);
      } else if (modal.type === 'reject') {
        updated = await TimetableService.reject(selected.id, note);
        toast.warning('EDT rejeté', `L'EDT de ${selected.filiere} a été retourné au responsable.`);
      }
      setEdts(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelected(updated);
      closeModal();
    } catch (err) {
      toast.error('Erreur', err.response?.data?.detail || 'Opération impossible.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await TimetableService.exportPdf(selected.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `EDT_${selected.filiere}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Export', 'PDF en cours de téléchargement.');
    } catch {
      toast.error('Erreur', 'Export PDF indisponible.');
    }
  };

  const pending    = edts.filter(e => ['EN_ATTENTE', 'EN_ATTENTE_VALIDATION'].includes(e.status));
  const valides    = edts.filter(e => e.status === 'VALIDE');
  const brouillons = edts.filter(e => e.status === 'BROUILLON');
  const autres     = edts.filter(e => !['EN_ATTENTE', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'BROUILLON'].includes(e.status));

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  // ── Modal content helpers ─────────────────────────────────────
  const modalTitle    = { validate: "Valider l'EDT", reject: "Rejeter l'EDT" }[modal.type] || '';
  const modalBtnClass = { validate: 'btn-success',  reject: 'btn-danger'   }[modal.type] || 'btn-primary';
  const modalBtnLabel = { validate: 'Confirmer la validation', reject: 'Confirmer le rejet' }[modal.type] || 'Confirmer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', height: 'calc(100vh - 120px)', minHeight: '600px' }}>
      {/* ── Header ── */}
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 className="text-page-title">Validation des EDT</h2>
          <p className="text-subtitle">
            {pending.length > 0
              ? `${pending.length} en attente · ${valides.length} validé${valides.length !== 1 ? 's' : ''} · ${brouillons.length} brouillon${brouillons.length !== 1 ? 's' : ''}`
              : brouillons.length > 0
                ? `${brouillons.length} brouillon${brouillons.length !== 1 ? 's' : ''} — en attente de soumission par les responsables`
                : 'Aucun EDT en attente de validation'}
          </p>
        </div>
      </div>

      {/* ── Split panel ── */}
      <div style={{ display: 'flex', gap: '0', flex: 1, minHeight: 0, border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>

        {/* ── Left: EDT list ── */}
        <div style={{ width: '320px', flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Section : En attente ── */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={13} color="#f59e0b" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>En attente</span>
            {pending.length > 0 && (
              <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '10px', padding: '1px 7px' }}>
                {pending.length}
              </span>
            )}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: pending.length > 0 ? '280px' : '80px' }}>
            {pending.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Aucun EDT soumis pour validation.</p>
                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                  Les responsables doivent soumettre leurs brouillons.
                </p>
              </div>
            ) : (
              pending.map(edt => (
                <EdtListItem key={edt.id} edt={edt} selected={selected} onClick={() => handleSelect(edt)} onValidate={quickValidate} onReject={quickReject} />
              ))
            )}
          </div>

          {/* ── Section : Validés (en attente de publication) ── */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #f1f5f9', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={13} color="#15803d" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Validés</span>
            {valides.length > 0 && (
              <span style={{ marginLeft: 'auto', background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '10px', padding: '1px 7px' }}>
                {valides.length}
              </span>
            )}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '180px' }}>
            {valides.length === 0 ? (
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Aucun EDT validé en attente de publication.</p>
              </div>
            ) : (
              valides.map(edt => (
                <EdtListItem key={edt.id} edt={edt} selected={selected} onClick={() => handleSelect(edt)} />
              ))
            )}
          </div>

          {/* ── Section : Brouillons (pas encore soumis) ── */}
          {brouillons.length > 0 && (
            <>
              <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #f1f5f9', background: '#fefce8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={13} color="#ca8a04" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brouillons</span>
                <span style={{ marginLeft: 'auto', background: '#ca8a04', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '10px', padding: '1px 7px' }}>
                  {brouillons.length}
                </span>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '160px' }}>
                {brouillons.map(edt => (
                  <EdtListItem key={edt.id} edt={edt} selected={selected} onClick={() => handleSelect(edt)} />
                ))}
              </div>
            </>
          )}

          {/* ── Section : Autres (publiés, rejetés, archivés) ── */}
          {autres.length > 0 && (
            <>
              <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={13} color="#64748b" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Traités</span>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {autres.map(edt => (
                  <EdtListItem key={edt.id} edt={edt} selected={selected} onClick={() => handleSelect(edt)} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Right: Detail panel ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <Eye size={44} color="#cbd5e1" />
              <h3 style={{ color: '#94a3b8' }}>Sélectionnez un EDT</h3>
              <p style={{ color: '#cbd5e1' }}>Cliquez sur un emploi du temps pour afficher ses détails.</p>
            </div>
          ) : (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* ── Detail header ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                    {selected.filiere}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <StatusBadge status={selected.status} />
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {selected.semester} · {selected.year}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Resp: {selected.responsable}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn btn-ghost btn-sm" onClick={handleExportPdf}>
                    <Download size={13} /> PDF
                  </button>
                  {['EN_ATTENTE', 'EN_ATTENTE_VALIDATION'].includes(selected.status) && (
                    <>
                      <button className="btn btn-danger btn-sm" onClick={() => openModal('reject')}>
                        <XCircle size={13} /> Rejeter
                      </button>
                      <button className="btn btn-success btn-sm" onClick={() => openModal('validate')}>
                        <CheckCircle size={13} /> Valider
                      </button>
                    </>
                  )}
                  {selected.status === 'VALIDE' && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'#dcfce7', borderRadius:'8px', fontSize:'12px', color:'#15803d', fontWeight:600 }}>
                      <CheckCircle size={13} /> Validé — en attente de publication par le responsable
                    </div>
                  )}
                  {selected.status === 'BROUILLON' && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'#fef9c3', borderRadius:'8px', fontSize:'12px', color:'#92400e', fontWeight:500 }}>
                      <Clock size={13} /> En cours de rédaction — le responsable doit soumettre cet EDT
                    </div>
                  )}
                  {selected.status === 'PUBLIE' && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'#eff6ff', borderRadius:'8px', fontSize:'12px', color:'#1a56db', fontWeight:500 }}>
                      <CheckCircle size={13} /> Publié — accessible aux enseignants
                    </div>
                  )}
                  {selected.status === 'REJETE' && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'#fef2f2', borderRadius:'8px', fontSize:'12px', color:'#b91c1c', fontWeight:500 }}>
                      <XCircle size={13} /> Rejeté — retourné au responsable pour correction
                    </div>
                  )}
                  {selected.status === 'ARCHIVE' && (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'#f1f5f9', borderRadius:'8px', fontSize:'12px', color:'#475569', fontWeight:500 }}>
                      <BarChart2 size={13} /> Archivé
                    </div>
                  )}
                </div>
              </div>

              {/* ── Rejection reason banner ── */}
              {selected.status === 'REJETE' && selected.rejectionReason && (
                <div className="alert alert-error">
                  <XCircle size={15} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Raison du rejet :</strong> {selected.rejectionReason}
                  </div>
                </div>
              )}

              {/* ── Stats row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Séances',   value: selected.sessionsCount,   color: '#1a56db' },
                  { label: 'Conflits',  value: selected.conflictsCount,  color: selected.conflictsCount > 0 ? '#ef4444' : '#10b981' },
                  { label: 'Qualité',   value: `${selected.quality}%`,   color: getQualityColor(selected.quality) },
                  { label: 'Semestre',  value: selected.semester,        color: '#64748b' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Quality + Conflicts row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '16px', alignItems: 'start' }}>
                <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', justifyContent: 'center' }}>
                  <QualityGauge score={selected.quality} />
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <AlertTriangle size={14} color={conflicts?.conflicts_found ? '#ef4444' : '#10b981'} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Conflits détectés</span>
                  </div>
                  {sessLoading ? (
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Analyse en cours...</div>
                  ) : conflicts?.conflicts_found ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                      {(conflicts.conflicts || []).slice(0, 8).map((c, i) => (
                        <div key={i} style={{ fontSize: '12px', color: '#7f1d1d', background: '#fef2f2', borderRadius: '6px', padding: '6px 10px', borderLeft: '3px solid #ef4444' }}>
                          {typeof c === 'string' ? c : c.description || JSON.stringify(c)}
                        </div>
                      ))}
                      {(conflicts.conflicts || []).length === 0 && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {conflicts.conflicts_count ?? selected.conflictsCount} conflit(s) détecté(s) — détails non disponibles.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} color="#10b981" />
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>Aucun conflit détecté</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Weekly grid ── */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Grille hebdomadaire
                </h4>
                {sessLoading ? (
                  <div style={{ padding: '32px', textAlign: 'center' }}>
                    <div className="loader" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    Aucune séance dans cet EDT.
                  </div>
                ) : (
                  <MiniGrid sessions={sessions} />
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── Action modal ── */}
      <Modal
        open={modal.open}
        onClose={closeModal}
        size="sm"
        title={modalTitle}
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeModal}>Annuler</button>
            <button className={`btn ${modalBtnClass}`} onClick={handleAction} disabled={saving}>
              {saving ? 'En cours...' : modalBtnLabel}
            </button>
          </>
        }
      >
        {selected && (
          <>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              {modal.type === 'validate' && <>Vous êtes sur le point de <strong style={{ color: '#10b981' }}>valider</strong> l'EDT de </>}
              {modal.type === 'reject'   && <>Vous êtes sur le point de <strong style={{ color: '#ef4444' }}>rejeter</strong> l'EDT de </>}
              <strong style={{ color: '#1e293b' }}>{selected.filiere}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">
                {modal.type === 'validate' ? 'Commentaire (optionnel)' : 'Raison du rejet (obligatoire)'}
              </label>
              <textarea
                className="form-textarea"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={modal.type === 'validate' ? 'Remarques éventuelles pour le responsable...' : 'Expliquez pourquoi cet EDT est rejeté...'}
                rows={3}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
