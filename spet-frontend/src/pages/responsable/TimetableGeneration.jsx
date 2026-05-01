// ============================================================
// SPET — Programmer les séances
// Onglets : Saisie manuelle | Génération automatique
// Semestres corrects selon la maquette (S1…S6)
// Modules depuis la maquette pédagogique
// Modification de séances existantes
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, Calendar, Plus, Trash2, CheckCircle,
  AlertTriangle, RefreshCw, Zap, Send, Edit3, X,
  PenLine, Layers,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DAYS, TIME_SLOTS, SESSION_TYPE_COLORS,
  MAQUETTE, NIVEAUX, NIVEAU_SEMESTRE_MAP,
  getNiveauxUtilisateur,
} from '@/utils/constants';
import api from '@/services/api';
import RoomService from '@/services/room.service';
import UserService from '@/services/user.service';
import AcademicsService from '@/services/academics.service';
import TimetableService from '@/services/timetable.service';
import { TimetableGrid } from '@/components/timetable/TimetableView';

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '9px 11px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b',
  background: 'white', fontFamily: 'inherit', boxSizing: 'border-box',
};
const inpErr = { ...inp, border: '1px solid #f87171' };
const lbl = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px',
};
const card = {
  background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px',
};
const btn = (bg = '#1e3a8a', c = 'white', extra = {}) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px',
  borderRadius: '8px', border: 'none', background: bg, color: c,
  fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  ...extra,
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Retourne les semestres réels du responsable (ex: ['S3','S4'] pour L2) */
function getSemestresUser(user) {
  const niveaux = getNiveauxUtilisateur(user);
  const seen = new Set();
  return niveaux.filter(n => { if (seen.has(n.semestre)) return false; seen.add(n.semestre); return true; });
}

/** Modules de la maquette pour un niveau donné (ex: 'L2-S3') */
function getModulesMaquette(niveauKey) {
  if (!niveauKey) return [];
  const mKey = NIVEAU_SEMESTRE_MAP[niveauKey] || niveauKey.replace(/-/g, '_');
  return MAQUETTE[mKey] || [];
}

/** Fusionne modules maquette + cours API pour un niveau */
function getCoursForNiveau(niveauKey, apiCours) {
  const maquette = getModulesMaquette(niveauKey);
  if (maquette.length === 0) return apiCours;
  return maquette.map(m => {
    const apiMatch = apiCours.find(c => c.code === m.code || c.name === m.name);
    return apiMatch
      ? { ...apiMatch, _fromMaquette: true }
      : { id: `maq_${m.code}`, code: m.code, name: m.name,
          volume_cm: m.volume_cm, volume_td: m.volume_td, volume_tp: m.volume_tp || 0,
          teacher: null, teachers: [], _fromMaquette: true, _apiMissing: true };
  });
}

