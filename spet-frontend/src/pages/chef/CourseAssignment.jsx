// ============================================================
// SPET — Chef: Affectations des cours
// Onglets par niveau → sections par semestre dynamiques
// Enseignants filtrés par niveaux_souhaites correspondant
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, X, Filter, RefreshCw,
  CheckCircle, AlertCircle, BookOpen, Clock, Award, Users,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import AcademicsService from '@/services/academics.service';
import UserService from '@/services/user.service';

// ── Constantes ────────────────────────────────────────────────
const NIVEAUX_META = {
  'L1':    { label: 'Licence 1',             color: '#1a56db', bg: '#eff6ff' },
  'L2':    { label: 'Licence 2',             color: '#10b981', bg: '#f0fdf4' },
  'L3-GL': { label: 'L3 Génie Logiciel',     color: '#f59e0b', bg: '#fffbeb' },
  'L3-RT': { label: 'L3 Réseaux & Télécoms', color: '#ef4444', bg: '#fef2f2' },
  'M1':    { label: 'Master 1',              color: '#8b5cf6', bg: '#fdf4ff' },
  'M2':    { label: 'Master 2',              color: '#0ea5e9', bg: '#f0f9ff' },
};
const NIVEAUX_ORDER = ['L1', 'L2', 'L3-GL', 'L3-RT', 'M1', 'M2'];

const SEM_LABEL = s => `Semestre ${s?.replace('S', '') || '—'}`;

