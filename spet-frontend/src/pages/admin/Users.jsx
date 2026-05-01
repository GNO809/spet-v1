// ============================================================
// SPET — Admin: Gestion des Utilisateurs
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  UserPlus, Edit2, Trash2, UserCheck, UserX,
  Users, Search, X, ShieldCheck, GraduationCap,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useNotification } from '@/contexts/NotificationContext';
import { ROLE_LABELS } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
import UserService from '@/services/user.service';
import AcademicsService from '@/services/academics.service';

// ── Couleurs par rôle ────────────────────────────────────────
const ROLE_COLOR = {
  ADMIN:      { bg: '#eff6ff', color: '#1a56db' },
  CHEF_DEPT:  { bg: '#f0fdf4', color: '#10b981' },
  RESP_FIL:   { bg: '#fdf4ff', color: '#8b5cf6' },
  ENSEIGNANT: { bg: '#fffbeb', color: '#d97706' },
};


// ── Avatar ───────────────────────────────────────────────────
function UserAvatar({ user }) {
  const rc = ROLE_COLOR[user.role] || ROLE_COLOR.ENSEIGNANT;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px',
        background: user.status === 'active'
          ? `linear-gradient(135deg, #1e3a8a, #1a56db)`
          : '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: user.status === 'active' ? 'white' : '#94a3b8',
        fontSize: '12px', fontWeight: 700, flexShrink: 0,
      }}>
        {getInitials(`${user.firstName} ${user.lastName}`)}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.firstName} {user.lastName}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user.email}
        </div>
      </div>
    </div>
  );
}

// ── Badges ───────────────────────────────────────────────────
function RolePill({ role }) {
  const rc = ROLE_COLOR[role] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700,
      background: rc.bg, color: rc.color,
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatusPill({ status }) {
  const active = status === 'active';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: active ? '#10b981' : '#ef4444', display: 'inline-block',
      }} />
      <span style={{ fontSize: '12px', color: active ? '#10b981' : '#ef4444', fontWeight: 600 }}>
        {active ? 'Actif' : 'Inactif'}
      </span>
    </span>
  );
}

// ── Validation ───────────────────────────────────────────────
const EMPTY = { firstName: '', lastName: '', email: '', role: 'ENSEIGNANT', departmentId: '', phone: '', grade: '', password: '' };

function validate(f, mode) {
  const e = {};
  if (!f.firstName.trim()) e.firstName = 'Requis';
  if (!f.lastName.trim())  e.lastName  = 'Requis';
  if (!f.email.trim())     e.email = 'Requis';
  else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = 'Email invalide';
  if (mode === 'create') {
    if (!f.password.trim()) e.password = 'Requis';
    else if (f.password.length < 8) e.password = 'Minimum 8 caractères';
  }
  return e;
}

