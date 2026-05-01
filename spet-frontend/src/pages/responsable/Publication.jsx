// ============================================================
// SPET — Responsable: Publication & Submission
// ============================================================

import { useState, useEffect } from 'react';
import { Send, Globe, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import TimetableService from '@/services/timetable.service';
import { getQualityColor } from '@/utils/helpers';
import { getGroupeLabel } from '@/utils/constants';

export default function Publication() {
  const [edts,    setEdts]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState({ open: false, type: '', edt: null });
  const [saving,  setSaving]  = useState(false);
  const { toast } = useNotification();
  const { user }  = useAuth();

  const groupeLabel = getGroupeLabel(user);

  useEffect(() => {
    const params = { page_size: 100 };
    if (user?.filiereId) params.filiere = user.filiereId;
    TimetableService.getAll(params)
      .then(res => setEdts(res.results ?? res))
      .catch(() => toast.error('Erreur', 'Impossible de charger les emplois du temps.'))
      .finally(() => setLoading(false));
  }, [user]);

  const canSubmit  = (e) => e.status === 'BROUILLON';
  const canPublish = (e) => e.status === 'VALIDE';

  const handleAction = async () => {
    setSaving(true);
    try {
      let updated;
      if (modal.type === 'submit') {
        updated = await TimetableService.submit(modal.edt.id);
        toast.success('Soumis', `L'EDT de ${modal.edt.filiere} a été soumis au chef de département.`);
      } else {
        updated = await TimetableService.publish(modal.edt.id);
        toast.success('Publié', `L'EDT de ${modal.edt.filiere} est maintenant publié.`);
      }
      setEdts(prev => prev.map(e => e.id === updated.id ? updated : e));
      setModal({ open: false, type: '', edt: null });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur lors de l\'opération.';
      toast.error('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Soumission & Publication</h2>
          <p className="text-subtitle">{groupeLabel} · Gérez le cycle de vie de vos emplois du temps</p>
        </div>
      </div>

      {/* Workflow steps */}
      <div className="card-flat" style={{ background: '#f8fafc' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Cycle de vie d'un EDT</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap' }}>
          {[
            { label: 'Brouillon', color: '#64748b' },
            { label: 'Soumis', color: '#d97706' },
            { label: 'Validé', color: '#1a56db' },
            { label: 'Publié', color: '#10b981' },
          ].map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ padding: '8px 16px', borderRadius: '20px', background: s.color, color: 'white', fontSize: '12px', fontWeight: 600 }}>
                {s.label}
              </div>
              {i < 3 && <div style={{ width: '32px', height: '2px', background: '#e2e8f0', margin: '0 4px' }} />}
            </div>
          ))}
        </div>
      </div>

      {edts.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} />
          <h3>Aucun emploi du temps</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {edts.map(edt => (
            <div key={edt.id} style={{
              background: 'white', borderRadius: '12px',
              border: '1px solid #e2e8f0', padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '12px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{edt.filiere}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>{edt.semester} · {edt.year}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div className="progress-bar" style={{ width: '60px' }}>
                    <div className="progress-fill" style={{ width: `${edt.quality}%`, background: getQualityColor(edt.quality) }} />
                  </div>
                  <span style={{ fontSize: '11px', color: getQualityColor(edt.quality), fontWeight: 600 }}>{edt.quality}%</span>
                </div>
              </div>
              <StatusBadge status={edt.status} />
              <div style={{ display: 'flex', gap: '8px' }}>
                {canSubmit(edt) && (
                  <button className="btn btn-warning btn-sm" onClick={() => setModal({ open: true, type: 'submit', edt })}>
                    <Send size={13} /> Soumettre
                  </button>
                )}
                {canPublish(edt) && (
                  <button className="btn btn-success btn-sm" onClick={() => setModal({ open: true, type: 'publish', edt })}>
                    <Globe size={13} /> Publier
                  </button>
                )}
                {!canSubmit(edt) && !canPublish(edt) && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {edt.status === 'PUBLIE' ? '✓ Publié' :
                     edt.status === 'EN_ATTENTE_VALIDATION' ? 'En cours...' :
                     edt.status === 'REJETE' ? '✗ Rejeté' : '—'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, type: '', edt: null })}
        size="sm"
        title={modal.type === 'submit' ? 'Soumettre l\'EDT' : 'Publier l\'EDT'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal({ open: false, type: '', edt: null })}>Annuler</button>
            <button className={`btn ${modal.type === 'submit' ? 'btn-warning' : 'btn-success'}`} onClick={handleAction} disabled={saving}>
              {saving ? 'En cours...' : (modal.type === 'submit' ? 'Confirmer la soumission' : 'Confirmer la publication')}
            </button>
          </>
        }
      >
        {modal.edt && (
          <div>
            {modal.type === 'submit' ? (
              <div className="alert alert-warning" style={{ marginBottom: '12px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>L'EDT sera envoyé au chef de département pour validation.</span>
              </div>
            ) : (
              <div className="alert alert-success" style={{ marginBottom: '12px' }}>
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                <span>L'EDT sera rendu visible à tous les enseignants et étudiants.</span>
              </div>
            )}
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Confirmer cette action pour <strong style={{ color: '#1e293b' }}>{modal.edt.filiere}</strong> ?
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