// ── Ligne cours ───────────────────────────────────────────────
function CourseRow({ course, teachers, onAssign, saving }) {
  const vht = (course.volume_cm || 0) + (course.volume_td || 0) + (course.volume_tp || 0);
  const isAssigned = !!course.teacher;

  return (
    <tr>
      <td style={{ whiteSpace: 'nowrap' }}>
        <span style={{ padding: '2px 7px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#374151', fontFamily: 'monospace' }}>
          {course.code}
        </span>
      </td>
      <td>
        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
          {course.ue || '—'}
        </span>
      </td>
      <td style={{ fontWeight: 500, color: '#1e293b', maxWidth: '240px' }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={course.name}>
          {course.name}
        </div>
      </td>
      <td style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>{course.filiere_name || '—'}</td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {course.volume_cm > 0 && <span style={{ fontSize: '10px', color: '#1a56db', fontWeight: 600 }}>{course.volume_cm}h CM</span>}
          {course.volume_td > 0 && <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>{course.volume_td}h TD</span>}
          {course.volume_tp > 0 && <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>{course.volume_tp}h TP</span>}
          {vht === 0 && <span style={{ fontSize: '10px', color: '#94a3b8' }}>—</span>}
        </div>
      </td>
      <td style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#1a56db' }}>{course.credits}</td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isAssigned
            ? <CheckCircle size={12} color="#10b981" style={{ flexShrink: 0 }} />
            : <AlertCircle size={12} color="#f59e0b" style={{ flexShrink: 0 }} />}
          <select
            value={course.teacher ? String(course.teacher) : ''}
            onChange={e => onAssign(course.id, e.target.value || null)}
            disabled={saving === course.id}
            style={{ fontSize: '12px', padding: '5px 8px', minWidth: '200px', maxWidth: '260px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
          >
            <option value="">— Non affecté —</option>
            {teachers.length === 0 && (
              <option disabled>Aucun enseignant disponible pour ce niveau</option>
            )}
            {teachers.map(t => (
              <option key={t.id} value={String(t.id)}>
                {t.firstName} {t.lastName}{t.grade ? ` (${t.grade})` : ''}
              </option>
            ))}
          </select>
          {saving === course.id && <span style={{ fontSize: '10px', color: '#94a3b8' }}>…</span>}
        </div>
      </td>
    </tr>
  );
}

// ── Section semestre dynamique ────────────────────────────────
function SemestreSection({ semestre, courses, teachers, onAssign, saving }) {
  const items = courses.filter(c => c.semestre === semestre);
  if (items.length === 0) return null;

  const totalCredits  = items.reduce((s, c) => s + Number(c.credits || 0), 0);
  const totalVHT      = items.reduce((s, c) => s + (c.volume_cm||0) + (c.volume_td||0) + (c.volume_tp||0), 0);
  const assignedCount = items.filter(c => c.teacher).length;

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '8px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: '#eff6ff', color: '#1a56db' }}>
          {SEM_LABEL(semestre)}
        </span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{items.length} cours · {totalCredits} crédits · {totalVHT}h</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: assignedCount === items.length ? '#10b981' : '#f59e0b' }}>
          {assignedCount}/{items.length} affectés
        </span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Code</th><th>UE</th><th>Intitulé</th><th>Filière</th>
              <th style={{ textAlign: 'center' }}>Volume horaire</th>
              <th style={{ textAlign: 'center' }}>Crédits</th>
              <th>Enseignant affecté</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c => (
              <CourseRow key={c.id} course={c} teachers={teachers} onAssign={onAssign} saving={saving} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function CourseAssignment() {
  const [courses,      setCourses]      = useState([]);
  const [filieres,     setFilieres]     = useState([]);
  const [teachers,     setTeachers]     = useState([]);
  const [loadingMain,  setLoadingMain]  = useState(true);
  const [loadingProfs, setLoadingProfs] = useState(false);
  const [activeNiveau, setActiveNiveau] = useState('L1');
  const [search,       setSearch]       = useState('');
  const [semFilter,    setSemFilter]    = useState('all');
  const [saving,       setSaving]       = useState(null);
  const { toast } = useNotification();

  // Chargement initial des cours + filières
  const loadCoursesAndFilieres = useCallback(async () => {
    setLoadingMain(true);
    try {
      const [courseData, filiereData] = await Promise.all([
        AcademicsService.getCourses({ page_size: 1000 }),
        AcademicsService.getFilieres({ page_size: 200 }),
      ]);
      setCourses(courseData);
      setFilieres(filiereData);
    } catch {
      toast.error('Erreur', 'Impossible de charger les cours.');
    } finally {
      setLoadingMain(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadCoursesAndFilieres(); }, [loadCoursesAndFilieres]);

  // Rechargement des enseignants à chaque changement de niveau
  // → filtre backend : niveaux_souhaites contient le niveau actif
  useEffect(() => {
    setLoadingProfs(true);
    UserService.getTeachers({ niveau: activeNiveau, profile_status: 'VALIDE', page_size: 200 })
      .then(setTeachers)
      .catch(() => setTeachers([]))
      .finally(() => setLoadingProfs(false));
  }, [activeNiveau]);

  // Cours du niveau actif
  const niveauFiliereIds = useMemo(
    () => new Set(filieres.filter(f => f.niveau === activeNiveau).map(f => String(f.id))),
    [filieres, activeNiveau]
  );

  const niveauCourses = useMemo(
    () => courses.filter(c => niveauFiliereIds.has(String(c.filiere))),
    [courses, niveauFiliereIds]
  );

  // Semestres présents dans ce niveau (triés)
  const semestresPresents = useMemo(() => {
    const s = [...new Set(niveauCourses.map(c => c.semestre).filter(Boolean))];
    return s.sort((a, b) => {
      const na = parseInt(a.replace('S', ''), 10);
      const nb = parseInt(b.replace('S', ''), 10);
      return na - nb;
    });
  }, [niveauCourses]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return niveauCourses.filter(c => {
      const matchSearch = !search
        || c.name.toLowerCase().includes(q)
        || c.code.toLowerCase().includes(q)
        || (c.ue || '').toLowerCase().includes(q)
        || (c.filiere_name || '').toLowerCase().includes(q)
        || (c.teacher_name || '').toLowerCase().includes(q);
      const matchSem = semFilter === 'all' || c.semestre === semFilter;
      return matchSearch && matchSem;
    });
  }, [niveauCourses, search, semFilter]);

  const stats = useMemo(() => ({
    total:      niveauCourses.length,
    assigned:   niveauCourses.filter(c => c.teacher).length,
    unassigned: niveauCourses.filter(c => !c.teacher).length,
    credits:    niveauCourses.reduce((s, c) => s + Number(c.credits || 0), 0),
  }), [niveauCourses]);

  const countByNiveau = useMemo(() => {
    const map = {};
    for (const code of NIVEAUX_ORDER) {
      const ids = new Set(filieres.filter(f => f.niveau === code).map(f => String(f.id)));
      map[code] = courses.filter(c => ids.has(String(c.filiere))).length;
    }
    return map;
  }, [courses, filieres]);

  const unassignedByNiveau = useMemo(() => {
    const map = {};
    for (const code of NIVEAUX_ORDER) {
      const ids = new Set(filieres.filter(f => f.niveau === code).map(f => String(f.id)));
      map[code] = courses.filter(c => ids.has(String(c.filiere)) && !c.teacher).length;
    }
    return map;
  }, [courses, filieres]);

  const handleAssign = async (courseId, teacherId) => {
    setSaving(courseId);
    try {
      // teacherId est un UUID (string) — ne pas convertir en Number
      const updated = await AcademicsService.updateCourse(courseId, {
        teacher: teacherId || null,
      });
      setCourses(prev => prev.map(c =>
        c.id === courseId
          ? { ...c, teacher: updated.teacher, teacher_name: updated.teacher_name }
          : c
      ));
      const t = teachers.find(t => String(t.id) === String(teacherId));
      if (t) toast.success('Affectation mise à jour', `${t.firstName} ${t.lastName} affecté.`);
      else    toast.info('Désaffectation', 'Enseignant retiré du cours.');
    } catch (err) {
      toast.error('Erreur', err.response?.data?.detail || 'Affectation impossible.');
    } finally {
      setSaving(null);
    }
  };

  const nv = NIVEAUX_META[activeNiveau] || { label: activeNiveau, color: '#1a56db', bg: '#eff6ff' };

  if (loadingMain) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* En-tête */}
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Affectations des cours</h2>
          <p className="text-subtitle">
            {stats.assigned} cours affectés · {stats.unassigned} non affectés · {courses.length} au total
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadCoursesAndFilieres} title="Actualiser">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Onglets niveaux */}
      <div className="tabs" style={{ flexWrap: 'wrap', gap: '4px' }}>
        {NIVEAUX_ORDER.map(code => {
          const meta  = NIVEAUX_META[code];
          const count = countByNiveau[code] || 0;
          const unass = unassignedByNiveau[code] || 0;
          return (
            <button
              key={code}
              className={`tab-btn ${activeNiveau === code ? 'active' : ''}`}
              onClick={() => { setActiveNiveau(code); setSearch(''); setSemFilter('all'); }}
              style={{ position: 'relative' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1px 6px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, background: activeNiveau === code ? meta.color : meta.bg, color: activeNiveau === code ? '#fff' : meta.color, marginRight: '4px' }}>
                {code}
              </span>
              <span style={{ fontSize: '12px' }}>{meta.label}</span>
              <span style={{ marginLeft: '4px', fontSize: '10px', color: '#94a3b8' }}>({count})</span>
              {unass > 0 && (
                <span style={{ marginLeft: '4px', background: '#f59e0b', color: '#fff', fontSize: '9px', fontWeight: 700, borderRadius: '8px', padding: '1px 5px' }}>
                  {unass}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Cours',         value: stats.total,      icon: BookOpen,    color: nv.color,  bg: nv.bg },
          { label: 'Affectés',      value: stats.assigned,   icon: CheckCircle, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Non affectés',  value: stats.unassigned, icon: AlertCircle, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Total crédits', value: stats.credits,    icon: Award,       color: '#8b5cf6', bg: '#fdf4ff' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}><s.icon size={18} color={s.color} /></div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bandeau enseignants disponibles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', color: '#166534' }}>
        <Users size={14} />
        {loadingProfs
          ? 'Chargement des enseignants…'
          : teachers.length > 0
            ? `${teachers.length} enseignant${teachers.length > 1 ? 's' : ''} validé${teachers.length > 1 ? 's' : ''} disponible${teachers.length > 1 ? 's' : ''} pour ${nv.label}`
            : `Aucun enseignant validé n'a sélectionné ${nv.label} dans ses préférences. Les profils doivent être validés par le responsable de filière avant d'apparaître ici.`}
      </div>

      {/* Barre recherche + filtre semestre */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="table-search" style={{ flex: 1, minWidth: '200px', maxWidth: '340px' }}>
          <Search size={14} color="#94a3b8" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par code, intitulé, UE, enseignant…"
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <X size={12} color="#94a3b8" />
            </button>
          )}
        </div>
        {semestresPresents.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Filter size={13} color="#64748b" />
            <button className={`chip ${semFilter === 'all' ? 'active' : ''}`} onClick={() => setSemFilter('all')} style={{ fontSize: '11px' }}>
              Tous
            </button>
            {semestresPresents.map(s => (
              <button key={s} className={`chip ${semFilter === s ? 'active' : ''}`} onClick={() => setSemFilter(s)} style={{ fontSize: '11px' }}>
                {SEM_LABEL(s)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenu */}
      {niveauCourses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} />
          <h3>Aucun cours pour {nv.label}</h3>
          <p>Ajoutez des cours dans la maquette pédagogique pour ce niveau.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={36} />
          <h3>Aucun cours trouvé</h3>
          <p>Ajustez la recherche ou les filtres.</p>
        </div>
      ) : (
        <div className="card-flat" style={{ padding: '16px' }}>
          {semestresPresents
            .filter(s => semFilter === 'all' || s === semFilter)
            .map(s => (
              <SemestreSection
                key={s}
                semestre={s}
                courses={filtered}
                teachers={teachers}
                onAssign={handleAssign}
                saving={saving}
              />
            ))}
        </div>
      )}
    </div>
  );
}