// ── Page principale ───────────────────────────────────────────
export default function AdminUsers() {
  const [users,       setUsers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState({ open: false, mode: 'create', user: null });
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('all');
  const { toast, confirm } = useNotification();

  const load = () => {
    setLoading(true);
    Promise.all([
      UserService.getAll({ page_size: 200 }),
      AcademicsService.getDepartments(),
    ]).then(([u, d]) => {
      setUsers(u.results ?? u);
      setDepartments(Array.isArray(d) ? d : []);
    }).catch(() => toast.error('Erreur', 'Impossible de charger les utilisateurs.')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Filtrage
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchQ = !search
        || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q)
        || (u.department || '').toLowerCase().includes(q);
      const matchR = roleFilter === 'all' || u.role === roleFilter;
      return matchQ && matchR;
    });
  }, [users, search, roleFilter]);

  // Stats
  const stats = {
    total:      users.length,
    actifs:     users.filter(u => u.status === 'active').length,
    admins:     users.filter(u => u.role === 'ADMIN').length,
    enseignants:users.filter(u => ['ENSEIGNANT', 'RESP_FIL', 'CHEF_DEPT'].includes(u.role)).length,
  };

  // Handlers
  const openCreate = () => { setForm(EMPTY); setErrors({}); setModal({ open: true, mode: 'create', user: null }); };
  const openEdit   = u  => { setErrors({}); setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, departmentId: u.departmentId || '', phone: u.phone || '', grade: u.grade || '' }); setModal({ open: true, mode: 'edit', user: u }); };
  const closeModal = ()  => setModal(m => ({ ...m, open: false }));

  const askDelete = async (u) => {
    const ok = await confirm(`Supprimer ${u.firstName} ${u.lastName} ? Cette action est irréversible.`);
    if (!ok) return;
    try {
      await UserService.delete(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success('Supprimé', `${u.firstName} ${u.lastName} a été supprimé.`);
    } catch {
      toast.error('Erreur', 'Impossible de supprimer cet utilisateur.');
    }
  };

  const handleToggle = async u => {
    try {
      const updated = await UserService.toggleActive(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
      toast.info('Statut modifié', `${u.firstName} ${u.status === 'active' ? 'désactivé' : 'activé'}.`);
    } catch {
      toast.error('Erreur', 'Impossible de modifier le statut.');
    }
  };

  const handleSave = async () => {
    const e = validate(form, modal.mode);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSaving(true);
    try {
      const payload = {
        first_name: form.firstName, last_name: form.lastName,
        email: form.email, role: form.role, phone: form.phone,
        grade: form.grade, department: form.departmentId || null,
      };
      if (modal.mode === 'create') {
        payload.username  = form.email.split('@')[0];
        payload.password  = form.password;
        payload.password2 = form.password;
        const created = await UserService.create(payload);
        setUsers(prev => [created, ...prev]);
        toast.success('Utilisateur créé', `${form.firstName} ${form.lastName} a été ajouté.`);
      } else {
        const updated = await UserService.update(modal.user.id, payload);
        setUsers(prev => prev.map(u => u.id === modal.user.id ? updated : u));
        toast.success('Mis à jour', 'Les modifications ont été enregistrées.');
      }
      closeModal();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Erreur lors de l\'enregistrement.';
      toast.error('Erreur', msg);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loader" style={{ margin: '60px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>

      {/* ── En-tête ── */}
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Gestion des utilisateurs</h2>
          <p className="text-subtitle">{users.length} utilisateurs enregistrés</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <UserPlus size={15} /> Ajouter un utilisateur
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid-4">
        {[
          { label: 'Total',        value: stats.total,       icon: Users,       bg: '#eff6ff', color: '#1a56db' },
          { label: 'Actifs',       value: stats.actifs,      icon: UserCheck,   bg: '#f0fdf4', color: '#10b981' },
          { label: 'Administrateurs', value: stats.admins,   icon: ShieldCheck, bg: '#fdf4ff', color: '#8b5cf6' },
          { label: 'Enseignants',  value: stats.enseignants, icon: GraduationCap, bg: '#fffbeb', color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Recherche */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, département…"
            style={{
              width: '100%', padding: '8px 32px 8px 32px', fontSize: '13px',
              border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
              background: '#f8fafc', color: '#1e293b', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={13} color="#94a3b8" />
            </button>
          )}
        </div>
        {/* Rôle */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[['all', 'Tous'], ...Object.entries(ROLE_LABELS)].map(([k, l]) => (
            <button key={k} className={`chip ${roleFilter === k ? 'active' : ''}`}
              onClick={() => setRoleFilter(k)} style={{ fontSize: '11px' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tableau ── */}
      <div className="table-container">
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Département</th>
                <th>Grade</th>
                <th>Statut</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <Users size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                    {search ? 'Aucun résultat pour cette recherche' : 'Aucun utilisateur enregistré'}
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id}>
                    <td style={{ minWidth: '200px' }}><UserAvatar user={u} /></td>
                    <td><RolePill role={u.role} /></td>
                    <td style={{ fontSize: '13px', color: '#374151' }}>{u.department || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>{u.grade || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td><StatusPill status={u.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn-icon" onClick={() => openEdit(u)} title="Modifier">
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleToggle(u)}
                          title={u.status === 'active' ? 'Désactiver' : 'Activer'}
                          style={{ color: u.status === 'active' ? '#f59e0b' : '#10b981' }}
                        >
                          {u.status === 'active' ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                        <button className="btn-icon" onClick={() => askDelete(u)} title="Supprimer" style={{ color: '#ef4444' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>{filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}{search ? ` sur ${users.length}` : ''}</span>
        </div>
      </div>

      {/* ── Modal création / édition ── */}
      <Modal
        open={modal.open} onClose={closeModal}
        title={modal.mode === 'create' ? 'Ajouter un utilisateur' : 'Modifier l\'utilisateur'}
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
            <label className="form-label required">Prénom</label>
            <input className="form-input" value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              placeholder="Prénom"
              style={errors.firstName ? { borderColor: '#ef4444' } : {}} />
            {errors.firstName && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.firstName}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Nom</label>
            <input className="form-input" value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              placeholder="Nom de famille"
              style={errors.lastName ? { borderColor: '#ef4444' } : {}} />
            {errors.lastName && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.lastName}</span>}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '12px' }}>
          <label className="form-label required">Adresse e-mail</label>
          <input className="form-input" type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="prenom.nom@univ-thies.sn"
            style={errors.email ? { borderColor: '#ef4444' } : {}} />
          {errors.email && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.email}</span>}
        </div>

        <div className="grid-2" style={{ gap: '12px', marginTop: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Rôle</label>
            <select className="form-select" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Département</label>
            <select className="form-select" value={form.departmentId}
              onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
              <option value="">— Aucun —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid-2" style={{ gap: '12px', marginTop: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Téléphone</label>
            <input className="form-input" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="77 000 00 00" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Grade</label>
            <select className="form-select" value={form.grade}
              onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
              <option value="">— Choisir —</option>
              {['Professeur', 'Maître de Conférences', 'Maître-Assistant', 'Assistant', 'Vacataire', 'Doctorant'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {modal.mode === 'create' && (
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label required">Mot de passe initial</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Minimum 8 caractères"
              style={errors.password ? { borderColor: '#ef4444' } : {}}
            />
            {errors.password && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.password}</span>}
          </div>
        )}
      </Modal>

    </div>
  );
}
