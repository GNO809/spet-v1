// ============================================================
// SPET — Mot de passe oublié
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, GraduationCap } from 'lucide-react';
import AuthService from '@/services/auth.service';

export default function ForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }
    setLoading(true);
    try {
      await AuthService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── Left panel ── */}
      <div style={{
        flex: '0 0 42%',
        background: 'linear-gradient(160deg, #1e3a8a 0%, #1a56db 60%, #1d4ed8 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        position: 'relative',
        overflow: 'hidden',
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

          {/* Back link */}
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#64748b', fontSize: '14px', textDecoration: 'none',
            marginBottom: '32px',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a56db'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <ArrowLeft size={16} /> Retour à la connexion
          </Link>

          {!sent ? (
            <>
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: '#eff6ff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: '16px',
                }}>
                  <Mail size={24} color="#1a56db" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                  Mot de passe oublié ?
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                  Saisissez l'adresse email associée à votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <div className="form-group">
                  <label className="form-label required">Adresse email</label>
                  <input
                    type="email"
                    className={`form-input ${error ? 'error' : ''}`}
                    placeholder="votre@email.univ-thies.sn"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                    autoFocus
                  />
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
                    <Mail size={18} />
                  )}
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          ) : (
            /* ── Success state ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: '#f0fdf4', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 24px',
              }}>
                <CheckCircle size={36} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
                Email envoyé !
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '8px' }}>
                Si un compte correspond à <strong style={{ color: '#1e293b' }}>{email}</strong>, vous recevrez un email avec un lien de réinitialisation.
              </p>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '32px' }}>
                Le lien est valable <strong>1 heure</strong>. Vérifiez aussi vos spams.
              </p>
              <Link to="/login" style={{
                display: 'inline-block', padding: '11px 28px',
                background: '#1a56db', color: 'white',
                borderRadius: '10px', textDecoration: 'none',
                fontSize: '14px', fontWeight: 600,
              }}>
                Retour à la connexion
              </Link>
            </div>
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
