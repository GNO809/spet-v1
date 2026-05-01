// ============================================================
// SPET — Admin: Filières & Niveaux
// ============================================================

import { useState, useEffect } from 'react';
import {
  GraduationCap, Plus, Edit2, Trash2, Layers,
  Users, X, CheckCircle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useNotification } from '@/contexts/NotificationContext';
import AcademicsService from '@/services/academics.service';
import UserService from '@/services/user.service';

// ── Niveaux DIT officiels ────────────────────────────────────
const NIVEAUX_DIT = [
  { code: 'L1',    label: 'Licence 1',             color: '#1a56db', bg: '#eff6ff', etudiants: 120, ecues: 16, semestres: 'S1 – S2' },
  { code: 'L2',    label: 'Licence 2',             color: '#0ea5e9', bg: '#f0f9ff', etudiants: 105, ecues: 19, semestres: 'S3 – S4' },
  { code: 'L3-GL', label: 'L3 Génie Logiciel',     color: '#10b981', bg: '#f0fdf4', etudiants: 48,  ecues: 14, semestres: 'S5 – S6' },
  { code: 'L3-RT', label: 'L3 Réseaux & Télécoms', color: '#34d399', bg: '#f0fdf4', etudiants: 44,  ecues: 14, semestres: 'S5 – S6' },
  { code: 'M1',    label: 'Master 1',              color: '#8b5cf6', bg: '#fdf4ff', etudiants: 38,  ecues: 10, semestres: 'S7 – S8' },
  { code: 'M2',    label: 'Master 2',              color: '#a78bfa', bg: '#fdf4ff', etudiants: 28,  ecues: 10, semestres: 'S9 – S10' },
];

const EMPTY = { name: '', code: '', responsable: '', description: '' };


// ── Onglet bouton ─────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button className={`tab-btn ${active ? 'active' : ''}`} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Icon size={15} />{children}
    </button>
  );
}