// ─────────────────────────────────────────────────────────────
// Grille disponibilités enseignant
// ─────────────────────────────────────────────────────────────
function AvailGrid({ avail, selDay, selStart, selEnd }) {
  const days = DAYS.slice(0, 6);
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: '2px', width: '100%', minWidth: 260 }}>
          <thead>
            <tr>
              <th style={{ width: 42, fontSize: 9, color: '#94a3b8', textAlign: 'left', padding: '2px 3px' }} />
              {days.map(d => (
                <th key={d} style={{ fontSize: 9, color: d === selDay ? '#1e3a8a' : '#64748b', fontWeight: d === selDay ? 700 : 600, textAlign: 'center', padding: 2 }}>
                  {d.slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot.start}>
                <td style={{ fontSize: 8, color: '#94a3b8', padding: '2px 3px', whiteSpace: 'nowrap' }}>{slot.start}</td>
                {days.map(day => {
                  const dispo = avail.some(a =>
                    a.day === day &&
                    a.start_time.slice(0, 5) <= slot.start &&
                    a.end_time.slice(0, 5)   >= slot.end
                  );
                  const isSel = day === selDay && slot.start === selStart;
                  const bg     = isSel ? (dispo ? '#1a56db' : '#ef4444') : dispo ? '#dcfce7' : '#f1f5f9';
                  const border = isSel ? '2px solid #1e3a8a' : dispo ? '1px solid #10b981' : '1px solid #e2e8f0';
                  return (
                    <td key={day} style={{ padding: 2, textAlign: 'center' }}>
                      <div style={{ width: '100%', height: 16, borderRadius: 3, background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSel && <span style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>{dispo ? '✓' : '✗'}</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 10, color: '#64748b' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#dcfce7', border: '1px solid #10b981', borderRadius: 2, marginRight: 3, verticalAlign: 'middle' }} />Disponible</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 2, marginRight: 3, verticalAlign: 'middle' }} />Indisponible</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Panneau salles
// ─────────────────────────────────────────────────────────────
function SallesPanel({ salles, occupees, selDay, selSlot }) {
  const libres = salles.filter(r => r.status === 'available' && !occupees.has(String(r.id)));
  const prises = salles.filter(r => r.status === 'available' &&  occupees.has(String(r.id)));
  const TYPE_COLOR = {
    AMPHI:   { bg: '#eff6ff', text: '#1e3a8a', border: '#1a56db' },
    TD:      { bg: '#f0fdf4', text: '#15803d', border: '#10b981' },
    TP:      { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' },
    REUNION: { bg: '#fdf4ff', text: '#5b21b6', border: '#8b5cf6' },
  };
  if (!salles.length) return <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Aucune salle enregistrée.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {selDay && selSlot && (
        <div style={{ fontSize: 10, color: '#64748b', background: '#f8fafc', padding: '4px 8px', borderRadius: 6, marginBottom: 4, fontWeight: 600 }}>{selDay} · {selSlot}</div>
      )}
      {libres.length === 0 && prises.length > 0 && (
        <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', padding: '8px 0' }}>Toutes les salles sont occupées.</p>
      )}
      {libres.map(r => {
        const c = TYPE_COLOR[r.room_type] || TYPE_COLOR.TD;
        return (
          <div key={r.id} style={{ padding: '8px 10px', borderRadius: 9, background: c.bg, border: `1px solid ${c.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: c.text }}>{r.name}</span>
              <span style={{ fontSize: 10, background: c.border, color: 'white', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>{r.room_type}</span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>👥 {r.capacity} places{r.building ? ` · ${r.building}` : ''}</div>
          </div>
        );
      })}
      {prises.map(r => (
        <div key={r.id} style={{ padding: '7px 9px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', opacity: 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 12, color: '#94a3b8' }}>{r.name}</span>
            <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Occupée</span>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>👥 {r.capacity} places</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Liste des séances (avec boutons Edit + Delete)
// ─────────────────────────────────────────────────────────────
function SeancesList({ sessions, onDelete, onEdit, canEdit }) {
  if (!sessions.length) return (
    <div style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
      <Calendar size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
      <p style={{ fontSize: 13 }}>Aucune séance programmée.</p>
      <p style={{ fontSize: 11, marginTop: 4 }}>Utilisez le formulaire pour en ajouter.</p>
    </div>
  );

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = sessions.filter(s => s.day === d).sort((a, b) => a.start.localeCompare(b.start));
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {DAYS.filter(d => byDay[d].length > 0).map(day => (
        <div key={day}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid #e2e8f0', paddingBottom: 3, marginBottom: 5 }}>{day}</div>
          {byDay[day].map(s => {
            const c = SESSION_TYPE_COLORS[s.type] || SESSION_TYPE_COLORS.CM;
            return (
              <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 9, background: c.bg, border: `1px solid ${c.border}`, marginBottom: 3 }}>
                <div style={{ textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{s.start}</div>
                  <div style={{ fontSize: 9, color: c.text, opacity: 0.7 }}>{s.end}</div>
                </div>
                <span style={{ padding: '1px 6px', borderRadius: 20, background: c.border, color: 'white', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{s.type}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.course}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                    {s.teacher && `👤 ${s.teacher}`}{s.room && ` · 🏫 ${s.room}`}
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    <button onClick={() => onEdit(s)} title="Modifier"
                      style={{ padding: 4, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, cursor: 'pointer', color: '#1e3a8a', display: 'flex' }}>
                      <Edit3 size={11} />
                    </button>
                    <button onClick={() => onDelete(s)} title="Supprimer"
                      style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.6, borderRadius: 4, display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Badge statut EDT
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const MAP = {
    BROUILLON:             { bg: '#f1f5f9', color: '#64748b' },
    REJETE:                { bg: '#fee2e2', color: '#dc2626' },
    EN_ATTENTE_VALIDATION: { bg: '#fef3c7', color: '#d97706' },
    VALIDE:                { bg: '#dcfce7', color: '#15803d' },
    PUBLIE:                { bg: '#dbeafe', color: '#1e3a8a' },
  };
  const m = MAP[status] || MAP.BROUILLON;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: m.bg, color: m.color }}>{status}</span>;
}

// ─────────────────────────────────────────────────────────────
// FORMULAIRE SÉANCE (partagé Manuel + Edit)
// ─────────────────────────────────────────────────────────────
function SeanceForm({
  form, setField, erreurs,
  cours, profs, profsCours, groupes, salles,
  sallesLibres, sallesOccupees,
  conflitProf, profDispo,
  dispoProf, loadingDispo,
  canEdit, onChangeCours, onChangeProf, onChangeJour, onChangeSlot,
  onSubmit, submitting, submitLabel,
  slotDebut, slotFin,
  mesNiveaux,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

      {/* Niveau */}
      <div style={{ gridColumn: '1/-1' }}>
        <label style={lbl}>Classe / Niveau <span style={{ color: '#ef4444' }}>*</span></label>
        <select
          style={erreurs.niveauKey ? inpErr : inp}
          value={form.niveauKey} disabled={!canEdit}
          onChange={e => { setField('niveauKey', e.target.value); onChangeCours(''); }}
        >
          <option value="">— Choisir une classe —</option>
          {mesNiveaux.map(n => <option key={n.key} value={n.key}>{n.label}</option>)}
        </select>
        {erreurs.niveauKey && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{erreurs.niveauKey}</p>}
      </div>

      {/* Matière */}
      <div style={{ gridColumn: '1/-1' }}>
        <label style={lbl}>Matière / Module <span style={{ color: '#ef4444' }}>*</span></label>
        <select
          style={erreurs.coursId ? inpErr : inp}
          value={form.coursId} disabled={!canEdit || !form.niveauKey}
          onChange={e => onChangeCours(e.target.value)}
        >
          <option value="">— Choisir une matière —</option>
          {getCoursForNiveau(form.niveauKey, cours).map(c => (
            <option key={c.id} value={c.id} disabled={c._apiMissing}>
              {c.code ? `[${c.code}] ` : ''}{c.name}
              {` — ${[c.volume_cm > 0 && `CM:${c.volume_cm}h`, c.volume_td > 0 && `TD:${c.volume_td}h`, c.volume_tp > 0 && `TP:${c.volume_tp}h`].filter(Boolean).join(' · ')}`}
              {c._apiMissing ? ' (non configurée)' : ''}
            </option>
          ))}
          {!form.niveauKey && <option disabled value="">Sélectionnez d'abord un niveau</option>}
        </select>
        {erreurs.coursId && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{erreurs.coursId}</p>}
      </div>

      {/* Type séance */}
      <div style={{ gridColumn: '1/-1' }}>
        <label style={lbl}>Type de séance <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ display: 'flex', gap: 6 }}>
          {['CM', 'TD', 'TP'].map(t => {
            const c = SESSION_TYPE_COLORS[t];
            const active = form.type === t;
            return (
              <button key={t} disabled={!canEdit} onClick={() => setField('type', t)}
                style={{ flex: 1, padding: '9px 6px', borderRadius: 9, border: active ? `2px solid ${c.border}` : '1px solid #e2e8f0', background: active ? c.bg : 'white', color: active ? c.text : '#64748b', fontWeight: active ? 700 : 500, fontSize: 12, cursor: canEdit ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t}</div>
                <div style={{ fontSize: 9, marginTop: 2 }}>{t === 'CM' ? 'Magistral' : t === 'TD' ? 'Dirigés' : 'Pratiques'}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Enseignant */}
      <div>
        <label style={lbl}>
          Enseignant
          {profsCours.length > 0 && <span style={{ fontWeight: 400, textTransform: 'none', color: '#1a56db', marginLeft: 6, fontSize: 10 }}>{profsCours.length} affecté(s)</span>}
        </label>
        <select style={inp} value={form.profId} disabled={!canEdit || !form.coursId} onChange={e => onChangeProf(e.target.value)}>
          <option value="">— Aucun —</option>
          {(profsCours.length > 0 ? profsCours : profs).map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}{p.grade ? ` (${p.grade})` : ''}</option>
          ))}
        </select>
        {conflitProf && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 3, display: 'flex', gap: 4 }}><AlertTriangle size={10} style={{ flexShrink: 0, marginTop: 1 }} />Déjà occupé : {conflitProf.course} {conflitProf.start}–{conflitProf.end}</div>}
        {!conflitProf && profDispo === false && <div style={{ fontSize: 10, color: '#d97706', marginTop: 3, display: 'flex', gap: 4 }}><AlertTriangle size={10} style={{ flexShrink: 0 }} />Hors disponibilités</div>}
        {!conflitProf && profDispo === true  && <div style={{ fontSize: 10, color: '#15803d', marginTop: 3, display: 'flex', gap: 4 }}><CheckCircle size={10} style={{ flexShrink: 0 }} />Disponible</div>}
      </div>

      {/* Groupe */}
      <div>
        <label style={lbl}>Groupe</label>
        <select style={inp} value={form.groupeId} disabled={!canEdit} onChange={e => setField('groupeId', e.target.value)}>
          <option value="">— Aucun —</option>
          {groupes.map(g => <option key={g.id} value={g.id}>{g.label || g.name}</option>)}
        </select>
      </div>

      {/* Jour */}
      <div>
        <label style={lbl}>Jour <span style={{ color: '#ef4444' }}>*</span></label>
        <select style={erreurs.jour ? inpErr : inp} value={form.jour} disabled={!canEdit} onChange={e => { onChangeJour(e.target.value); }}>
          <option value="">— Choisir —</option>
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {erreurs.jour && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{erreurs.jour}</p>}
      </div>

      {/* Créneau */}
      <div>
        <label style={lbl}>Créneau <span style={{ color: '#ef4444' }}>*</span></label>
        <select style={erreurs.slot ? inpErr : inp} value={form.slot} disabled={!canEdit} onChange={e => { onChangeSlot(e.target.value); }}>
          <option value="">— Choisir —</option>
          {TIME_SLOTS.map(s => <option key={s.start} value={`${s.start}|${s.end}`}>{s.label}</option>)}
        </select>
        {erreurs.slot && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{erreurs.slot}</p>}
      </div>

      {/* Salle */}
      <div style={{ gridColumn: '1/-1' }}>
        <label style={lbl}>
          Salle
          {form.jour && slotDebut && (
            <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 8, fontSize: 10, color: sallesLibres.length > 0 ? '#15803d' : '#ef4444' }}>
              {sallesLibres.length > 0 ? `${sallesLibres.length} disponible(s)` : 'Aucune disponible !'}
            </span>
          )}
        </label>
        <select style={inp} value={form.salleId} disabled={!canEdit} onChange={e => setField('salleId', e.target.value)}>
          <option value="">— Aucune —</option>
          {sallesLibres.length > 0 && (
            <optgroup label="✓ Disponibles">
              {sallesLibres.map(r => <option key={r.id} value={r.id}>{r.name} — {r.room_type} — {r.capacity} places</option>)}
            </optgroup>
          )}
          {(!form.jour || !slotDebut) && salles.filter(r => r.status === 'available').map(r => (
            <option key={r.id} value={r.id}>{r.name} — {r.room_type} — {r.capacity} places</option>
          ))}
          {form.jour && slotDebut && salles.filter(r => r.status === 'available' && sallesOccupees.has(String(r.id))).length > 0 && (
            <optgroup label="✗ Occupées">
              {salles.filter(r => r.status === 'available' && sallesOccupees.has(String(r.id))).map(r => (
                <option key={r.id} value={r.id} disabled>{r.name} (occupée)</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Récap */}
      {form.coursId && form.jour && form.slot && (
        <div style={{ gridColumn: '1/-1', padding: '10px 12px', borderRadius: 9, background: conflitProf ? '#fff7ed' : '#f0fdf4', border: `1px solid ${conflitProf ? '#fed7aa' : '#86efac'}` }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: conflitProf ? '#d97706' : '#15803d', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            {conflitProf ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
            {conflitProf ? 'Séance avec conflit enseignant' : 'Prêt à enregistrer'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 14px', fontSize: 11, color: '#64748b', lineHeight: 1.9 }}>
            <span><strong>Matière :</strong> {getCoursForNiveau(form.niveauKey, cours).find(c => String(c.id) === String(form.coursId))?.name || '—'}</span>
            <span><strong>Type :</strong> {form.type}</span>
            <span><strong>Jour :</strong> {form.jour}</span>
            <span><strong>Horaire :</strong> {slotDebut}–{slotFin}</span>
          </div>
        </div>
      )}

      {/* Bouton */}
      <div style={{ gridColumn: '1/-1' }}>
        <button onClick={onSubmit} disabled={!canEdit || submitting}
          style={{ ...btn(conflitProf ? '#d97706' : 'linear-gradient(135deg,#1e3a8a,#1a56db)'), width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, fontWeight: 700, opacity: (!canEdit || submitting) ? 0.6 : 1, cursor: canEdit && !submitting ? 'pointer' : 'not-allowed' }}>
          {submitting ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</> : <><CheckCircle size={14} /> {submitLabel || 'Enregistrer la séance'}</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL DE MODIFICATION D'UNE SÉANCE
// ─────────────────────────────────────────────────────────────
function EditModal({ session, onClose, onSaved, salles, profs, cours, groupes, sessions, mesNiveaux }) {
  const { toast } = useNotification();
  const [form, setForm] = useState({
    niveauKey: '', coursId: String(session.courseId || ''),
    type: session.type || 'CM', profId: String(session.teacherId || ''),
    groupeId: String(session.groupId || ''), jour: session.day || '',
    slot: session.start && session.end ? `${session.start}|${session.end}` : '',
    salleId: String(session.roomId || ''),
  });
  const [saving, setSaving] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [profsCours, setProfsCours] = useState([]);
  const [dispoProf, setDispoProf] = useState([]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const slotDec   = form.slot ? form.slot.split('|') : null;
  const slotDebut = slotDec ? slotDec[0] : null;
  const slotFin   = slotDec ? slotDec[1] : null;

  const otherSessions = sessions.filter(s => s.id !== session.id);
  const sallesOccupees = new Set(
    form.jour && slotDebut
      ? otherSessions.filter(s => s.day === form.jour && s.start < slotFin && s.end > slotDebut).map(s => s.roomId).filter(Boolean).map(String)
      : []
  );
  const sallesLibres = salles.filter(r => r.status === 'available' && !sallesOccupees.has(String(r.id)));
  const conflitProf = form.profId && form.jour && slotDebut
    ? otherSessions.find(s => String(s.teacherId) === form.profId && s.day === form.jour && s.start < slotFin && s.end > slotDebut)
    : null;
  const profDispo = form.profId && form.jour && slotDebut && dispoProf.length > 0
    ? dispoProf.some(d => d.day === form.jour && d.start_time.slice(0, 5) <= slotDebut && d.end_time.slice(0, 5) >= slotFin)
    : null;

  const onChangeProf = async (profId) => {
    setField('profId', profId);
    if (!profId) { setDispoProf([]); return; }
    try {
      const { data } = await api.get('/planning/availabilities/', { params: { teacher: profId } });
      setDispoProf(data.results ?? data);
    } catch { setDispoProf([]); }
  };

  const handleSave = async () => {
    const e = {};
    if (!form.type) e.type = 'Requis';
    if (!form.jour) e.jour = 'Requis';
    if (!form.slot) e.slot = 'Requis';
    setErreurs(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      await TimetableService.updateSession(session.id, {
        course:       form.coursId || session.courseId,
        teacher:      form.profId  || null,
        room:         form.salleId || null,
        group:        form.groupeId || null,
        session_type: form.type,
        day:          form.jour,
        start_time:   slotDebut + ':00',
        end_time:     slotFin   + ':00',
      });
      toast.success('Séance modifiée', `${form.jour} ${slotDebut}–${slotFin}`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Erreur', err.response?.data?.detail || 'Modification impossible.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit3 size={16} color="#1e3a8a" /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Modifier la séance</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{session.course}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <SeanceForm
            form={form} setField={setField} erreurs={erreurs}
            cours={cours} profs={profs} profsCours={profsCours}
            groupes={groupes} salles={salles}
            sallesLibres={sallesLibres} sallesOccupees={sallesOccupees}
            conflitProf={conflitProf} profDispo={profDispo}
            dispoProf={dispoProf} loadingDispo={false}
            canEdit={true}
            onChangeCours={(id) => setField('coursId', id)}
            onChangeProf={onChangeProf}
            onChangeJour={(j) => setField('jour', j)}
            onChangeSlot={(s) => setField('slot', s)}
            onSubmit={handleSave} submitting={saving}
            submitLabel="Enregistrer les modifications"
            slotDebut={slotDebut} slotFin={slotFin}
            mesNiveaux={mesNiveaux}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function TimetableGeneration() {
  const { toast, confirm } = useNotification();
  const { user  } = useAuth();

  // Données de référence
  const [salles,   setSalles]   = useState([]);
  const [profs,    setProfs]    = useState([]);
  const [cours,    setCours]    = useState([]);
  const [groupes,  setGroupes]  = useState([]);
  const [acYear,   setAcYear]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  // EDT
  const [edts,        setEdts]        = useState([]);
  const [edtActif,    setEdtActif]    = useState(null);
  const [sessions,    setSessions]    = useState([]);
  const [loadingSess, setLoadingSess] = useState(false);

  // Mode
  const [mode, setMode] = useState('manuel'); // 'manuel' | 'auto'

  // Créer EDT
  const [creatingEdt,  setCreatingEdt]  = useState(false);
  const mesNiveaux = getNiveauxUtilisateur(user);
  const [semStreChoice, setSemChoice] = useState(mesNiveaux[0]?.semestre || 'S1');

  // Formulaire saisie manuelle
  const FORM0 = { niveauKey: mesNiveaux[0]?.key || '', coursId: '', type: 'CM', profId: '', groupeId: '', jour: '', slot: '', salleId: '' };
  const [form,       setFormState] = useState(FORM0);
  const [profsCours, setProfsCours] = useState([]);
  const [dispoProf,  setDispoProf]  = useState([]);
  const [loadingDispo, setLoadingDispo] = useState(false);
  const [conflits,   setConflits]   = useState(null);
  const [erreurs,    setErreurs]    = useState({});
  const [ajout,      setAjout]      = useState(false);
  const [ongletInfo, setOngletInfo] = useState('salles'); // 'salles' | 'dispos'

  // Génération auto
  const [generating,  setGenerating]  = useState(false);
  const [genResult,   setGenResult]   = useState(null);

  // Edit modal
  const [editSession, setEditSession] = useState(null);

  const setField = useCallback((k, v) => setFormState(f => ({ ...f, [k]: v })), []);

  // ── Chargement initial ────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      RoomService.getAll(),
      UserService.getTeachers({ page_size: 200 }),
      AcademicsService.getCourses({ page_size: 200 }),
      AcademicsService.getGroups({ page_size: 100 }),
      AcademicsService.getCurrentYear(),
      TimetableService.getAll({ page_size: 50 }),
    ]).then(([r, t, c, g, ay, tt]) => {
      setSalles(r);
      setProfs(t);
      setCours(c);
      setGroupes(g);
      setAcYear(ay);
      const liste = tt.results ?? tt;
      setEdts(liste);
      const brouillon = liste.find(e => ['BROUILLON','REJETE'].includes(e.status));
      if (brouillon) chargerSessions(brouillon);
    }).catch(() => toast.error('Erreur', 'Impossible de charger les données.')).finally(() => setLoading(false));
  }, []);

  // ── Charger séances d'un EDT ──────────────────────────────────
  const chargerSessions = useCallback(async (edt) => {
    setEdtActif(edt);
    setSessions([]);
    setFormState(FORM0);
    setDispoProf([]);
    setProfsCours([]);
    setErreurs({});
    setConflits(null);
    setGenResult(null);
    setLoadingSess(true);
    try {
      const data = await TimetableService.getSessions({ timetable: edt.id, page_size: 500 });
      setSessions(data);
    } catch { setSessions([]); }
    finally { setLoadingSess(false); }
  }, []);

  const rechargerSessions = useCallback(async () => {
    if (!edtActif) return;
    try {
      const data = await TimetableService.getSessions({ timetable: edtActif.id, page_size: 500 });
      setSessions(data);
    } catch {}
  }, [edtActif]);

  // ── Créer un EDT ──────────────────────────────────────────────
  const creerEdt = async () => {
    if (!user?.filiereId) { toast.error('Erreur', 'Votre compte n\'est pas lié à une filière.'); return; }
    setCreatingEdt(true);
    try {
      const edt = await TimetableService.create({ filiere: user.filiereId, semestre: semStreChoice });
      setEdts(prev => [edt, ...prev]);
      chargerSessions(edt);
      toast.success('EDT créé', `Emploi du temps ${semStreChoice} créé.`);
    } catch (err) {
      const d = err.response?.data;
      toast.error('Erreur', d?.non_field_errors?.[0] || d?.detail || 'Impossible de créer l\'EDT.');
    } finally { setCreatingEdt(false); }
  };

  // ── Changements dans le formulaire ───────────────────────────
  const onChangeProf = async (profId) => {
    setField('profId', profId);
    setField('salleId', '');
    if (!profId) { setDispoProf([]); return; }
    setLoadingDispo(true);
    setOngletInfo('dispos');
    try {
      const { data } = await api.get('/planning/availabilities/', { params: { teacher: profId } });
      setDispoProf(data.results ?? data);
    } catch { setDispoProf([]); }
    finally { setLoadingDispo(false); }
  };

  const onChangeCours = async (coursId) => {
    setField('coursId', coursId);
    setField('profId', '');
    setField('salleId', '');
    setProfsCours([]);
    setConflits(null);
    if (!coursId) return;
    const courseLocal = cours.find(c => String(c.id) === String(coursId));
    const teacherIds = Array.isArray(courseLocal?.teachers)
      ? courseLocal.teachers.map(String)
      : courseLocal?.teacher ? [String(courseLocal.teacher)] : [];
    if (teacherIds.length > 0) {
      const filtered = profs.filter(p => teacherIds.includes(String(p.id)));
      setProfsCours(filtered);
      if (filtered.length === 1) onChangeProf(String(filtered[0].id));
    } else {
      try {
        const { data } = await api.get('/academics/assignments/', { params: { course: coursId, page_size: 50 } });
        const ids = (data.results ?? data).map(a => String(a.teacher || a.teacher_id)).filter(Boolean);
        const filtered = ids.length ? profs.filter(p => ids.includes(String(p.id))) : profs;
        setProfsCours(filtered);
        if (filtered.length === 1) onChangeProf(String(filtered[0].id));
      } catch { setProfsCours(profs); }
    }
  };

  const onChangeJour = (jour) => { setField('jour', jour); setField('salleId', ''); setConflits(null); setOngletInfo('salles'); };
  const onChangeSlot = (slot) => { setField('slot', slot); setField('salleId', ''); setConflits(null); setOngletInfo('salles'); };

  // ── Dérivés créneau ───────────────────────────────────────────
  const slotDec   = form.slot ? form.slot.split('|') : null;
  const slotDebut = slotDec ? slotDec[0] : null;
  const slotFin   = slotDec ? slotDec[1] : null;

  const sallesOccupees = new Set(
    form.jour && slotDebut
      ? sessions.filter(s => s.day === form.jour && s.start < slotFin && s.end > slotDebut).map(s => s.roomId).filter(Boolean).map(String)
      : []
  );
  const sallesLibres = salles.filter(r => r.status === 'available' && !sallesOccupees.has(String(r.id)));
  const conflitProf  = form.profId && form.jour && slotDebut
    ? sessions.find(s => String(s.teacherId) === String(form.profId) && s.day === form.jour && s.start < slotFin && s.end > slotDebut)
    : null;
  const profDispo = form.profId && form.jour && slotDebut && dispoProf.length > 0
    ? dispoProf.some(d => d.day === form.jour && d.start_time.slice(0, 5) <= slotDebut && d.end_time.slice(0, 5) >= slotFin)
    : null;

  // ── Créer séance ──────────────────────────────────────────────
  const creerSeance = async () => {
    const e = {};
    if (!form.niveauKey) e.niveauKey = 'Choisissez une classe.';
    if (!form.coursId)   e.coursId   = 'Choisissez une matière.';
    if (!form.jour)      e.jour      = 'Choisissez un jour.';
    if (!form.slot)      e.slot      = 'Choisissez un créneau.';
    setErreurs(e);
    if (Object.keys(e).length > 0) return;
    if (!edtActif) { toast.warning('Attention', 'Sélectionnez un EDT d\'abord.'); return; }
    setAjout(true);
    try {
      await TimetableService.createSession({
        timetable: edtActif.id, course: form.coursId, teacher: form.profId || null,
        room: form.salleId || null, group: form.groupeId || null, session_type: form.type,
        day: form.jour, start_time: slotDebut + ':00', end_time: slotFin + ':00',
      });
      await rechargerSessions();
      const c = getCoursForNiveau(form.niveauKey, cours).find(c => String(c.id) === String(form.coursId));
      toast.success('Séance ajoutée !', `${c?.name || 'Séance'} — ${form.jour} ${slotDebut}–${slotFin}`);
      setFormState(f => ({ ...f, jour: '', slot: '', salleId: '', groupeId: '' }));
      setConflits(null); setErreurs({});
    } catch (err) {
      const d = err.response?.data;
      toast.error('Erreur', d?.detail || d?.non_field_errors?.[0] || 'Erreur lors de la création.');
    } finally { setAjout(false); }
  };

  // ── Supprimer séance ──────────────────────────────────────────
  const supprimerSeance = async (session) => {
    const ok = await confirm('Supprimer cette séance ?');
    if (!ok) return;
    try {
      await TimetableService.deleteSession(session.id);
      setSessions(prev => prev.filter(s => s.id !== session.id));
      toast.info('Séance supprimée', '');
    } catch { toast.error('Erreur', 'Suppression impossible.'); }
  };

  // ── Génération automatique ────────────────────────────────────
  const genererAuto = async () => {
    if (!edtActif) return;
    const ok = await confirm('Lancer la génération automatique ? Les séances existantes seront remplacées.');
    if (!ok) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const { data } = await api.post(`/planning/timetables/${edtActif.id}/generate/`);
      await rechargerSessions();
      setGenResult({ ok: true, created: data.sessions_created, quality: data.quality_score, conflicts: data.conflicts_count });
      toast.success('Génération terminée !', `${data.sessions_created} séances créées — Score: ${data.quality_score}%`);
    } catch (err) {
      setGenResult({ ok: false, error: err.response?.data?.detail || 'Génération impossible.' });
      toast.error('Erreur', err.response?.data?.detail || 'Génération impossible.');
    } finally { setGenerating(false); }
  };

  // ── Workflow EDT ──────────────────────────────────────────────
  const soumettre = async () => {
    if (!edtActif || sessions.length === 0) { toast.warning('EDT vide', 'Ajoutez des séances avant de soumettre.'); return; }
    const ok = await confirm('Soumettre cet EDT pour validation ?');
    if (!ok) return;
    try {
      const updated = await TimetableService.submit(edtActif.id);
      setEdtActif(updated);
      setEdts(prev => prev.map(e => e.id === updated.id ? updated : e));
      toast.success('EDT soumis !', 'En attente de validation.');
    } catch (err) { toast.error('Erreur', err.response?.data?.detail || 'Erreur.'); }
  };

  const canEdit = edtActif && ['BROUILLON', 'REJETE'].includes(edtActif.status);

  // ─────────────────────────────────────────────────────────────
  if (loading) return <div className="loader" style={{ margin: '60px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Programmer les séances</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {edtActif ? `${edtActif.filiere} · ${edtActif.semester} · ${sessions.length} séance(s)` : 'Sélectionnez ou créez un EDT'}
          </p>
        </div>
        {edtActif && canEdit && sessions.length > 0 && (
          <button onClick={soumettre} style={btn('#10b981')}>
            <Send size={13} /> Soumettre pour validation
          </button>
        )}
      </div>

      {/* ── SÉLECTION / CRÉATION EDT ──────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Créer */}
          <div>
            <label style={lbl}>Créer un nouvel EDT</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select style={{ ...inp, width: 180 }} value={semStreChoice} onChange={e => setSemChoice(e.target.value)}>
                {mesNiveaux.map(n => (
                  <option key={n.key} value={n.semestre}>{n.label}</option>
                ))}
              </select>
              <button onClick={creerEdt} disabled={creatingEdt || !user?.filiereId}
                style={{ ...btn('#1a56db'), opacity: !user?.filiereId ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                {creatingEdt ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />} Créer
              </button>
            </div>
          </div>

          {/* EDTs existants */}
          {edts.length > 0 && (
            <>
              <div style={{ borderLeft: '1px solid #e2e8f0', height: 36, alignSelf: 'flex-end' }} />
              <div>
                <label style={lbl}>Ouvrir un EDT existant</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {edts.map(e => (
                    <button key={e.id} onClick={() => chargerSessions(e)}
                      style={{ padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: edtActif?.id === e.id ? 700 : 400, border: edtActif?.id === e.id ? '2px solid #1a56db' : '1px solid #e2e8f0', background: edtActif?.id === e.id ? '#eff6ff' : 'white', color: edtActif?.id === e.id ? '#1e3a8a' : '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {e.semester}
                      <StatusBadge status={e.status} />
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{e.sessionsCount}s</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {edtActif && (
        <>
          {/* ── Alerte rejet ─────────────────────────────────────── */}
          {edtActif.rejectionReason && (
            <div style={{ background: '#fff7ed', border: '1px solid #f97316', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={15} color="#f97316" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 12, color: '#c2410c' }}>EDT rejeté — </span>
                <span style={{ fontSize: 12, color: '#9a3412' }}>{edtActif.rejectionReason}</span>
              </div>
            </div>
          )}

          {/* ── Onglets Manuel / Auto ────────────────────────────── */}
          <div style={{ display: 'flex', gap: 0, background: '#f1f5f9', padding: 4, borderRadius: 12, width: 'fit-content', border: '1px solid #e2e8f0' }}>
            {[
              { key: 'manuel', label: 'Saisie manuelle', icon: PenLine },
              { key: 'auto',   label: 'Génération automatique', icon: Zap },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setMode(key)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: mode === key ? 700 : 500, background: mode === key ? (key === 'auto' ? '#1e3a8a' : 'white') : 'transparent', color: mode === key ? (key === 'auto' ? 'white' : '#1e3a8a') : '#64748b', boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s' }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════
              ONGLET MANUEL
          ══════════════════════════════════════════════════════ */}
          {mode === 'manuel' && (
            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 320px', gap: 16, alignItems: 'start' }}>

              {/* Colonne 1 — Salles / Disponibilités */}
              <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', overflow: 'hidden', position: 'sticky', top: 76 }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                  {[{ key: 'salles', label: 'Salles', Icon: Building2 }, { key: 'dispos', label: 'Disponibilités', Icon: Users }].map(t => (
                    <button key={t.key} onClick={() => setOngletInfo(t.key)}
                      style={{ flex: 1, padding: '9px 4px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: ongletInfo === t.key ? 700 : 400, background: ongletInfo === t.key ? '#eff6ff' : 'white', color: ongletInfo === t.key ? '#1a56db' : '#64748b', borderBottom: ongletInfo === t.key ? '2px solid #1a56db' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <t.Icon size={11} /> {t.label}
                    </button>
                  ))}
                </div>
                <div style={{ padding: 10, maxHeight: 500, overflowY: 'auto' }}>
                  {ongletInfo === 'salles' ? (
                    <SallesPanel salles={salles} occupees={form.jour && slotDebut ? sallesOccupees : new Set()} selDay={form.jour} selSlot={slotDebut ? `${slotDebut}–${slotFin}` : null} />
                  ) : (
                    <>
                      {!form.profId && <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Sélectionnez un enseignant.</p>}
                      {form.profId && loadingDispo && <div className="loader" style={{ margin: '20px auto', width: 24, height: 24 }} />}
                      {form.profId && !loadingDispo && (
                        <>
                          {dispoProf.length === 0
                            ? <div style={{ fontSize: 11, color: '#d97706', background: '#fef3c7', padding: '7px 9px', borderRadius: 6, marginBottom: 8 }}>⚠ Aucune disponibilité renseignée.</div>
                            : <div style={{ fontSize: 10, color: '#15803d', background: '#f0fdf4', padding: '4px 8px', borderRadius: 6, marginBottom: 8 }}>✓ {dispoProf.length} créneaux</div>
                          }
                          <AvailGrid avail={dispoProf} selDay={form.jour} selStart={slotDebut} selEnd={slotFin} />
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Colonne 2 — Formulaire */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} color="#1a56db" /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Nouvelle séance</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{edtActif.filiere} · {edtActif.semester}</div>
                  </div>
                </div>
                {!canEdit && (
                  <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 7, alignItems: 'center', fontSize: 12, color: '#92400e' }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                    EDT en statut <strong>{edtActif.status}</strong> — séances non modifiables.
                  </div>
                )}
                <SeanceForm
                  form={form} setField={setField} erreurs={erreurs}
                  cours={cours} profs={profs} profsCours={profsCours}
                  groupes={groupes} salles={salles}
                  sallesLibres={sallesLibres} sallesOccupees={sallesOccupees}
                  conflitProf={conflitProf} profDispo={profDispo}
                  dispoProf={dispoProf} loadingDispo={loadingDispo}
                  canEdit={canEdit}
                  onChangeCours={onChangeCours}
                  onChangeProf={onChangeProf}
                  onChangeJour={onChangeJour}
                  onChangeSlot={onChangeSlot}
                  onSubmit={creerSeance} submitting={ajout}
                  submitLabel="Enregistrer la séance"
                  slotDebut={slotDebut} slotFin={slotFin}
                  mesNiveaux={mesNiveaux}
                />
              </div>

              {/* Colonne 3 — Séances */}
              <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', overflow: 'hidden', position: 'sticky', top: 76 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                  <Calendar size={13} color="#1a56db" />
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>Séances</span>
                  <span style={{ background: '#eff6ff', color: '#1a56db', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 10 }}>{sessions.length}</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                    {['CM','TD','TP'].map(t => {
                      const n = sessions.filter(s => s.type === t).length;
                      if (!n) return null;
                      const c = SESSION_TYPE_COLORS[t];
                      return <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: c.bg, color: c.text, fontWeight: 700 }}>{t}:{n}</span>;
                    })}
                  </div>
                </div>
                <div style={{ padding: 10, maxHeight: 560, overflowY: 'auto' }}>
                  {loadingSess
                    ? <div className="loader" style={{ margin: '20px auto', width: 24, height: 24 }} />
                    : <SeancesList sessions={sessions} onDelete={supprimerSeance} onEdit={setEditSession} canEdit={canEdit} />
                  }
                </div>
                {sessions.filter(s => !s.roomId).length > 0 && (
                  <div style={{ padding: '6px 13px', borderTop: '1px solid #f1f5f9', background: '#fff7ed', fontSize: 10, color: '#d97706' }}>
                    ⚠ {sessions.filter(s => !s.roomId).length} séance(s) sans salle
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              ONGLET GÉNÉRATION AUTOMATIQUE
          ══════════════════════════════════════════════════════ */}
          {mode === 'auto' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
              {/* Carte info */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Layers size={20} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 6 }}>Génération automatique de séances</div>
                  <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.7 }}>
                    L'algorithme va analyser les contraintes de la maquette pédagogique, les disponibilités des enseignants et les salles disponibles pour générer automatiquement toutes les séances.<br />
                    <strong>⚠ Les séances existantes seront remplacées.</strong>
                  </div>
                </div>
              </div>

              {/* EDT cible */}
              <div style={card}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>EDT cible</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={18} color="#1e3a8a" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{edtActif.filiere} — {edtActif.semester}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{sessions.length} séances actuelles · {edtActif.sessionsCount} enregistrées</div>
                  </div>
                  <StatusBadge status={edtActif.status} />
                </div>
              </div>

              {/* Bouton générer */}
              {canEdit ? (
                <button onClick={genererAuto} disabled={generating}
                  style={{ ...btn('linear-gradient(135deg,#1e3a8a,#1a56db)'), padding: '16px 24px', fontSize: 16, fontWeight: 800, justifyContent: 'center', borderRadius: 12, boxShadow: '0 4px 14px rgba(30,58,138,0.3)', opacity: generating ? 0.7 : 1, cursor: generating ? 'not-allowed' : 'pointer' }}>
                  {generating
                    ? <><RefreshCw size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Génération en cours…</>
                    : <><Zap size={18} /> Lancer la génération automatique</>
                  }
                </button>
              ) : (
                <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400e', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  Cet EDT est en statut <strong>{edtActif.status}</strong> — la génération n'est possible que sur un brouillon.
                </div>
              )}

              {/* Résultat génération */}
              {genResult && (
                <div style={{ background: genResult.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${genResult.ok ? '#10b981' : '#f87171'}`, borderRadius: 12, padding: '16px 20px' }}>
                  {genResult.ok ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <CheckCircle size={18} /> Génération réussie !
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Séances créées', value: genResult.created, color: '#1e3a8a' },
                          { label: 'Score qualité', value: `${genResult.quality || 0}%`, color: genResult.quality >= 80 ? '#10b981' : genResult.quality >= 50 ? '#f59e0b' : '#ef4444' },
                          { label: 'Conflits', value: genResult.conflicts || 0, color: genResult.conflicts > 0 ? '#ef4444' : '#10b981' },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ textAlign: 'center', padding: '10px 8px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setMode('manuel')} style={{ ...btn('#f1f5f9', '#1e293b'), marginTop: 12, fontSize: 12 }}>
                        <PenLine size={12} /> Voir et modifier les séances
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626', marginBottom: 4 }}>Génération échouée</div>
                        <div style={{ fontSize: 13, color: '#9a3412' }}>{genResult.error}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── GRILLE EDT ───────────────────────────────────────── */}
          {sessions.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1e3a8a,#1a56db)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} color="white" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Emploi du temps</h3>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{edtActif.filiere} · {edtActif.semester} · {sessions.length} séances</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                  {['CM','TD','TP'].map(t => {
                    const c = SESSION_TYPE_COLORS[t];
                    return <span key={t} style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: c.bg, border: `2px solid ${c.border}`, display: 'inline-block' }} />{t}</span>;
                  })}
                </div>
              </div>
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TimetableGrid sessions={sessions} />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODAL MODIFICATION ───────────────────────────────────── */}
      {editSession && (
        <EditModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onSaved={rechargerSessions}
          salles={salles} profs={profs} cours={cours} groupes={groupes}
          sessions={sessions} mesNiveaux={mesNiveaux}
        />
      )}

      {/* Overlay génération */}
      {generating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '36px 40px', textAlign: 'center', maxWidth: 340, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 52, height: 52, border: '4px solid #dbeafe', borderTopColor: '#1a56db', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Génération en cours…</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Analyse des contraintes et placement des séances.</div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
