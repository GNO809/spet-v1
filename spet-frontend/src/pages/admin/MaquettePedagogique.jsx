// ============================================================
// SPET — Admin: Maquette Pédagogique
// ============================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BookOpenCheck, Plus, Edit2, Trash2, Search, X,
  AlertTriangle, Filter, BookOpen, Clock, Award, User, RefreshCw,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useNotification } from '@/contexts/NotificationContext';
import AcademicsService from '@/services/academics.service';
import UserService from '@/services/user.service';

// ── Niveaux ──────────────────────────────────────────────────
const NIVEAUX_META = {
  'L1':    { label: 'Licence 1',                color: '#1a56db', bg: '#eff6ff', semestres: ['S1', 'S2'] },
  'L2':    { label: 'Licence 2',                color: '#10b981', bg: '#f0fdf4', semestres: ['S3', 'S4'] },
  'L3-GL': { label: 'L3 Génie Logiciel',        color: '#f59e0b', bg: '#fffbeb', semestres: ['S5', 'S6'] },
  'L3-RT': { label: 'L3 Réseaux & Télécoms',    color: '#ef4444', bg: '#fef2f2', semestres: ['S5', 'S6'] },
  'M1':    { label: 'Master 1',                 color: '#8b5cf6', bg: '#fdf4ff', semestres: ['S7', 'S8'] },
  'M2':    { label: 'Master 2',                 color: '#0ea5e9', bg: '#f0f9ff', semestres: ['S9', 'S10'] },
};
const NIVEAUX_ORDER = ['L1', 'L2', 'L3-GL', 'L3-RT', 'M1', 'M2'];

const SEMESTRE_LABELS = {
  S1: 'Semestre 1', S2: 'Semestre 2', S3: 'Semestre 3',
  S4: 'Semestre 4', S5: 'Semestre 5', S6: 'Semestre 6',
  S7: 'Semestre 7', S8: 'Semestre 8', S9: 'Semestre 9', S10: 'Semestre 10',
};
const ALL_SEMESTRES = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10'];

const EMPTY_FORM = {
  code: '', ue: '', name: '', credits: '', coefficient: '',
  volume_cm: '', volume_td: '', volume_tp: '',
  semestre: 'S1', filiere: '', teacher: '',
};