// ── Section Filières ─────────────────────────────────────────
function FilieresSection({ filieres, responsables, onAdd, onEdit, onDelete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="section-header" style={{ marginBottom: 0 }}>
        <div>
          <h3 className="text-section-title">Filières enregistrées</h3>
          <p className="text-subtitle">{filieres.length} filière{filieres.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <Plus size={14} /> Ajouter une filière
        </button>
      </div>

      {filieres.length === 0 ? (
        <div className="empty-state">
          <GraduationCap size={40} />
          <h3>Aucune filière enregistrée</h3>
          <p>Commencez par ajouter votre première filière.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Filière</th>
                  <th>Code</th>
                  <th>Responsable</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filieres.map(f => {
                  const resp = responsables.find(r => String(r.id) === String(f.responsable));
                  return (
                    <tr key={f.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{f.name}</div>
                        {f.description && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{f.description}</div>
                        )}
                      </td>
                      <td>
                        <span style={{ padding: '2px 10px', borderRadius: '6px', background: '#eff6ff', color: '#1a56db', fontSize: '11px', fontWeight: 700 }}>
                          {f.code}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#374151' }}>
                        {resp
                          ? `${resp.firstName} ${resp.lastName}`
                          : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Non assigné</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-icon" onClick={() => onEdit(f)} title="Modifier"><Edit2 size={13} /></button>
                          <button className="btn-icon" onClick={() => onDelete(f)} title="Supprimer" style={{ color: '#ef4444' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>{filieres.length} filière{filieres.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section Niveaux ──────────────────────────────────────────
function NiveauxSection() {
  const totalEcues = NIVEAUX_DIT.reduce((s, n) => s + n.ecues, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 className="text-section-title">Niveaux d'études — Département Informatique</h3>
        <p className="text-subtitle">Structure officielle LMD · Université Iba Der Thiam de Thiès</p>
      </div>

      {/* KPIs niveaux */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {[
          { label: 'Niveaux', value: NIVEAUX_DIT.length, color: '#1a56db', bg: '#eff6ff' },
          { label: 'ECUEs',   value: totalEcues,          color: '#8b5cf6', bg: '#fdf4ff' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: '14px 18px' }}>
            <div className="stat-icon" style={{ background: s.bg }}>
              <GraduationCap size={18} color={s.color} />
            </div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cartes niveaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        {NIVEAUX_DIT.map(nv => (
          <div key={nv.code} style={{
            background: '#fff', borderRadius: '12px', padding: '18px',
            border: `1px solid ${nv.color}25`,
            borderLeft: `4px solid ${nv.color}`,
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
                  background: nv.bg, color: nv.color, fontSize: '12px', fontWeight: 800,
                  marginBottom: '4px',
                }}>{nv.code}</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{nv.label}</div>
              </div>
              <CheckCircle size={18} color={nv.color} style={{ opacity: 0.7 }} />
            </div>

            {/* Métriques */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'ECUEs',     value: nv.ecues },
                { label: 'Semestres', value: nv.semestres },
              ].map(m => (
                <div key={m.label} style={{
                  background: nv.bg, borderRadius: '8px', padding: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: nv.color }}>{m.value}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="alert alert-info">
        <Layers size={15} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '13px' }}>
          Les niveaux L1 à M2 sont définis par la maquette pédagogique officielle 2018 du DIT.
          Le nombre d'étudiants est indicatif — les données réelles proviennent des inscriptions.
        </span>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function AdminFilieres() {
  const [tab,          setTab]          = useState('filieres');
  const [filieres,     setFilieres]     = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState({ open: false, mode: 'create', item: null });
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});
  const { toast, confirm } = useNotification();

  const load = () => {
    setLoading(true);
    Promise.all([
      AcademicsService.getFilieres(),
      UserService.getAll({ role: 'RESP_FIL', page_size: 100 }),
    ]).then(([f, resp]) => {
      setFilieres(Array.isArray(f) ? f : []);
      setResponsables(resp.results ?? resp ?? []);
    }).catch(() => toast.error('Erreur', 'Impossible de charger les filières.')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setErrors({}); setModal({ open: true, mode: 'create', item: null }); };
  const openEdit   = f  => {
    setForm({ name: f.name, code: f.code, responsable: f.responsable || '', description: f.description || '' });
    setErrors({});
    setModal({ open: true, mode: 'edit', item: f });
  };
  const closeModal = ()  => setModal(m => ({ ...m, open: false }));

  const askDelete = async (f) => {
    const ok = await confirm(`Supprimer la filière « ${f.name} » ? Cette action est irréversible.`);
    if (!ok) return;
    try {
      await AcademicsService.deleteFiliere(f.id);
      setFilieres(prev => prev.filter(x => x.id !== f.id));
      toast.success('Filière supprimée', `« ${f.name} » a été supprimée.`);
    } catch {
      toast.error('Erreur', 'Impossible de supprimer cette filière.');
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Le nom est obligatoire';
    if (!form.code.trim()) e.code = 'Le code est obligatoire';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        code:        form.code.trim().toUpperCase(),
        responsable: form.responsable || null,
        description: form.description,
      };
      if (modal.mode === 'create') {
        const created = await AcademicsService.createFiliere(payload);
        setFilieres(prev => [...prev, created]);
        toast.success('Filière créée', `« ${form.name} » a été ajoutée.`);
      } else {
        const updated = await AcademicsService.updateFiliere(modal.item.id, payload);
        setFilieres(prev => prev.map(f => f.id === modal.item.id ? updated : f));
        toast.success('Filière mise à jour', 'Les modifications ont été enregistrées.');
      }
      closeModal();
    } catch (err) {
      toast.error('Erreur', err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de l\'enregistrement.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loader" style={{ margin: '60px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>

      {/* ── En-tête ── */}
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Filières & Niveaux</h2>
          <p className="text-subtitle">Structures académiques du Département Informatique</p>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="tabs">
        <TabBtn active={tab === 'filieres'} onClick={() => setTab('filieres')} icon={GraduationCap}>
          Filières ({filieres.length})
        </TabBtn>
        <TabBtn active={tab === 'niveaux'} onClick={() => setTab('niveaux')} icon={Layers}>
          Niveaux (L1 → M2)
        </TabBtn>
      </div>

      {tab === 'filieres' && (
        <FilieresSection
          filieres={filieres}
          responsables={responsables}
          onAdd={openCreate}
          onEdit={openEdit}
          onDelete={askDelete}
        />
      )}

      {tab === 'niveaux' && <NiveauxSection />}

      {/* ── Modal création/édition ── */}
      <Modal
        open={modal.open} onClose={closeModal}
        title={modal.mode === 'create' ? 'Ajouter une filière' : 'Modifier la filière'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={closeModal}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : (modal.mode === 'create' ? 'Créer' : 'Mettre à jour')}
            </button>
          </>
        }
      >
        <div className="grid-2" style={{ gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Nom de la filière</label>
            <input className="form-input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex : Licence Informatique"
              style={errors.name ? { borderColor: '#ef4444' } : {}} />
            {errors.name && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.name}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Code</label>
            <input className="form-input" value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="Ex : LIC-INFO"
              style={errors.code ? { borderColor: '#ef4444' } : {}} />
            {errors.code && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.code}</span>}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '12px' }}>
          <label className="form-label">Responsable de filière</label>
          <select className="form-select" value={form.responsable}
            onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}>
            <option value="">— Non assigné —</option>
            {responsables.map(r => (
              <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
          <label className="form-label">Description <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optionnel)</span></label>
          <textarea className="form-textarea" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description de la filière…"
            rows={2} />
        </div>
      </Modal>

    </div>
  );
}
