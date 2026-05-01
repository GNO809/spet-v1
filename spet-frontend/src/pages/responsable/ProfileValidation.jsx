// ============================================================
// SPET — Validation des Profils Enseignants (Responsable)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, Clock, ChevronDown,
  RefreshCw, User, Search, FileText, ExternalLink,
  BookOpen, Layers,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import UserService from '@/services/user.service';

// ── Style tokens ──────────────────────────────────────────────
const S = {
  card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' },
  btn: (bg = '#1e3a8a', c = 'white', extra = {}) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    borderRadius: '8px', border: 'none', background: bg, color: c,
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', ...extra,
  }),
  inp: {
    padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
    fontSize: '13px', color: '#1e293b', background: '#fff', fontFamily: 'inherit',
  },
};

const STATUS_MAP = {
  COMPLET:   { bg: '#dbeafe', c: '#1e3a8a',  label: 'Complet' },
  INCOMPLET: { bg: '#fef3c7', c: '#92400e',  label: 'Incomplet' },
  VALIDE:    { bg: '#dcfce7', c: '#15803d',  label: 'Validé' },
  REJETE:    { bg: '#fee2e2', c: '#dc2626',  label: 'Rejeté' },
};

function ProfileBadge({ status }) {
  const m = STATUS_MAP[status] || STATUS_MAP.INCOMPLET;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: m.bg, color: m.c }}>
      {m.label}
    </span>
  );
}

function NiveauChip({ niveau, isMatch }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '3px',
      padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
      background: isMatch ? '#eff6ff' : '#f1f5f9',
      color: isMatch ? '#1e3a8a' : '#94a3b8',
      border: `1px solid ${isMatch ? '#bfdbfe' : '#e2e8f0'}`,
    }}>
      {isMatch && <CheckCircle size={9}/>}
      {niveau}
    </span>
  );
}

