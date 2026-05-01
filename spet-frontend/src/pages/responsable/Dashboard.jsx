// ============================================================
// SPET — Responsable de Filière: Dashboard (données réelles)
// ============================================================

import { useState, useEffect } from 'react';
import {
  Calendar, AlertTriangle, GraduationCap, CheckSquare,
  BookOpen, Users, Clock, CheckCircle, Globe, Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { getCurrentDateTime } from '@/utils/helpers';
import { getNiveauxUtilisateur, MAQUETTE, getGroupeLabel } from '@/utils/constants';
import UserService from '@/services/user.service';

const dt = getCurrentDateTime();

function groupeColor(filiere) {
  const s = (filiere || '').toUpperCase();
  if (s.includes('L3')) return { bg: '#fdf4ff', color: '#7c3aed', border: '#d8b4fe' };
  if (s.includes('L2')) return { bg: '#f0fdf4', color: '#15803d', border: '#86efac' };
  return                       { bg: '#eff6ff', color: '#1e3a8a', border: '#93c5fd' };
}

const EDT_STATUS = {
  BROUILLON:             { bg: '#f1f5f9', color: '#64748b', label: 'Brouillon' },
  EN_ATTENTE_VALIDATION: { bg: '#fef3c7', color: '#d97706', label: 'En attente' },
  VALIDE:                { bg: '#dcfce7', color: '#15803d', label: 'Validé' },
  PUBLIE:                { bg: '#dbeafe', color: '#1e3a8a', label: 'Publié' },
  REJETE:                { bg: '#fee2e2', color: '#dc2626', label: 'Rejeté' },
};

function EdtBadge({ status }) {
  const m = EDT_STATUS[status] || EDT_STATUS.BROUILLON;
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

export default function ResponsableDashboard() {
  const { user }  = useAuth();
  const { toast } = useNotification();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    UserService.getDashboardStats()
      .then(setStats)
      .catch(() => toast.error('Erreur', 'Impossible de charger le tableau de bord.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  const data           = stats || {};
  const publishedEdts  = data.publishedEdts  ?? 0;
  const conflicts      = data.conflicts      ?? 0;
  const totalEdts      = data.myEdts         ?? 0;
  const readyToPublish = data.readyToPublish ?? 0;
  const pendingProfiles = data.pendingProfiles ?? 0;
  const totalEnseignants = data.totalEnseignants ?? 0;
  const recentEdts     = data.recentEdts     ?? [];

  const mesNiveaux  = getNiveauxUtilisateur(user);
  const groupeLabel = getGroupeLabel(user);
  const raw         = (user?.filiereNiveau || user?.filiere || '');
  const col         = groupeColor(raw);

  const totalMatières = mesNiveaux.reduce((s, n) => {
    const mKey = n.key.replace(/-/g, '_');
    return s + (MAQUETTE[mKey]?.length ?? 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Bannière EDT prêts à publier */}
      {readyToPublish > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #10b981', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckSquare size={20} color="#10b981" />
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#15803d' }}>
              {readyToPublish} emploi{readyToPublish > 1 ? 's' : ''} du temps prêt{readyToPublish > 1 ? 's' : ''} à publier
            </span>
          </div>
          <Link to="/responsable/edts">
            <button className="btn btn-success btn-sm">Publier maintenant</button>
          </Link>
        </div>
      )}

      {/* Bannière profils en attente */}
      {pendingProfiles > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="#f59e0b" />
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#92400e' }}>
              {pendingProfiles} profil{pendingProfiles > 1 ? 's' : ''} enseignant{pendingProfiles > 1 ? 's' : ''} en attente de validation
            </span>
          </div>
          <Link to="/responsable/profils">
            <button className="btn btn-warning btn-sm">Valider maintenant</button>
          </Link>
        </div>
      )}

      {/* Carte de bienvenue */}
      <div className="welcome-card" style={{ borderLeft: `4px solid ${col.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Bonjour, {user.firstName}</h2>
            <p style={{ marginTop: '4px', fontWeight: 600 }}>
              Responsable de filière ·{' '}
              <span style={{ color: col.color, background: col.bg, padding: '2px 8px', borderRadius: '20px', fontSize: '13px' }}>
                {groupeLabel}
              </span>
            </p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{dt.full}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: col.bg, color: col.color, border: `1px solid ${col.border}` }}>
              {mesNiveaux.length} niveau{mesNiveaux.length > 1 ? 'x' : ''}
            </span>
            <span className="badge badge-resp_fil" style={{ fontSize: '12px', padding: '5px 14px' }}>Chef de Filière</span>
          </div>
        </div>
      </div>

      {/* 4 métriques réelles */}
      <div className="grid-4">
        <StatCard
          label="EDT générés"
          value={totalEdts}
          sub={`${publishedEdts} publié${publishedEdts > 1 ? 's' : ''}`}
          icon={Calendar}
          iconBg="#f0fdf4" iconColor="#10b981"
        />
        <StatCard
          label="Prêts à publier"
          value={readyToPublish}
          sub={readyToPublish > 0 ? 'Validés par le chef' : 'Aucun en attente'}
          icon={Globe}
          iconBg={readyToPublish > 0 ? '#f0fdf4' : '#f1f5f9'}
          iconColor={readyToPublish > 0 ? '#10b981' : '#94a3b8'}
        />
        <StatCard
          label="Conflits"
          value={conflicts}
          sub={conflicts === 0 ? 'Aucun conflit' : 'À résoudre'}
          icon={AlertTriangle}
          iconBg={conflicts > 0 ? '#fef3c7' : '#f0fdf4'}
          iconColor={conflicts > 0 ? '#d97706' : '#10b981'}
        />
        <StatCard
          label="Enseignants"
          value={totalEnseignants}
          sub={pendingProfiles > 0 ? `${pendingProfiles} profil(s) à valider` : 'Tous validés'}
          icon={Users}
          iconBg={pendingProfiles > 0 ? '#fef3c7' : '#eff6ff'}
          iconColor={pendingProfiles > 0 ? '#d97706' : '#1e3a8a'}
        />
      </div>

      {/* EDT récents */}
      {recentEdts.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>EDT récents</h3>
            <Link to="/responsable/timetables" style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}>
              Voir tout →
            </Link>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {recentEdts.map((edt, i) => (
              <div key={edt.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: i < recentEdts.length - 1 ? '1px solid #f1f5f9' : 'none',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={14} color="#1e3a8a" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {edt.filiere} — {edt.semestre}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Qualité : {Math.round(edt.quality || 0)}%
                    </div>
                  </div>
                </div>
                <EdtBadge status={edt.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accès rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { label: 'Gérer mes emplois du temps', to: '/responsable/edts', primary: true },
          { label: 'Valider des profils enseignants', to: '/responsable/profils', primary: false },
        ].map(a => (
          <Link key={a.to} to={a.to}>
            <button className={`btn ${a.primary ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center' }}>
              {a.label}
            </button>
          </Link>
        ))}
      </div>

    </div>
  );
}
