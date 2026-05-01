// ============================================================
// SPET — Réinitialisation du mot de passe
// ============================================================

import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, CheckCircle, AlertCircle, ArrowLeft, GraduationCap } from 'lucide-react';
import AuthService from '@/services/auth.service';

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: '8 caractères minimum', ok: password.length >= 8 },
    { label: 'Une majuscule',         ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre',            ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#ef4444', '#f59e0b', '#22c55e'];
  const labels = ['Faible', 'Moyen', 'Fort'];

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            background: i < score ? colors[score - 1] : '#e2e8f0',
            transition: 'background 0.2s ease',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize: '11px', color: c.ok ? '#16a34a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span>{c.ok ? '✓' : '○'}</span> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams]         = useSearchParams();
  const navigate               = useNavigate();

  const uid   = searchParams.get('uid')   || '';
  const token = searchParams.get('token') || '';

  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  const isInvalidLink = !uid || !token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !password2) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(uid, token, password, password2);
      setDone(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Left panel ── */}
      <div style={{
        flex: '0 0 42%',
        background: 'linear-gradient(160deg, #1e3a8a 0%, #1a56db 60%, #1d4ed8 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', position: 'relative', overflow: 'hidden',
      }}
        className="login-left-panel"
      >
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-120px', left: '-60px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: '320px' }}>
          <div style={{
            width: '100px', height: '100px', background: 'white', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>
            <img src="/logo-ufr.jfif" alt="UFR Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1e3a8a;border-radius:50%"><span style="color:white;font-size:28px;font-weight:700">UFR</span></div>`;
              }}
            />
          </div>
          <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>SPET</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '28px' }}>
            Système de Planification des Emplois du Temps
          </p>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <GraduationCap size={18} color="rgba(255,255,255,0.7)" />
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500 }}>Université Iba Der Thiam de Thiès</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6 }}>
              Plateforme institutionnelle de gestion et de planification académique.
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1, background: '#ffffff',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#64748b', fontSize: '14px', textDecoration: 'none', marginBottom: '32px',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a56db'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <ArrowLeft size={16} /> Retour à la connexion
          </Link>

          {/* ── Invalid link ── */}
          {isInvalidLink && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <AlertCircle size={36} color="#dc2626" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Lien invalide</h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '28px' }}>
                Ce lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande.
              </p>
              <Link to="/forgot-password" style={{
                display: 'inline-block', padding: '11px 28px',
                background: '#1a56db', color: 'white',
                borderRadius: '10px', textDecoration: 'none',
                fontSize: '14px', fontWeight: 600,
              }}>
                Nouvelle demande
              </Link>
            </div>
          )}

          {/* ── Success ── */}
          {!isInvalidLink && done && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={36} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                Mot de passe modifié !
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '28px' }}>
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <Link to="/login" style={{
                display: 'inline-block', padding: '11px 28px',
                background: '#1a56db', color: 'white',
                borderRadius: '10px', textDecoration: 'none',
                fontSize: '14px', fontWeight: 600,
              }}>
                Se connecter
              </Link>
            </div>
          )}

          {/* ── Form ── */}
          {!isInvalidLink && !done && (
            <>
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: '#eff6ff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: '16px',
                }}>
                  <KeyRound size={24} color="#1a56db" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Nouveau mot de passe
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                  Choisissez un mot de passe sécurisé pour votre compte.
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* Nouveau mot de passe */}
                <div className="form-group">
                  <label className="form-label required">Nouveau mot de passe</label>
                  <div className="input-wrapper input-icon-right">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={`form-input ${error ? 'error' : ''}`}
                      placeholder="Minimum 8 caractères"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <span
                      className="input-icon"
                      onClick={() => setShowPass(s => !s)}
                      style={{ cursor: 'pointer', right: '12px', top: '50%', transform: 'translateY(-50%)', position: 'absolute' }}
                    >
                      {showPass ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </span>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                {/* Confirmer */}
                <div className="form-group">
                  <label className="form-label required">Confirmer le mot de passe</label>
                  <div className="input-wrapper input-icon-right">
                    <input
                      type={showPass2 ? 'text' : 'password'}
                      className={`form-input ${password2 && password !== password2 ? 'error' : ''}`}
                      placeholder="Répétez le mot de passe"
                      value={password2}
                      onChange={e => { setPassword2(e.target.value); setError(''); }}
                      autoComplete="new-password"
                    />
                    <span
                      className="input-icon"
                      onClick={() => setShowPass2(s => !s)}
                      style={{ cursor: 'pointer', right: '12px', top: '50%', transform: 'translateY(-50%)', position: 'absolute' }}
                    >
                      {showPass2 ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                    </span>
                  </div>
                  {password2 && password !== password2 && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      Les mots de passe ne correspondent pas.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading ? '#93c5fd' : '#1a56db',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontSize: '15px', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    marginTop: '8px', transition: 'background 0.2s ease', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1d4ed8'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1a56db'; }}
                >
                  {loading ? (
                    <div style={{
                      width: '18px', height: '18px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  ) : (
                    <KeyRound size={18} />
                  )}
                  {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              </form>
            </>
          )}

          <div style={{
            marginTop: '48px', paddingTop: '20px',
            borderTop: '1px solid #e2e8f0', textAlign: 'center',
            fontSize: '11px', color: '#94a3b8',
          }}>
            SPET © 2025-2026 · UFR Sciences et Technologies<br />
            Université Iba Der Thiam de Thiès
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .login-left-panel { display: none !important; } }
      `}</style>
    </div>
  );
}