// ── Ligne cours ───────────────────────────────────────────────
function CourseRow({ c, teachers, onEdit, onDelete }) {
  const vht = (c.volume_cm || 0) + (c.volume_td || 0) + (c.volume_tp || 0);
  const teacher = teachers.find(t => t.id === c.teacher || String(t.id) === String(c.teacher));
  const teacherName = c.teacher_name || (teacher ? `${teacher.firstName} ${teacher.lastName}` : null);
  return (
    <tr>
      <td>
        <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#374151', fontFamily: 'monospace' }}>
          {c.code}
        </span>
      </td>
      <td>
        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
          {c.ue || '—'}
        </span>
      </td>
      <td style={{ fontWeight: 500, color: '#1e293b', maxWidth: '240px' }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>{c.name}</div>
      </td>
      <td style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#1a56db' }}>{c.credits}</td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {c.volume_cm > 0 && <span style={{ fontSize: '11px', color: '#1a56db', whiteSpace: 'nowrap' }}>{c.volume_cm}h CM</span>}
          {c.volume_td > 0 && <span style={{ fontSize: '11px', color: '#10b981', whiteSpace: 'nowrap' }}>{c.volume_td}h TD</span>}
          {c.volume_tp > 0 && <span style={{ fontSize: '11px', color: '#f59e0b', whiteSpace: 'nowrap' }}>{c.volume_tp}h TP</span>}
          {vht === 0 && <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>}
        </div>
      </td>
      <td style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>{vht > 0 ? `${vht}h` : '—'}</td>
      <td style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>{c.coefficient || 1}</td>
      <td style={{ fontSize: '12px', color: '#64748b' }}>
        {teacherName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Non assigné</span>}
      </td>
      <td>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-icon" onClick={() => onEdit(c)} title="Modifier"><Edit2 size={13} /></button>
          <button className="btn-icon" onClick={() => onDelete(c)} title="Supprimer" style={{ color: '#ef4444' }}><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

// ── Table par semestre ────────────────────────────────────────
function SemestreTable({ semestre, courses, teachers, onEdit, onDelete, niveauColor, niveauBg }) {
  const items = courses.filter(c => c.semestre === semestre);
  if (items.length === 0) return null;
  const totalCredits = items.reduce((s, c) => s + Number(c.credits || 0), 0);
  const totalVHT     = items.reduce((s, c) => s + (c.volume_cm||0) + (c.volume_td||0) + (c.volume_tp||0), 0);
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '6px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: niveauBg, color: niveauColor }}>
          {SEMESTRE_LABELS[semestre] || semestre}
        </span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{items.length} cours</span>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>·</span>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{totalCredits} crédits</span>
        {totalVHT > 0 && <>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>·</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{totalVHT}h VHT</span>
        </>}
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Code</th><th>UE</th><th>Intitulé</th>
              <th style={{ textAlign: 'center' }}>Crédits</th>
              <th style={{ textAlign: 'center' }}>Volume horaire</th>
              <th style={{ textAlign: 'center' }}>VHT</th>
              <th style={{ textAlign: 'center' }}>Coeff.</th>
              <th>Enseignant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <CourseRow key={c.id} c={c} teachers={teachers} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Formulaire cours ──────────────────────────────────────────
function CourseForm({ form, setForm, errors, filieres, teachers, activeNiveau }) {
  const niveauMeta    = NIVEAUX_META[activeNiveau] || { semestres: ['S1', 'S2'] };
  const niveauFilieres = filieres.filter(f => f.niveau === activeNiveau);

  const inp = (key, label, type = 'text', opts = {}) => (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <label className="form-label">
        {label}{opts.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </label>
      {opts.select ? (
        <select className="form-select" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
          {opts.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input className="form-input" type={type} min={type === 'number' ? 0 : undefined}
          value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={opts.placeholder || ''}
          style={errors[key] ? { borderColor: '#ef4444' } : {}}
        />
      )}
      {errors[key] && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors[key]}</span>}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="grid-2" style={{ gap: '12px' }}>
        {inp('code', 'Code', 'text', { required: true, placeholder: 'ex: INF1131' })}
        {inp('semestre', 'Semestre', 'text', { required: true, select: true, options: niveauMeta.semestres.map(s => ({ value: s, label: SEMESTRE_LABELS[s] || s })) })}
      </div>
      {inp('ue', "Unité d'Enseignement (UE)", 'text', { placeholder: 'ex: Informatique' })}
      {inp('name', 'Intitulé du cours', 'text', { required: true, placeholder: 'ex: Algorithmique et programmation 1' })}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Filière <span style={{ color: '#ef4444' }}>*</span></label>
        <select className="form-select" value={form.filiere}
          onChange={e => setForm(f => ({ ...f, filiere: e.target.value }))}
          style={errors.filiere ? { borderColor: '#ef4444' } : {}}>
          <option value="">— Sélectionner une filière —</option>
          {niveauFilieres.map(f => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
        </select>
        {errors.filiere && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', display: 'block' }}>{errors.filiere}</span>}
      </div>
      <div className="grid-2" style={{ gap: '12px' }}>
        {inp('credits',     'Crédits',     'number', { required: true, placeholder: '4' })}
        {inp('coefficient', 'Coefficient', 'number', { placeholder: '3' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {inp('volume_cm', 'Heures CM', 'number', { placeholder: '20' })}
        {inp('volume_td', 'Heures TD', 'number', { placeholder: '20' })}
        {inp('volume_tp', 'Heures TP', 'number', { placeholder: '0'  })}
      </div>
      {/* L'affectation des enseignants est gérée par le chef de département */}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function AdminMaquette() {
  const [courses,      setCourses]      = useState([]);
  const [filieres,     setFilieres]     = useState([]);
  const [teachers,     setTeachers]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeNiveau, setActiveNiveau] = useState('L1');
  const [search,       setSearch]       = useState('');
  const [semFilter,    setSemFilter]    = useState('all');
  const [modal,        setModal]        = useState({ open: false, mode: 'create', item: null });
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const { toast, confirm } = useNotification();
  // Stable ref so toast doesn't cause loadAll to re-create on every render
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [courseData, filiereData, teacherData] = await Promise.all([
        AcademicsService.getCourses({ page_size: 1000 }),
        AcademicsService.getFilieres({ page_size: 200 }),
        UserService.getTeachers({ page_size: 200 }),
      ]);
      setCourses(courseData);
      setFilieres(filiereData);
      setTeachers(Array.isArray(teacherData) ? teacherData : (teacherData.results ?? []));
    } catch {
      toastRef.current.error('Erreur', 'Impossible de charger la maquette.');
    } finally {
      setLoading(false);
    }
  }, []); // pas de dépendance sur toast → pas de rechargement intempestif

  useEffect(() => { loadAll(); }, [loadAll]);

  // Filières et cours du niveau actif
  const niveauFiliereIds = useMemo(
    () => new Set(filieres.filter(f => f.niveau === activeNiveau).map(f => String(f.id))),
    [filieres, activeNiveau],
  );

  const niveauCourses = useMemo(
    () => courses.filter(c => niveauFiliereIds.has(String(c.filiere))),
    [courses, niveauFiliereIds],
  );

  const niveauSemestres = NIVEAUX_META[activeNiveau]?.semestres ?? ['S1', 'S2'];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return niveauCourses.filter(c => {
      const matchSearch = !search
        || c.name.toLowerCase().includes(q)
        || c.code.toLowerCase().includes(q)
        || (c.ue || '').toLowerCase().includes(q);
      const matchSem = semFilter === 'all' || c.semestre === semFilter;
      return matchSearch && matchSem;
    });
  }, [niveauCourses, search, semFilter]);

  const stats = useMemo(() => ({
    total:        niveauCourses.length,
    totalCredits: niveauCourses.reduce((s, c) => s + Number(c.credits || 0), 0),
    totalVHT:     niveauCourses.reduce((s, c) => s + (c.volume_cm||0) + (c.volume_td||0) + (c.volume_tp||0), 0),
    assigns:      niveauCourses.filter(c => c.teacher != null && c.teacher !== '').length,
  }), [niveauCourses]);

  // ── CRUD ─────────────────────────────────────────────────────
  const openCreate = () => {
    const defaultFiliere = filieres.find(f => f.niveau === activeNiveau);
    const defaultSem     = niveauSemestres[0] || 'S1';
    setForm({ ...EMPTY_FORM, filiere: defaultFiliere ? String(defaultFiliere.id) : '', semestre: defaultSem });
    setErrors({});
    setModal({ open: true, mode: 'create', item: null });
  };

  const openEdit = (item) => {
    setForm({
      code:        item.code,
      ue:          item.ue || '',
      name:        item.name,
      credits:     String(item.credits),
      coefficient: String(item.coefficient || 1),
      volume_cm:   String(item.volume_cm || 0),
      volume_td:   String(item.volume_td || 0),
      volume_tp:   String(item.volume_tp || 0),
      semestre:    item.semestre || niveauSemestres[0] || 'S1',
      filiere:     String(item.filiere),
      teacher:     item.teacher != null ? String(item.teacher) : '',
    });
    setErrors({});
    setModal({ open: true, mode: 'edit', item });
  };

  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const validate = () => {
    const e = {};
    if (!form.code.trim())                      e.code    = 'Le code est obligatoire';
    if (!form.name.trim())                      e.name    = "L'intitulé est obligatoire";
    if (!form.filiere)                          e.filiere = 'La filière est obligatoire';
    if (!form.credits || Number(form.credits) <= 0) e.credits = 'Crédits invalides';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault(); // sécurité anti-submit
    if (!validate()) return;
    setSaving(true);
    const payload = {
      code:        form.code.trim().toUpperCase(),
      ue:          form.ue.trim(),
      name:        form.name.trim(),
      credits:     Number(form.credits),
      coefficient: Number(form.coefficient) || 1,
      volume_cm:   Number(form.volume_cm) || 0,
      volume_td:   Number(form.volume_td) || 0,
      volume_tp:   Number(form.volume_tp) || 0,
      semestre:    form.semestre,
      filiere:     Number(form.filiere),
      teacher:     form.teacher ? Number(form.teacher) : null,
    };
    try {
      if (modal.mode === 'create') {
        const created = await AcademicsService.createCourse(payload);
        setCourses(prev => [...prev, created]);
        toast.success('Cours ajouté', `"${created.name}" ajouté à la maquette.`);
      } else {
        const updated = await AcademicsService.updateCourse(modal.item.id, payload);
        setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Cours mis à jour', `"${updated.name}" modifié.`);
      }
      closeModal();
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Erreur lors de la sauvegarde.';
      toast.error('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    const ok = await confirm(`Supprimer "${course.name}" (${course.code}) ? Action irréversible.`);
    if (!ok) return;
    try {
      await AcademicsService.deleteCourse(course.id);
      setCourses(prev => prev.filter(c => c.id !== course.id));
      toast.success('Supprimé', `"${course.name}" supprimé.`);
    } catch {
      toast.error('Erreur', 'Suppression impossible — ce cours est peut-être lié à des séances.');
    }
  };

  const nv = NIVEAUX_META[activeNiveau] || { label: activeNiveau, color: '#1a56db', bg: '#eff6ff', semestres: ['S1','S2'] };

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* En-tête */}
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Maquette Pédagogique</h2>
          <p className="text-subtitle">
            Licence &amp; Master Informatique — UFR Sciences et Technologies, Université de Thiès · {courses.length} cours au total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={loadAll} title="Actualiser"><RefreshCw size={14} /></button>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Ajouter un cours</button>
        </div>
      </div>

      {/* Onglets niveaux */}
      <div className="tabs" style={{ flexWrap: 'wrap', gap: '4px' }}>
        {NIVEAUX_ORDER.map(code => {
          const meta  = NIVEAUX_META[code];
          const count = courses.filter(c => {
            const fil = filieres.find(f => String(f.id) === String(c.filiere));
            return fil?.niveau === code;
          }).length;
          return (
            <button key={code}
              className={`tab-btn ${activeNiveau === code ? 'active' : ''}`}
              onClick={() => { setActiveNiveau(code); setSearch(''); setSemFilter('all'); }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '1px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: 700,
                background: activeNiveau === code ? meta.color : meta.bg,
                color:      activeNiveau === code ? '#fff' : meta.color,
                marginRight: '4px',
              }}>{code}</span>
              <span style={{ fontSize: '12px' }}>{meta.label}</span>
              <span style={{ marginLeft: '4px', fontSize: '10px', fontWeight: 600, color: activeNiveau === code ? meta.color : '#94a3b8' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          { label: 'Cours',          value: stats.total,          icon: BookOpen, color: nv.color,  bg: nv.bg },
          { label: 'Total crédits',  value: stats.totalCredits,   icon: Award,   color: '#8b5cf6', bg: '#fdf4ff' },
          { label: 'VHT total',      value: stats.totalVHT > 0 ? `${stats.totalVHT}h` : '—', icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Cours affectés', value: `${stats.assigns}/${stats.total}`, icon: User, color: '#10b981', bg: '#f0fdf4' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}><s.icon size={20} color={s.color} /></div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: '22px' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Barre recherche + filtres */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="table-search" style={{ flex: 1, minWidth: '200px', maxWidth: '340px' }}>
          <Search size={14} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par code, intitulé, UE…" />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <X size={12} color="#94a3b8" />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Filter size={13} color="#64748b" />
          <button className={`chip ${semFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSemFilter('all')} style={{ fontSize: '11px' }}>Tous</button>
          {niveauSemestres.map(s => (
            <button key={s} className={`chip ${semFilter === s ? 'active' : ''}`}
              onClick={() => setSemFilter(s)} style={{ fontSize: '11px' }}>
              {SEMESTRE_LABELS[s] || s}
            </button>
          ))}
        </div>
        {(search || semFilter !== 'all') && (
          <span style={{ fontSize: '12px', color: '#64748b' }}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Contenu */}
      {niveauCourses.length === 0 ? (
        <div className="empty-state">
          <BookOpenCheck size={40} />
          <h3>Aucun cours pour ce niveau</h3>
          <p>Ajoutez des cours pour {nv.label}.</p>
          <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ marginTop: '12px' }}>
            <Plus size={13} /> Ajouter un cours
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><Search size={40} /><h3>Aucun cours trouvé</h3><p>Ajustez la recherche ou les filtres.</p></div>
      ) : (
        <div className="card-flat" style={{ padding: '16px' }}>
          {niveauSemestres.map(sem =>
            filtered.some(c => c.semestre === sem) ? (
              <SemestreTable key={sem} semestre={sem} courses={filtered} teachers={teachers}
                onEdit={openEdit} onDelete={handleDelete}
                niveauColor={nv.color} niveauBg={nv.bg}
              />
            ) : null
          )}
          {/* Cours hors semestres attendus (données anciennes) */}
          {filtered.filter(c => !niveauSemestres.includes(c.semestre)).map(c => (
            <SemestreTable key={c.semestre} semestre={c.semestre} courses={filtered.filter(x => x.semestre === c.semestre)}
              teachers={teachers} onEdit={openEdit} onDelete={handleDelete}
              niveauColor={nv.color} niveauBg={nv.bg}
            />
          )).filter((_, i, arr) => arr.findIndex(x => x.key === arr[i]?.key) === i)}
        </div>
      )}

      {/* Modal ajout / modification */}
      <Modal
        open={modal.open}
        onClose={closeModal}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: nv.bg, color: nv.color }}>{activeNiveau}</span>
            {modal.mode === 'create' ? 'Ajouter un cours' : 'Modifier le cours'}
          </div>
        }
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : (modal.mode === 'create' ? 'Ajouter' : 'Mettre à jour')}
            </button>
          </>
        }
      >
        <CourseForm form={form} setForm={setForm} errors={errors}
          filieres={filieres} teachers={teachers} activeNiveau={activeNiveau} />
      </Modal>

    </div>
  );
}
