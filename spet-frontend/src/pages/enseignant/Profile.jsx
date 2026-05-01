// ============================================================
// SPET — Enseignant: Complétion du profil
// ============================================================

import { useState, useEffect, useRef } from 'react';
import {
  Save, User, Mail, Phone, GraduationCap, BookOpen,
  AlertCircle, CheckCircle, Upload, FileText, X, RefreshCw,
  Award, Layers,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { getInitials } from '@/utils/helpers';
import UserService from '@/services/user.service';
import AcademicsService from '@/services/academics.service';

const GRADES = [
  'Professeur', 'Maître de Conférences', 'Maître-Assistant',
  'Assistant', 'Vacataire', 'Doctorant',
];
const SPECIALITES = [
  'Informatique', 'Mathématiques', 'Physique', 'Chimie',
  'Biologie', 'Géographie', 'Sciences de l\'Ingénieur', 'Réseaux & Télécoms',
  'Systèmes Embarqués', 'Intelligence Artificielle', 'Génie Logiciel',
];

const STATUS_CONFIG = {
  INCOMPLET: { bg: '#fef3c7', c: '#92400e', label: 'Incomplet' },
  COMPLET:   { bg: '#dbeafe', c: '#1e3a8a', label: 'Complet — en attente de validation' },
  VALIDE:    { bg: '#dcfce7', c: '#15803d', label: 'Validé' },
  REJETE:    { bg: '#fee2e2', c: '#dc2626', label: 'Rejeté — à corriger' },
};

function StatusBanner({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.INCOMPLET;
  const icons = { INCOMPLET: AlertCircle, COMPLET: RefreshCw, VALIDE: CheckCircle, REJETE: X };
  const Icon = icons[status] || AlertCircle;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: cfg.bg, color: cfg.c, fontWeight: 600, fontSize: '13px' }}>
      <Icon size={16} />
      {cfg.label}
    </div>
  );
}

const ROLE_SUBTITLE = {
  ENSEIGNANT: 'Complétez votre profil pour être visible et validé par un responsable de filière',
  RESP_FIL:   'Complétez votre profil enseignant (grade, spécialité, niveaux enseignés, CV)',
  CHEF_DEPT:  'Complétez votre profil enseignant (grade, spécialité, niveaux enseignés, CV)',
};

