// ============================================================
// SPET — Login Page — Full Immersif
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ROLES } from '@/utils/constants';

const ROLE_HOME = {
  [ROLES.ADMIN]:      '/admin',
  [ROLES.CHEF_DEPT]:  '/chef',
  [ROLES.RESP_FIL]:   '/responsable',
  [ROLES.ENSEIGNANT]: '/enseignant',
};

// Noeuds du réseau SVG [x%, y%]
const NODES = [
  [8,18],[22,8],[18,38],[35,22],[12,58],[28,68],
  [45,12],[48,35],[38,55],[55,72],[62,18],[72,8],
  [68,42],[78,58],[82,28],[88,48],[95,62],[6,82],
  [20,88],[42,92],[58,88],[75,82],[88,78],
];

// Lignes du réseau [nodeA_index, nodeB_index]
const EDGES = [
  [0,1],[1,6],[6,10],[10,11],[0,2],[2,3],[3,7],
  [7,10],[2,4],[4,5],[5,8],[8,9],[7,8],[10,12],
  [12,13],[11,14],[14,15],[15,16],[4,17],[17,18],
  [18,19],[19,20],[20,21],[21,22],[22,16],[5,9],
  [13,21],[6,3],[9,20],[12,14],[15,13],
];

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { toast } = useNotification();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Veuillez remplir tous les champs.'); return; }
    try {
      const user = await login(email.trim(), password);
      toast.success('Connexion réussie', `Bienvenue, ${user.firstName} !`);
      navigate(ROLE_HOME[user.role] || '/');
    } catch (err) {
      setError(err.message || 'Identifiants invalides.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── Fond gradient ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1553c7 100%)',
      }} />

      {/* ── Réseau SVG de noeuds ── */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="0.25" fill="none">
          {EDGES.map(([a, b], i) => (
            <line key={i}
              x1={NODES[a][0]} y1={NODES[a][1]}
              x2={NODES[b][0]} y2={NODES[b][1]}
            />
          ))}
        </g>
        <g>
          {NODES.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y}
              r={[1,6,12,17,22].includes(i) ? 0.9 : 0.45}
              fill={[1,6,12,17,22].includes(i) ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.15)'}
            />
          ))}
        </g>
      </svg>

      {/* ── Halos lumineux ── */}
      <div style={{ position: 'absolute', top: '-180px', left: '-120px', width: '640px', height: '640px', borderRadius: '50%', background: 'rgba(96,165,250,0.06)', filter: 'blur(110px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', left: '25%', width: '520px', height: '520px', borderRadius: '50%', background: 'rgba(139,92,246,0.05)', filter: 'blur(130px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '20%', right: '420px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(26,86,219,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* ── Panneau gauche : branding ── */}
      <div className="login-left-panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '52px 56px',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
      }}>

        {/* Haut — logo grand + nom université */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '110px', height: '110px',
            background: 'white',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 56px rgba(0,0,0,0.45), 0 0 0 6px rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}>
            <img
              src="/logo-ufr.jfif"
              alt="UFR"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1e3a8a;border-radius:50%"><span style="color:white;font-size:28px;font-weight:700">UFR</span></div>`;
              }}
            />
          </div>
          <div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.2px' }}>
              UFR Sciences et Technologies
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 400 }}>
              Université Iba Der Thiam de Thiès
            </div>
          </div>
        </div>

        {/* Centre — nom de l'application */}
        <div>
          <h1 style={{
            fontSize: '96px',
            fontWeight: 800,
            letterSpacing: '-5px',
            lineHeight: 1,
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 60%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            SPET
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.7,
            maxWidth: '320px',
            margin: '0 auto',
            letterSpacing: '0.1px',
          }}>
            Système de Planification des<br />
            <span style={{ color: '#93c5fd', fontWeight: 600 }}>Emplois du Temps</span> académiques
          </p>
        </div>

        {/* Bas — badge statut */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '6px 16px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.5px' }}>
            Système opérationnel · 2025–2026
          </span>
        </div>

      </div>

      {/* ── Panneau droit : formulaire ── */}
      <div className="login-right-panel" style={{
        width: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 40px 40px 0',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '24px',
          padding: '44px 40px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.35)',
        }}>

          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '6px', letterSpacing: '-0.3px' }}>
              Connexion
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Connectez-vous à votre espace SPET
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

            <div className="form-group">
              <label className="form-label required">Mot de passe</label>
              <div className="input-wrapper input-icon-right">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`form-input ${error ? 'error' : ''}`}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                />
                <span
                  className="input-icon"
                  onClick={() => setShowPass(s => !s)}
                  style={{ cursor: 'pointer', right: '12px', top: '50%', transform: 'translateY(-50%)', position: 'absolute' }}
                >
                  {showPass ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1a56db 0%, #1e3a8a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '8px',
                marginBottom: '20px',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(26,86,219,0.38)',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                letterSpacing: '0.1px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(26,86,219,0.50)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 18px rgba(26,86,219,0.38)'; }}
            >
              {loading
                ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <LogIn size={18} />
              }
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: '13px', color: '#1a56db', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <div style={{
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '11px',
            color: '#94a3b8',
            lineHeight: 1.7,
          }}>
            SPET © 2025-2026 · UFR Sciences et Technologies<br />
            Université Iba Der Thiam de Thiès
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { width: 100% !important; padding: 24px !important; }
        }
      `}</style>
    </div>
  );
}
