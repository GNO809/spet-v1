// ============================================================
// SPET — Paramètres (profil + mot de passe)
// ============================================================

import { useState } from 'react';
import { User, Lock, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ROLE_LABELS } from '@/utils/constants';
import { getInitials } from '@/utils/helpers';
import AuthService from '@/services/auth.service';
import UserService from '@/services/user.service';

// ── Bloc de section ───────────────────────────────────────────
function Block({ icon: Icon, title, color = '#1a56db', bg = '#eff6ff', children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '14px', padding: '24px',
      border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color={color} />
        </div>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function Settings() {
  const { user, updateUser } = useAuth();
  const { toast } = useNotification();

  // Profil
  const [profil, setProfil] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    email:     user?.email     || '',
  });

  // Mot de passe
  const [pwd, setPwd]           = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [savingProfil, setSavingProfil] = useState(false);
  const [savingPwd,    setSavingPwd]    = useState(false);

  const handleSaveProfil = async () => {
    if (!profil.firstName.trim() || !profil.email.trim()) {
      toast.error('Champs requis', 'Nom et email sont obligatoires.'); return;
    }
    setSavingProfil(true);
    try {
      const updated = await UserService.updateMyProfile({
        first_name: profil.firstName,
        last_name:  profil.lastName,
        email:      profil.email,
      });
      updateUser({ firstName: updated.firstName, lastName: updated.lastName, email: updated.email });
      toast.success('Profil mis à jour', 'Vos informations ont été sauvegardées.');
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || err.response?.data?.detail || 'Erreur lors de la sauvegarde.';
      toast.error('Erreur', msg);
    } finally {
      setSavingProfil(false);
    }
  };

  const handleSavePwd = async () => {
    if (!pwd.current || !pwd.new || !pwd.confirm) {
      toast.error('Champs requis', 'Remplissez tous les champs.'); return;
    }
    if (pwd.new !== pwd.confirm) {
      toast.error('Erreur', 'Les mots de passe ne correspondent pas.'); return;
    }
    if (pwd.new.length < 8) {
      toast.error('Trop court', 'Minimum 8 caractères.'); return;
    }
    setSavingPwd(true);
    try {
      await AuthService.changePassword(pwd.current, pwd.new);
      setPwd({ current: '', new: '', confirm: '' });
      toast.success('Mot de passe changé', 'Connexion mise à jour avec succès.');
    } catch (err) {
      const msg = err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Mot de passe actuel incorrect.';
      toast.error('Erreur', msg);
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = getInitials(`${profil.firstName} ${profil.lastName}`);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>

      {/* Titre */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>Paramètres</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Gérez votre compte</p>
      </div>

      {/* ── Profil ── */}
      <Block icon={User} title="Mon profil">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #1a56db, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '22px', fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
              {profil.firstName} {profil.lastName}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{profil.email}</div>
            <span style={{
              display: 'inline-block', marginTop: '6px',
              background: '#eff6ff', color: '#1a56db',
              fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px',
            }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Prénom</label>
            <input className="form-input" value={profil.firstName}
              onChange={e => setProfil(p => ({ ...p, firstName: e.target.value }))} placeholder="Prénom" />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Nom</label>
            <input className="form-input" value={profil.lastName}
              onChange={e => setProfil(p => ({ ...p, lastName: e.target.value }))} placeholder="Nom" />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>Adresse e-mail</label>
          <input className="form-input" type="email" value={profil.email}
            onChange={e => setProfil(p => ({ ...p, email: e.target.value }))} placeholder="email@universite.sn" />
        </div>

        <button className="btn btn-primary" onClick={handleSaveProfil} disabled={savingProfil} style={{ alignSelf: 'flex-end' }}>
          {savingProfil
            ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde…</>
            : <><Save size={14} /> Enregistrer</>
          }
        </button>
      </Block>

      {/* ── Mot de passe ── */}
      <Block icon={Lock} title="Mot de passe" color="#8b5cf6" bg="#fdf4ff">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { key: 'current', label: 'Actuel' },
            { key: 'new',     label: 'Nouveau' },
            { key: 'confirm', label: 'Confirmer' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  value={pwd[key]}
                  onChange={e => setPwd(p => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  style={{ paddingRight: key === 'current' ? '38px' : undefined }}
                />
                {key === 'current' && (
                  <button onClick={() => setShowPwd(v => !v)} style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0,
                  }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleSavePwd} disabled={savingPwd}
          style={{ alignSelf: 'flex-end', background: '#8b5cf6', borderColor: '#8b5cf6' }}>
          {savingPwd ? 'Changement…' : <><Lock size={14} /> Changer le mot de passe</>}
        </button>
      </Block>

    </div>
  );
}
