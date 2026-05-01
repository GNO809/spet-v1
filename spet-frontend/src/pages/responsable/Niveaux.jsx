// ============================================================
// SPET — Responsable: Mes niveaux
// Affiche UNIQUEMENT les niveaux de la filière du responsable connecté
// ============================================================

import { Link } from 'react-router-dom';
import { GraduationCap, Calendar, ChevronRight, BookOpen, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getNiveauxUtilisateur, MAQUETTE, getGroupeLabel } from '@/utils/constants';

function NiveauStatusBadge({ status }) {
  const cfg = {
    valide:    { bg: '#dcfce7', color: '#16a34a', label: 'Validé' },
    publie:    { bg: '#dbeafe', color: '#1e3a8a', label: 'Publié' },
    conflit:   { bg: '#fef3c7', color: '#d97706', label: 'Conflit' },
    brouillon: { bg: '#f1f5f9', color: '#64748b', label: 'Brouillon' },
  };
  const c = cfg[status] || cfg.brouillon;
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

// Couleur thème par groupe
function groupeTheme(groupe) {
  if (groupe === 'L3') return { bg: '#fdf4ff', color: '#7c3aed', border: '#d8b4fe', gradient: 'linear-gradient(135deg,#6d28d9,#8b5cf6)' };
  if (groupe === 'L2') return { bg: '#f0fdf4', color: '#15803d', border: '#86efac', gradient: 'linear-gradient(135deg,#059669,#10b981)' };
  return                     { bg: '#eff6ff', color: '#1e3a8a', border: '#93c5fd', gradient: 'linear-gradient(135deg,#1e3a8a,#1a56db)' };
}

export default function ResponsableNiveaux() {
  const { user }   = useAuth();
  const mesNiveaux = getNiveauxUtilisateur(user);

  const groupeLabel = getGroupeLabel(user);
  const raw     = (user?.filiereNiveau || user?.filiere || '');
  const rawUp   = raw.toUpperCase();
  const groupe  = ['L3-GL', 'L3-RT', 'L3', 'L2', 'L1'].find(k => rawUp.includes(k.toUpperCase())) || '';
  const theme   = groupeTheme(groupe.startsWith('L3') ? 'L3' : groupe);

  const totalMatières = mesNiveaux.reduce((s, n) => {
    const mKey = n.key.replace(/-/g, '_');
    return s + (MAQUETTE[mKey]?.length ?? 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Mes niveaux</h2>
          <p className="text-subtitle">
            {groupeLabel} — {mesNiveaux.length} semestre{mesNiveaux.length > 1 ? 's' : ''} · {totalMatières} matières
          </p>
        </div>
        <Link to="/responsable/generate">
          <button className="btn btn-primary">
            <Calendar size={15} /> Programmer une séance
          </button>
        </Link>
      </div>

      {/* Bannière groupe */}
      <div style={{ padding: '14px 20px', borderRadius: '12px', background: theme.bg, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: theme.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px', color: theme.color }}>{groupeLabel}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            {mesNiveaux.length} niveaux · {totalMatières} UE dans la maquette · Responsable : {user?.firstName} {user?.lastName}
          </div>
        </div>
      </div>

      {/* Grille des niveaux */}
      <div className="grid-2">
        {mesNiveaux.map(n => {
          const mKey    = n.key.replace(/-/g, '_');
          const courses = MAQUETTE[mKey] || [];
          const volCM   = courses.reduce((s, c) => s + (c.volume_cm || 0), 0);
          const volTD   = courses.reduce((s, c) => s + (c.volume_td || 0), 0);
          const volTotal = volCM + volTD;

          return (
            <div key={n.key} className="card">
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: theme.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <GraduationCap size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{n.label}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {n.option === 'TC' ? 'Tronc commun' : n.option === 'GL' ? 'Génie Logiciel' : 'Réseaux & Télécom'}
                    </div>
                  </div>
                </div>
                <NiveauStatusBadge status="brouillon" />
              </div>

              {/* Métriques */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', padding: '10px 6px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{courses.length}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>UE</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 6px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{volCM}h</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>CM</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px 6px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>{volTD}h</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>TD/TP</div>
                </div>
              </div>

              {/* Liste des UE */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={10} /> Unités d'enseignement
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                  {courses.map(c => (
                    <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: '6px', background: '#f8fafc', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, color: theme.color, background: theme.bg, padding: '1px 5px', borderRadius: '4px' }}>
                          {c.code}
                        </span>
                        <span style={{ color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Clock size={9} /> {(c.volume_cm || 0) + (c.volume_td || 0)}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barre de progression */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Planification des séances</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b' }}>0%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <Link to="/responsable/timetables" style={{ flex: 1 }}>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    <Calendar size={12} /> Voir l'EDT
                  </button>
                </Link>
                <Link to="/responsable/generate">
                  <button className="btn btn-ghost btn-sm">
                    Programmer <ChevronRight size={12} />
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé bas de page */}
      <div style={{ padding: '14px 20px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
        <span><strong style={{ color: '#1e293b' }}>{mesNiveaux.length}</strong> semestres à gérer</span>
        <span><strong style={{ color: '#1e293b' }}>{totalMatières}</strong> matières au total</span>
        <span><strong style={{ color: '#1e293b' }}>
          {mesNiveaux.reduce((s, n) => {
            const mKey = n.key.replace(/-/g, '_');
            return s + (MAQUETTE[mKey] ?? []).reduce((v, c) => v + (c.volume_cm || 0) + (c.volume_td || 0), 0);
          }, 0)}h
        </strong> volume total</span>
      </div>
    </div>
  );
}