export default function EnseignantProfile() {
  const { user, updateUser } = useAuth();
  const { toast } = useNotification();

  const [form, setForm] = useState({
    firstName:        user?.firstName        || '',
    lastName:         user?.lastName         || '',
    phone:            user?.phone            || '',
    grade:            user?.grade            || 'Assistant',
    specialite:       user?.specialite       || '',
    bio:              user?.bio              || '',
    niveauxSouhaites: user?.niveauxSouhaites || [],
  });
  const [cvFile, setCvFile]       = useState(null);
  const [cvCurrent, setCvCurrent] = useState(user?.cv || null);
  const [niveaux, setNiveaux]     = useState([]);
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    AcademicsService.getFilieres({ page_size: 100, all_niveaux: 1 })
      .then(res => {
        const list = res.results ?? res;
        const unique = [...new Set(list.map(f => f.niveau).filter(Boolean))].sort();
        setNiveaux(unique);
      })
      .catch(() => {});
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleNiveau = (n) => setForm(f => ({
    ...f,
    niveauxSouhaites: f.niveauxSouhaites.includes(n)
      ? f.niveauxSouhaites.filter(x => x !== n)
      : [...f.niveauxSouhaites, n],
  }));

  const COMPLETION_FIELDS = ['firstName', 'lastName', 'phone', 'grade', 'specialite'];
  const filled = COMPLETION_FIELDS.filter(k => form[k] && form[k].trim() !== '').length;
  const niveauxOk = form.niveauxSouhaites.length > 0;
  const completionPct = Math.round(((filled + (niveauxOk ? 1 : 0)) / (COMPLETION_FIELDS.length + 1)) * 100);

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Champs requis', 'Prénom et nom sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('first_name', form.firstName);
      fd.append('last_name',  form.lastName);
      fd.append('phone',      form.phone);
      fd.append('grade',      form.grade);
      fd.append('specialite', form.specialite);
      fd.append('bio',        form.bio);
      fd.append('niveaux_souhaites', JSON.stringify(form.niveauxSouhaites));
      if (cvFile) fd.append('cv', cvFile);

      const updated = await UserService.updateMyProfile(fd);
      updateUser(updated);
      setCvCurrent(updated.cv || cvCurrent);
      setCvFile(null);
      toast.success('Profil mis à jour', 'Vos informations ont été enregistrées.');
    } catch (e) {
      toast.error('Erreur', e.message || 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Mon profil</h2>
          <p className="text-subtitle">{ROLE_SUBTITLE[user?.role] || ROLE_SUBTITLE.ENSEIGNANT}</p>
        </div>
      </div>

      {user?.role === 'ENSEIGNANT' && <StatusBanner status={user?.profileStatus || 'INCOMPLET'} />}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Avatar + name */}
          <div className="card-flat" style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '20px',
              background: 'linear-gradient(135deg, #1e3a8a, #1a56db)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '28px', fontWeight: 700,
              margin: '0 auto 12px',
            }}>
              {getInitials(`${form.firstName} ${form.lastName}`) || <User size={28}/>}
            </div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
              {form.firstName} {form.lastName}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>{form.grade}</div>
            {form.specialite && (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{form.specialite}</div>
            )}
          </div>

          {/* Completion progress */}
          <div className="card-flat">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Complétude du profil</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: completionPct >= 80 ? '#10b981' : '#f59e0b' }}>
                {completionPct}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${completionPct}%`,
                background: completionPct >= 80 ? '#10b981' : '#f59e0b',
                transition: 'width 0.3s ease',
              }}/>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { label: 'Prénom & Nom',    ok: !!(form.firstName && form.lastName) },
                { label: 'Téléphone',       ok: !!form.phone },
                { label: 'Grade',           ok: !!form.grade },
                { label: 'Spécialité',      ok: !!form.specialite },
                { label: 'Niveaux choisis', ok: niveauxOk },
              ].map(({ label, ok }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: ok ? '#15803d' : '#94a3b8' }}>
                  {ok ? <CheckCircle size={11}/> : <AlertCircle size={11}/>}
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Quick info */}
          <div className="card-flat">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: Mail,  val: user?.email },
                { icon: Phone, val: form.phone || '—' },
                { icon: GraduationCap, val: form.specialite || '—' },
              ].map(({ icon: Icon, val }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={13} color="#94a3b8" style={{ flexShrink: 0 }}/>
                  <span style={{ fontSize: '12px', color: val === '—' ? '#cbd5e1' : '#475569' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Personal info */}
          <div className="card-flat">
            <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <User size={15} color="#1e3a8a"/> Informations personnelles
            </h3>
            <div className="grid-2" style={{ gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label required">Prénom</label>
                <input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Prénom"/>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label required">Nom</label>
                <input className="form-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Nom de famille"/>
              </div>
            </div>
            <div className="grid-2" style={{ gap: '12px', marginTop: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Téléphone</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="77 000 00 00"/>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input className="form-input" value={user?.email || ''} disabled style={{ background: '#f8fafc', color: '#94a3b8' }}/>
              </div>
            </div>
          </div>

          {/* Academic info */}
          <div className="card-flat">
            <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Award size={15} color="#1e3a8a"/> Informations académiques
            </h3>
            <div className="grid-2" style={{ gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label required">Grade académique</label>
                <select className="form-select" value={form.grade} onChange={e => set('grade', e.target.value)}>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label required">Spécialité</label>
                <select className="form-select" value={form.specialite} onChange={e => set('specialite', e.target.value)}>
                  <option value="">-- Choisir une spécialité --</option>
                  {SPECIALITES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
              <label className="form-label">Biographie / Présentation</label>
              <textarea
                className="form-textarea"
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                placeholder="Décrivez votre parcours, vos expertises, vos travaux de recherche…"
                rows={4}
              />
            </div>
          </div>

          {/* Niveaux souhaités */}
          <div className="card-flat">
            <h3 className="card-title" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Layers size={15} color="#1e3a8a"/> Niveaux d'enseignement souhaités
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Sélectionnez les niveaux où vous souhaitez enseigner. Le responsable de filière correspondant validera votre profil.
            </p>
            {niveaux.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Chargement des niveaux…</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {niveaux.map(n => {
                  const selected = form.niveauxSouhaites.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleNiveau(n)}
                      style={{
                        padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                        border: selected ? '2px solid #1e3a8a' : '2px solid #e2e8f0',
                        background: selected ? '#eff6ff' : '#f8fafc',
                        color: selected ? '#1e3a8a' : '#64748b',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      {selected && <CheckCircle size={12}/>}
                      {n}
                    </button>
                  );
                })}
              </div>
            )}
            {form.niveauxSouhaites.length > 0 && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={11}/>
                {form.niveauxSouhaites.length} niveau{form.niveauxSouhaites.length > 1 ? 'x' : ''} sélectionné{form.niveauxSouhaites.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* CV upload */}
          <div className="card-flat">
            <h3 className="card-title" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <FileText size={15} color="#1e3a8a"/> CV & Justificatifs
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Téléversez votre CV ou tout document justifiant votre qualification (PDF recommandé, max 5 Mo).
            </p>

            {/* Current CV */}
            {cvCurrent && !cvFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '12px' }}>
                <FileText size={16} color="#15803d"/>
                <span style={{ fontSize: '12px', color: '#15803d', flex: 1, fontWeight: 600 }}>CV actuel téléversé</span>
                <a href={cvCurrent} target="_blank" rel="noreferrer"
                  style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}>
                  Consulter
                </a>
              </div>
            )}

            {/* New file selected */}
            {cvFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '12px' }}>
                <FileText size={16} color="#1e3a8a"/>
                <span style={{ fontSize: '12px', color: '#1e3a8a', flex: 1, fontWeight: 600 }}>{cvFile.name}</span>
                <button onClick={() => setCvFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                  <X size={14}/>
                </button>
              </div>
            )}

            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
              onChange={e => { if (e.target.files[0]) setCvFile(e.target.files[0]); }}/>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px',
                borderRadius: '8px', border: '2px dashed #cbd5e1', background: '#f8fafc',
                color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease', fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#1e3a8a'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <Upload size={14}/> Choisir un fichier
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: '180px' }}>
              {saving ? <><RefreshCw size={13} className="spin"/> Enregistrement…</> : <><Save size={13}/> Enregistrer les modifications</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