function TeacherCard({ teacher, myNiveaux, onValidate, onReject }) {
  const [open, setOpen]       = useState(false);
  const [showRej, setShowRej] = useState(false);
  const [motif, setMotif]     = useState('');
  const [saving, setSaving]   = useState(false);

  const initials = `${(teacher.firstName || '')[0] || ''}${(teacher.lastName || '')[0] || ''}`.toUpperCase();
  const status   = teacher.profileStatus;
  const pending  = !status || ['COMPLET', 'INCOMPLET'].includes(status);
  const niveauxChoisis = teacher.niveauxSouhaites || [];

  async function doValidate() {
    setSaving(true);
    try { await onValidate(teacher.id); }
    finally { setSaving(false); }
  }

  async function doReject() {
    if (!motif.trim()) return;
    setSaving(true);
    try { await onReject(teacher.id, motif.trim()); }
    finally { setSaving(false); setShowRej(false); setMotif(''); }
  }

  return (
    <div style={{ ...S.card, marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        {/* Avatar + info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
            background: '#eff6ff', border: '1px solid #dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {teacher.avatar
              ? <img src={teacher.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : <span style={{ color: '#1e3a8a', fontWeight: 700, fontSize: '15px' }}>{initials}</span>
            }
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                {teacher.firstName} {teacher.lastName}
              </span>
              <ProfileBadge status={status || 'INCOMPLET'}/>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
              {teacher.grade && <span style={{ marginRight: '12px' }}>{teacher.grade}</span>}
              {teacher.specialite && <span style={{ marginRight: '12px', fontStyle: 'italic' }}>{teacher.specialite}</span>}
              <span>{teacher.email}</span>
            </div>
            {/* Niveaux souhaités */}
            {niveauxChoisis.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {niveauxChoisis.map(n => (
                  <NiveauChip key={n} niveau={n} isMatch={myNiveaux.includes(n)}/>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <button onClick={() => setOpen(o => !o)} style={S.btn('#f8fafc', '#475569')}>
            <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}/>
            {open ? 'Réduire' : 'Voir profil'}
          </button>
          {pending && (
            <>
              <button onClick={doValidate} disabled={saving} style={S.btn('#10b981', 'white')}>
                <CheckCircle size={13}/> Valider
              </button>
              <button onClick={() => setShowRej(r => !r)} disabled={saving} style={S.btn('#fff7ed', '#c2410c')}>
                <XCircle size={13}/> Rejeter
              </button>
            </>
          )}
          {status === 'VALIDE' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#15803d', fontSize: '12px', fontWeight: 600 }}>
              <CheckCircle size={13}/> Validé
            </div>
          )}
          {status === 'REJETE' && (
            <button onClick={doValidate} disabled={saving} style={S.btn('#dcfce7', '#15803d')}>
              <CheckCircle size={13}/> Re-valider
            </button>
          )}
        </div>
      </div>

      {/* Rejection form */}
      {showRej && (
        <div style={{ marginTop: '12px', background: '#fffbeb', borderRadius: '8px', padding: '12px', border: '1px solid #fde68a' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#92400e', marginBottom: '5px', textTransform: 'uppercase' }}>
            Motif de rejet (obligatoire)
          </label>
          <textarea value={motif} onChange={e => setMotif(e.target.value)} rows={2}
            placeholder="Expliquez la raison du rejet…"
            style={{ ...S.inp, width: '100%', resize: 'vertical', boxSizing: 'border-box' }}/>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={doReject} disabled={!motif.trim() || saving}
              style={S.btn(motif.trim() ? '#ef4444' : '#94a3b8', 'white')}>
              <XCircle size={12}/> Confirmer le rejet
            </button>
            <button onClick={() => { setShowRej(false); setMotif(''); }} style={S.btn('#f1f5f9', '#475569')}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Expanded profile details */}
      {open && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Coordonnées */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                Coordonnées
              </div>
              {teacher.phone && <div style={{ fontSize: '12px', marginBottom: '5px' }}>📞 {teacher.phone}</div>}
              {teacher.department && <div style={{ fontSize: '12px', marginBottom: '5px' }}>🏛 {teacher.department}</div>}
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Inscrit le {teacher.createdAt || '—'}</div>
            </div>

            {/* Biographie */}
            {teacher.bio && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={11}/> Présentation
                </div>
                <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{teacher.bio}</p>
              </div>
            )}

            {/* CV */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={11}/> Justificatifs
              </div>
              {teacher.cv ? (
                <a href={teacher.cv} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1e3a8a', fontWeight: 600, textDecoration: 'none', padding: '6px 10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                  <FileText size={13}/> Consulter le CV <ExternalLink size={11}/>
                </a>
              ) : (
                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Aucun CV téléversé</span>
              )}
            </div>

            {/* Niveaux */}
            {niveauxChoisis.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={11}/> Niveaux souhaités
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {niveauxChoisis.map(n => (
                    <NiveauChip key={n} niveau={n} isMatch={myNiveaux.includes(n)}/>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Les niveaux en bleu correspondent à vos filières
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ProfileValidation() {
  const { user }  = useAuth();
  const { toast } = useNotification();
  const [teachers, setTeachers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterSt, setFilterSt]   = useState('all');

  // RESP_FIL sees teachers who chose at least one of their managed niveaux
  const myNiveaux = user?.managedNiveaux || (user?.filiereNiveau ? [user.filiereNiveau] : []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch teachers for each of RESP_FIL's niveaux and merge (dedup by id)
      if (myNiveaux.length > 0) {
        const fetches = await Promise.all(
          myNiveaux.map(n => UserService.getTeachers({ niveau: n, page_size: 200 }))
        );
        const byId = new Map();
        fetches.flat().forEach(t => byId.set(t.id, t));
        setTeachers([...byId.values()]);
      } else {
        // fallback — show all if no filière assigned
        setTeachers(await UserService.getTeachers({ page_size: 200 }));
      }
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [myNiveaux.join(',')]);

  useEffect(() => { load(); }, [load]);

  async function handleValidate(id) {
    try {
      await UserService.validateProfile(id, 'VALIDE');
      toast.success('Profil validé', 'L\'enseignant est disponible pour la planification.');
      load();
    } catch (e) { toast.error('Erreur', e.message); }
  }

  async function handleReject(id, motif) {
    try {
      await UserService.validateProfile(id, 'REJETE');
      toast.warning('Profil rejeté', motif);
      load();
    } catch (e) { toast.error('Erreur', e.message); }
  }

  const list = teachers.filter(t => {
    const q = search.trim().toLowerCase();
    if (q && !`${t.firstName} ${t.lastName} ${t.email} ${t.specialite}`.toLowerCase().includes(q)) return false;
    if (filterSt === 'pending') return !t.profileStatus || ['COMPLET', 'INCOMPLET'].includes(t.profileStatus);
    if (filterSt === 'valide')  return t.profileStatus === 'VALIDE';
    if (filterSt === 'rejete')  return t.profileStatus === 'REJETE';
    return true;
  });

  const pendingCount   = teachers.filter(t => !t.profileStatus || ['COMPLET', 'INCOMPLET'].includes(t.profileStatus)).length;
  const validatedCount = teachers.filter(t => t.profileStatus === 'VALIDE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
          Validation des profils enseignants
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
          Enseignants ayant sélectionné vos niveaux ({myNiveaux.join(', ') || 'aucun niveau assigné'}).
          Seuls les profils <strong>Validés</strong> apparaissent dans les formulaires de séances.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'En attente', value: pendingCount,   bg: '#fff7ed', c: '#c2410c' },
          { label: 'Validés',    value: validatedCount,  bg: '#f0fdf4', c: '#15803d' },
          { label: 'Total',      value: teachers.length, bg: '#f8fafc', c: '#475569' },
        ].map(({ label, value, bg, c }) => (
          <div key={label} style={{ background: bg, borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: c, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: c }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, spécialité…"
            style={{ ...S.inp, paddingLeft: '32px', width: '100%', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {[{ v: 'all', l: 'Tous' }, { v: 'pending', l: 'En attente' }, { v: 'valide', l: 'Validés' }, { v: 'rejete', l: 'Rejetés' }].map(({ v, l }) => (
            <button key={v} onClick={() => setFilterSt(v)}
              style={{
                padding: '7px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600,
                background: filterSt === v ? '#1e3a8a' : '#fff',
                color:      filterSt === v ? '#fff'    : '#64748b',
              }}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={load} style={S.btn('#f8fafc', '#64748b')}><RefreshCw size={13}/></button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom: '12px' }}/>
          <div>Chargement…</div>
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          <User size={40} style={{ marginBottom: '12px', opacity: 0.3 }}/>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>
            {myNiveaux.length === 0
              ? 'Aucune filière assignée à votre compte'
              : 'Aucun enseignant n\'a sélectionné vos niveaux'}
          </div>
        </div>
      ) : (
        list.map(t => (
          <TeacherCard key={t.id} teacher={t} myNiveaux={myNiveaux}
            onValidate={handleValidate} onReject={handleReject}/>
        ))
      )}
    </div>
  );
}
