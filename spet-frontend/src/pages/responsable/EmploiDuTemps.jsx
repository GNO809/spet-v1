// ============================================================
// SPET — Emplois du Temps (Chef de filière)
// 5 onglets : Création · Brouillons · Soumis · Validés · Retournés
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Zap, PenLine, ChevronRight, ChevronLeft,
  Calendar, Send, Globe, AlertTriangle, CheckCircle, Clock,
  Trash2, Eye, Edit3, X, RefreshCw, Users, Building2,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import TimetableService from '@/services/timetable.service';
import RoomService from '@/services/room.service';
import UserService from '@/services/user.service';
import AcademicsService from '@/services/academics.service';
import api from '@/services/api';
import {
  DAYS, NIVEAUX,
  getNiveauxUtilisateur, SESSION_TYPE_COLORS,
} from '@/utils/constants';
import {
  VALID_SLOTS,
  checkConflicts, buildTeacherMap, buildRoomMap,
} from '@/utils/conflictChecker';

// ── Helpers ───────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Style tokens ──────────────────────────────────────────────
const S = {
  card:  { background:'#fff', borderRadius:'12px', border:'1px solid #e2e8f0', padding:'20px' },
  inp:   { width:'100%', padding:'9px 11px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'13px', color:'#1e293b', background:'#fff', fontFamily:'inherit', boxSizing:'border-box' },
  lbl:   { display:'block', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' },
  btn:   (bg='#1e3a8a', c='white', extra={}) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:'8px', border:'none', background:bg, color:c, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'opacity .15s', ...extra }),
  btnSm: (bg='#f1f5f9', c='#475569') => ({ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:'6px', border:'none', background:bg, color:c, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }),
};

// ── Status badge ──────────────────────────────────────────────
const STATUS_CFG = {
  BROUILLON:             { bg:'#f1f5f9', c:'#475569', label:'Brouillon' },
  EN_ATTENTE_VALIDATION: { bg:'#fef3c7', c:'#b45309', label:'En attente de validation' },
  VALIDE:                { bg:'#dcfce7', c:'#15803d', label:'Validé' },
  PUBLIE:                { bg:'#dbeafe', c:'#1e3a8a', label:'Publié' },
  REJETE:                { bg:'#fee2e2', c:'#dc2626', label:'Rejeté' },
};
function Bdg({ status }) {
  const m = STATUS_CFG[status] || STATUS_CFG.BROUILLON;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:m.bg, color:m.c }}>
      {m.label}
    </span>
  );
}

// ── Weekly grid (créneaux 2h, pause 12–15 bloquée) ────────────
const GRID_SLOTS = [
  { label:'08h – 10h', start:'08:00', end:'10:00' },
  { label:'10h – 12h', start:'10:00', end:'12:00' },
  { label:'15h – 17h', start:'15:00', end:'17:00' },
  { label:'17h – 19h', start:'17:00', end:'19:00' },
];

function WeeklyGrid({ sessions = [], onClickSession, readOnly = false }) {
  const [filterGroup, setFilterGroup] = useState('all');
  const groups = [...new Set(sessions.map(s => s.group).filter(Boolean))];
  const shown   = filterGroup === 'all' ? sessions : sessions.filter(s => s.group === filterGroup);

  function cellSessions(day, slot) {
    return shown.filter(s => s.day === day && s.start < slot.end && s.end > slot.start);
  }

  const cell = { border:'1px solid #f1f5f9', padding:'4px', verticalAlign:'top', minHeight:'80px', minWidth:'110px' };

  return (
    <div>
      {groups.length > 1 && (
        <div style={{ display:'flex', gap:'6px', marginBottom:'10px', flexWrap:'wrap' }}>
          {['all', ...groups].map(g => (
            <button key={g} onClick={() => setFilterGroup(g)}
              style={S.btnSm(filterGroup===g?'#1e3a8a':'#f1f5f9', filterGroup===g?'#fff':'#475569')}>
              {g === 'all' ? 'Tous les groupes' : g}
            </button>
          ))}
        </div>
      )}
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', width:'100%', fontSize:'12px' }}>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              <th style={{ ...cell, width:'80px', fontWeight:700, color:'#64748b', fontSize:'11px', textAlign:'center' }}>Créneau</th>
              {DAYS.map(d => (
                <th key={d} style={{ ...cell, fontWeight:700, color:'#1e293b', textAlign:'center' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRID_SLOTS.flatMap((slot, si) => {
              const pauseRow = si === 2 ? (
                <tr key="pause-row">
                  <td colSpan={DAYS.length + 1} style={{
                    background:'repeating-linear-gradient(45deg,#f8fafc,#f8fafc 6px,#f1f5f9 6px,#f1f5f9 12px)',
                    padding:'8px 16px', color:'#94a3b8', fontSize:'11px', fontWeight:600,
                    textAlign:'center', borderTop:'2px solid #e2e8f0', borderBottom:'2px solid #e2e8f0',
                  }}>
                    🍽 Pause déjeuner — 12h00 · 15h00 — Créneaux bloqués
                  </td>
                </tr>
              ) : null;

              const slotRow = (
                <tr key={slot.start}>
                  <td style={{ ...cell, fontWeight:600, color:'#64748b', fontSize:'11px', background:'#f8fafc', textAlign:'center', verticalAlign:'middle' }}>
                    {slot.label}
                  </td>
                  {DAYS.map(day => {
                    const items = cellSessions(day, slot);
                    return (
                      <td key={day} style={cell}>
                        {items.map(s => {
                          const col = SESSION_TYPE_COLORS[s.type] || SESSION_TYPE_COLORS.CM;
                          return (
                            <div key={s.id}
                              onClick={() => !readOnly && onClickSession && onClickSession(s)}
                              style={{
                                background:col.bg, borderLeft:`3px solid ${col.border}`,
                                borderRadius:'5px', padding:'5px 7px', marginBottom:'3px',
                                cursor: readOnly ? 'default' : 'pointer',
                                transition:'box-shadow .15s',
                              }}
                              onMouseEnter={e => { if (!readOnly) e.currentTarget.style.boxShadow=`0 2px 8px ${col.border}40`; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; }}
                            >
                              <span style={{ background:col.border, color:'#fff', fontSize:'9px', fontWeight:700, padding:'1px 5px', borderRadius:'3px', display:'inline-block', marginBottom:'2px' }}>{s.type}</span>
                              <div style={{ fontWeight:600, color:col.text, fontSize:'11px', lineHeight:1.3 }}>
                                {s.course?.length > 20 ? s.course.slice(0,20)+'…' : (s.course||'—')}
                              </div>
                              <div style={{ fontSize:'10px', color:col.text, opacity:.8 }}>👤 {s.teacher||'—'}</div>
                              <div style={{ fontSize:'10px', color:col.text, opacity:.7 }}>📍 {s.room||'—'}</div>
                              {s.group && <div style={{ fontSize:'10px', color:col.text, opacity:.6 }}>👥 {s.group}</div>}
                              <div style={{ fontSize:'9px', color:col.text, opacity:.6, marginTop:'2px' }}>{s.start} – {s.end}</div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              );

              return pauseRow ? [pauseRow, slotRow] : [slotRow];
            })}
          </tbody>
        </table>
      </div>
      {sessions.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px', color:'#94a3b8', fontSize:'13px' }}>
          Aucune séance programmée
        </div>
      )}
    </div>
  );
}

// ── Session modal (add / edit / delete) ──────────────────────
function SessionModal({ session, edtId, rooms, teachers, groups, courses, allSessions, currentSemestre, onClose, onSaved }) {
  const { toast, confirm } = useNotification();
  const isEdit = !!session?.id;

  const [form, setForm] = useState({
    day:       session?.day                          || '',
    start:     session?.start                        || '',
    type:      session?.type                         || 'CM',
    courseId:  session?.courseId  != null ? String(session.courseId)  : '',
    teacherId: session?.teacherId != null ? String(session.teacherId) : '',
    roomId:    session?.roomId    != null ? String(session.roomId)    : '',
    groupId:   session?.groupId   != null ? String(session.groupId)   : '',
  });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors]     = useState([]);

  const slot = VALID_SLOTS.find(s => s.start === form.start);

  // Pré-remplir le prof du cours sélectionné (uniquement en création)
  useEffect(() => {
    if (isEdit || !form.courseId) return;
    const course = courses.find(c => String(c.id) === String(form.courseId));
    if (course?.teacher) setForm(f => ({ ...f, teacherId: String(course.teacher) }));
  }, [form.courseId]);

  // Live conflict check
  useEffect(() => {
    if (!form.day || !slot) { setErrors([]); return; }
    const errs = checkConflicts(
      { day:form.day, start:form.start, end:slot.end, roomId:form.roomId, teacherId:form.teacherId, groupId:form.groupId },
      allSessions,
      isEdit ? session.id : null,
      currentSemestre,
    );
    setErrors(errs);
  }, [form.day, form.start, form.roomId, form.teacherId, form.groupId]);

  async function handleSave() {
    if (!form.courseId) return toast.error('Matière requise', 'Sélectionnez une matière avant de continuer.');
    if (!slot) return toast.error('Erreur', 'Sélectionnez un créneau valide.');
    if (errors.length) return;
    setSaving(true);
    try {
      const payload = {
        timetable:    edtId,
        day:          form.day,
        start_time:   form.start + ':00',
        end_time:     slot.end   + ':00',
        session_type: form.type,
        course:       Number(form.courseId),
        teacher:  form.teacherId ? Number(form.teacherId) : null,
        room:     form.roomId    ? Number(form.roomId)    : null,
        group:    form.groupId   ? Number(form.groupId)   : null,
      };
      if (isEdit) {
        await TimetableService.updateSession(session.id, payload);
        toast.success('Séance modifiée');
      } else {
        await TimetableService.createSession(payload);
        toast.success('Séance ajoutée');
      }
      onSaved();
    } catch(e) {
      toast.error('Erreur', e.response?.data?.detail || e.message);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    const ok = await confirm(`Supprimer la séance "${session.course || 'cette séance'}" ?`);
    if (!ok) return;
    setDeleting(true);
    try {
      await TimetableService.deleteSession(session.id);
      toast.success('Séance supprimée');
      onSaved();
    } catch(e) {
      toast.error('Erreur', e.message);
    } finally { setDeleting(false); }
  }

  const F = (label, children) => (
    <div key={label}><label style={S.lbl}>{label}</label>{children}</div>
  );
  const Sel = (val, onChange, opts, ph = '— Sélectionner —') => (
    <select value={val} onChange={e => onChange(e.target.value)} style={S.inp}>
      <option value="">{ph}</option>
      {opts.map(o => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
    </select>
  );

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'540px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <h3 style={{ margin:0, fontSize:'16px', fontWeight:700, color:'#1e293b' }}>
            {isEdit ? 'Modifier la séance' : 'Ajouter une séance'}
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'4px', lineHeight:0 }}><X size={20}/></button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          {F('Matière', Sel(form.courseId, v => setForm(f=>({...f,courseId:v})),
            courses.map(c => ({ value:c.id, label:`${c.code||''}${c.code?' — ':''}${c.name}` }))))}
          {F('Type de séance', Sel(form.type, v => setForm(f=>({...f,type:v,groupId:''})), [
            {value:'CM',label:'CM — Cours Magistral'},
            {value:'TD',label:'TD — Travaux Dirigés'},
            {value:'TP',label:'TP — Travaux Pratiques'},
          ]))}
          {F('Enseignant', Sel(form.teacherId, v => setForm(f=>({...f,teacherId:v})),
            teachers.map(t => ({ value:t.id, label:`${t.firstName} ${t.lastName}${t.grade?' · '+t.grade:''}` }))))}
          <div key="groupe">
            <label style={S.lbl}>{form.type === 'CM' ? 'Groupe (optionnel)' : 'Groupe *'}</label>
            <select value={form.groupId} onChange={e => setForm(f=>({...f,groupId:e.target.value}))} style={S.inp}>
              <option value="">{form.type === 'CM' ? '— Classe entière —' : '— Choisir un groupe —'}</option>
              {groups.map(g => <option key={g.id} value={String(g.id)}>{g.label || g.name}</option>)}
            </select>
          </div>
          {F('Salle', Sel(form.roomId, v => setForm(f=>({...f,roomId:v})),
            rooms.map(r => ({ value:r.id, label:`${r.name} — ${r.room_type} (${r.capacity} pl.)` }))))}
          {F('Jour', Sel(form.day, v => setForm(f=>({...f,day:v})),
            DAYS.map(d => ({value:d,label:d}))))}
          {F('Créneau horaire', Sel(form.start, v => setForm(f=>({...f,start:v})),
            VALID_SLOTS.map(s => ({value:s.start, label:s.label}))))}
        </div>

        {errors.length > 0 && (
          <div style={{ marginTop:'12px', background:'#fee2e2', borderRadius:'8px', padding:'10px 12px', border:'1px solid #fca5a5' }}>
            {errors.map((e,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'6px', fontSize:'12px', color:'#dc2626', marginBottom:i<errors.length-1?'4px':0 }}>
                <AlertTriangle size={12} style={{ flexShrink:0, marginTop:'2px' }}/> {e.message}
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:'8px', justifyContent:'space-between', marginTop:'20px' }}>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting}
              style={S.btn('#fee2e2','#dc2626', { opacity:deleting?.6:1 })}>
              <Trash2 size={13}/> {deleting ? '…' : 'Supprimer'}
            </button>
          )}
          <div style={{ display:'flex', gap:'8px', marginLeft:'auto' }}>
            <button onClick={onClose} style={S.btn('#f1f5f9','#475569')}>Annuler</button>
            <button onClick={handleSave} disabled={saving || errors.length > 0 || !form.courseId}
              style={S.btn((errors.length>0||!form.courseId)?'#94a3b8':'#1e3a8a','white', { opacity:saving?.7:1 })}>
              {saving ? <RefreshCw size={13} className="spin"/> : null}
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Generation loader ─────────────────────────────────────────
const GEN_STEPS = [
  'Chargement des contraintes globales…',
  'Analyse de la maquette pédagogique…',
  'Algorithme de planification…',
  'Vérification des conflits…',
  'Emploi du temps généré ✓',
];
function GenLoader({ step }) {
  return (
    <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'20px' }}>
      {GEN_STEPS.map((label, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 0', opacity: i > step ? 0.3 : 1 }}>
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
              background: done ? '#10b981' : active ? '#1e3a8a' : '#e2e8f0' }}>
              {done ? <CheckCircle size={12} color="#fff"/> : active
                ? <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#fff', animation:'pulse 1s ease-in-out infinite' }}/>
                : <span style={{ color:'#94a3b8', fontSize:'9px', fontWeight:700 }}>{i+1}</span>
              }
            </div>
            <span style={{ fontSize:'13px', fontWeight: active?600:400, color: active?'#1e293b':'#64748b' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Availability mini-grid ────────────────────────────────────
function AvailPanel({ title, map, Icon, noAvailWarning }) {
  if (!map) return null;
  const C = { free:'#dcfce7', self:'#fee2e2', other:'#fef3c7', nodata:'#f1f5f9' };
  const L = { free:'Libre', self:'Occupé (ce planning)', other:'Autre filière', nodata:'Non déclaré' };
  return (
    <div style={{ ...S.card, padding:'12px', marginTop:'10px' }}>
      <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom: noAvailWarning ? '5px' : '8px' }}>
        <Icon size={13} color="#1e3a8a"/><span style={{ fontSize:'12px', fontWeight:700 }}>{title}</span>
      </div>
      {noAvailWarning && (
        <div style={{ fontSize:10, color:'#d97706', background:'#fef3c7', border:'1px solid #fde68a', borderRadius:5, padding:'3px 7px', marginBottom:'7px', display:'flex', gap:4, alignItems:'center' }}>
          <AlertTriangle size={9}/> Aucune disponibilité déclarée
        </div>
      )}
      <div style={{ overflowX:'auto' }}>
        <table style={{ borderCollapse:'collapse', fontSize:'10px' }}>
          <thead><tr>
            <th style={{ padding:'2px 6px', color:'#94a3b8' }}></th>
            {VALID_SLOTS.map(s => <th key={s.start} style={{ padding:'2px 5px', fontWeight:600, color:'#64748b', whiteSpace:'nowrap' }}>{s.label}</th>)}
          </tr></thead>
          <tbody>
            {DAYS.slice(0,5).map(d => (
              <tr key={d}>
                <td style={{ padding:'2px 6px', fontWeight:600, color:'#475569', whiteSpace:'nowrap' }}>{d.slice(0,3)}</td>
                {VALID_SLOTS.map(sl => {
                  const cell   = map[d]?.[sl.start];
                  const status = typeof cell === 'string' ? cell : cell?.status;
                  return (
                    <td key={sl.start} title={typeof cell === 'object' ? cell.detail : L[status]} style={{ padding:'2px', textAlign:'center' }}>
                      <div style={{ width:'28px', height:'16px', borderRadius:'3px', background:C[status]||'#f1f5f9', margin:'0 auto' }}/>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:'flex', gap:'8px', marginTop:'5px', flexWrap:'wrap' }}>
          {Object.entries(C).map(([k,c]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:'3px' }}>
              <div style={{ width:'9px', height:'9px', borderRadius:'2px', background:c }}/><span style={{ fontSize:'9px', color:'#64748b' }}>{L[k]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shared form helpers (defined outside to keep stable refs) ──
function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>{label}</label>
      {children}
    </div>
  );
}
function FormSelect({ value, onChange, opts, ph='— Choisir —', disabled }) {
  const inp = { width:'100%', padding:'9px 11px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'13px', color:'#1e293b', background: disabled ? '#f8fafc' : '#fff', fontFamily:'inherit', boxSizing:'border-box' };
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inp} disabled={disabled}>
      <option value="">{ph}</option>
      {opts.map(o => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
    </select>
  );
}

// ── Manual form (wide card — lives in right panel) ────────────
function ManualForm({ edtId, onNeedEdt, rooms, teachers, groups, courses, allSessions, currentSemestre, onAdded }) {
  const { toast } = useNotification();
  const EMPTY = { courseId:'', type:'CM', teacherId:'', groupId:'', roomId:'', day:'', start:'' };
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [conflicts, setConflicts]   = useState([]);
  const [localEdtId, setLocalEdtId] = useState(edtId);
  const [saveError, setSaveError]   = useState('');
  const [teacherAvail, setTeacherAvail] = useState(null); // null=pas chargé, []= aucune, [...]=déclarées

  useEffect(() => { if (edtId && edtId !== localEdtId) setLocalEdtId(edtId); }, [edtId]);

  // Charger les disponibilités de l'enseignant sélectionné
  useEffect(() => {
    if (!form.teacherId) { setTeacherAvail(null); return; }
    api.get('/planning/availabilities/', { params: { teacher: form.teacherId } })
      .then(res => setTeacherAvail(Array.isArray(res.data) ? res.data : (res.data?.results ?? [])))
      .catch(() => setTeacherAvail([]));
  }, [form.teacherId]);

  // Pré-remplir le prof du cours sélectionné
  useEffect(() => {
    if (!form.courseId) return;
    const course = courses.find(c => String(c.id) === String(form.courseId));
    if (course?.teacher) setForm(f => ({ ...f, teacherId: String(course.teacher) }));
  }, [form.courseId]);

  const slot = VALID_SLOTS.find(s => s.start === form.start);

  useEffect(() => {
    if (!form.day || !slot) { setConflicts([]); return; }
    setConflicts(checkConflicts(
      { day:form.day, start:form.start, end:slot.end,
        roomId:form.roomId, teacherId:form.teacherId, groupId:form.groupId },
      allSessions,
      null,
      currentSemestre,
    ));
  }, [form.day, form.start, form.roomId, form.teacherId, form.groupId]);

  const canSave = form.courseId && form.day && form.start && !conflicts.length;

  async function add() {
    if (!canSave) return;
    setSaving(true); setSaveError('');
    try {
      let resolvedId = localEdtId;
      if (!resolvedId) {
        const t = await onNeedEdt();
        resolvedId = t.id;
        setLocalEdtId(resolvedId);
      }
      await TimetableService.createSession({
        timetable:    resolvedId,
        day:          form.day,
        start_time:   form.start + ':00',
        end_time:     slot.end   + ':00',
        session_type: form.type,
        course:       Number(form.courseId),
        teacher:      form.teacherId ? Number(form.teacherId) : null,
        room:         form.roomId    ? Number(form.roomId)    : null,
        group:        form.groupId   ? Number(form.groupId)   : null,
      });
      toast.success('Séance ajoutée');
      setForm(EMPTY);
      onAdded(resolvedId);
    } catch(e) {
      const msg = e.response?.data
        ? Object.entries(e.response.data).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ')
        : e.message;
      setSaveError(msg);
      toast.error('Erreur', msg);
    } finally { setSaving(false); }
  }

  const courseOpts = courses.map(c => ({ value:c.id, label:`${c.code ? c.code+' — ' : ''}${c.name}` }));

  return (
    <div style={{ ...S.card, marginBottom:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
        <div style={{ fontWeight:700, fontSize:'14px', color:'#1e293b', display:'flex', alignItems:'center', gap:'7px' }}>
          <PenLine size={15} color="#1e3a8a"/> Nouvelle séance
        </div>
        {courses.length === 0 && (
          <div style={{ fontSize:'11px', color:'#f59e0b', display:'flex', gap:'4px', alignItems:'center' }}>
            <AlertTriangle size={11}/> Aucun cours configuré pour cette filière
          </div>
        )}
      </div>

      {/* ── Row 1 : Matière · Type · Groupe ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'10px', marginBottom:'10px' }}>
        <FormField label="Matière *">
          {courseOpts.length === 0
            ? <div style={{ ...S.inp, color:'#94a3b8', cursor:'not-allowed', display:'flex', alignItems:'center' }}>Aucun cours disponible</div>
            : <FormSelect value={form.courseId} onChange={v => setForm(f=>({...f,courseId:v}))} opts={courseOpts} ph="— Choisir une matière —"/>
          }
        </FormField>
        <FormField label="Type">
          <FormSelect value={form.type}
            onChange={v => setForm(f=>({...f,type:v,groupId:''}))}
            opts={[{value:'CM',label:'CM — Cours Magistral'},{value:'TD',label:'TD — Travaux Dirigés'},{value:'TP',label:'TP — Travaux Pratiques'}]}/>
        </FormField>
        <FormField label={form.type === 'CM' ? 'Groupe (optionnel)' : 'Groupe *'}>
          <select value={form.groupId} onChange={e => setForm(f=>({...f,groupId:e.target.value}))} style={S.inp}>
            <option value="">{form.type === 'CM' ? '— Classe entière —' : '— Choisir —'}</option>
            {groups.map(g => <option key={g.id} value={String(g.id)}>{g.label || g.name}</option>)}
          </select>
        </FormField>
      </div>

      {/* ── Row 2 : Enseignant · Salle ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
        <FormField label="Enseignant (profil validé)">
          <FormSelect value={form.teacherId} onChange={v => setForm(f=>({...f,teacherId:v}))}
            opts={teachers.map(t=>({value:t.id,label:`${t.firstName} ${t.lastName}${t.grade?' · '+t.grade:''}`}))}
            ph={teachers.length===0 ? '— Aucun enseignant validé —' : '— Choisir —'}/>
        </FormField>
        <FormField label="Salle">
          <FormSelect value={form.roomId} onChange={v => setForm(f=>({...f,roomId:v}))}
            opts={rooms.map(r=>({value:r.id,label:`${r.name} — ${r.room_type} (${r.capacity} pl.)`}))}
            ph={rooms.length===0 ? '— Aucune salle disponible —' : '— Choisir —'}/>
        </FormField>
      </div>

      {/* ── Row 3 : Jour · Créneau · Bouton ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'10px', alignItems:'flex-end' }}>
        <FormField label="Jour *">
          <FormSelect value={form.day} onChange={v => setForm(f=>({...f,day:v}))}
            opts={DAYS.map(d=>({value:d,label:d}))} ph="— Choisir —"/>
        </FormField>
        <FormField label="Créneau *">
          <FormSelect value={form.start} onChange={v => setForm(f=>({...f,start:v}))}
            opts={VALID_SLOTS.map(s=>({value:s.start,label:s.label}))} ph="— Choisir —"/>
        </FormField>
        <button onClick={add} disabled={saving || !canSave}
          style={{ ...S.btn(canSave?'#1e3a8a':'#94a3b8','white'), padding:'9px 18px', cursor:canSave?'pointer':'not-allowed', whiteSpace:'nowrap', marginBottom:'1px' }}>
          {saving ? <RefreshCw size={13} className="spin"/> : <Plus size={13}/>}
          {saving ? 'Enregistrement…' : 'Ajouter la séance'}
        </button>
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div style={{ marginTop:'10px', background:'#fee2e2', borderRadius:'8px', padding:'8px 12px', border:'1px solid #fca5a5' }}>
          {conflicts.map((e,i) => (
            <div key={i} style={{ display:'flex', gap:'5px', alignItems:'flex-start', fontSize:'12px', color:'#dc2626', marginBottom:i<conflicts.length-1?'3px':0 }}>
              <AlertTriangle size={11} style={{ flexShrink:0, marginTop:'2px' }}/> {e.message}
            </div>
          ))}
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div style={{ marginTop:'10px', background:'#fee2e2', borderRadius:'8px', padding:'8px 12px', border:'1px solid #fca5a5', fontSize:'12px', color:'#dc2626', display:'flex', gap:'6px', alignItems:'flex-start' }}>
          <AlertTriangle size={12} style={{ flexShrink:0, marginTop:'2px' }}/> {saveError}
        </div>
      )}

      {/* Availability panels */}
      {(form.teacherId || form.roomId) && (() => {
        const selTeacher = teachers.find(t => String(t.id) === String(form.teacherId));
        const selRoom    = rooms.find(r => String(r.id) === String(form.roomId));
        if (!selTeacher && !selRoom) return null;
        return (
          <div style={{ display:'grid', gridTemplateColumns: selTeacher && selRoom ? '1fr 1fr' : '1fr', gap:'10px', marginTop:'10px' }}>
            {selTeacher && (() => {
              const sessionMap = buildTeacherMap(selTeacher.id, allSessions, localEdtId, currentSemestre);
              // Appliquer le masque disponibilités : si déclarées, créneaux hors dispo → 'nodata'
              if (teacherAvail !== null) {
                DAYS.forEach(d => {
                  VALID_SLOTS.forEach(sl => {
                    if (sessionMap[d][sl.start] !== 'free') return;
                    const declared = teacherAvail.some(a =>
                      a.day === d &&
                      a.start_time.slice(0, 5) <= sl.start &&
                      a.end_time.slice(0, 5)   >= sl.end
                    );
                    if (!declared) sessionMap[d][sl.start] = 'nodata';
                  });
                });
              }
              return (
                <AvailPanel
                  title={`${selTeacher.firstName} ${selTeacher.lastName}`}
                  map={sessionMap} Icon={Users}
                  noAvailWarning={teacherAvail !== null && teacherAvail.length === 0}
                />
              );
            })()}
            {selRoom && <AvailPanel title={`${selRoom.name} (${selRoom.capacity} pl.)`} map={buildRoomMap(selRoom.id, allSessions, localEdtId, currentSemestre)} Icon={Building2}/>}
          </div>
        );
      })()}
    </div>
  );
}

// ── EDT row ───────────────────────────────────────────────────
function EdtRow({ edt, onView, onSubmit, onPublish, onDelete, onRectify, onReSubmit }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #f1f5f9', gap:'12px', flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1, minWidth:0 }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Calendar size={16} color="#1e3a8a"/>
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:'13px', color:'#1e293b' }}>{edt.filiere} — Semestre {edt.semester}</div>
          <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>
            {edt.sessionsCount ?? 0} séance{(edt.sessionsCount??0)!==1?'s':''} · Score qualité : {edt.quality ?? 0}/100
            {edt.createdAt && ` · ${new Date(edt.createdAt).toLocaleDateString('fr-FR')}`}
          </div>
          {edt.rejectionReason && (
            <div style={{ marginTop:'4px', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'6px', padding:'4px 8px', fontSize:'11px', color:'#c2410c', display:'flex', gap:'5px', alignItems:'flex-start' }}>
              <AlertTriangle size={11} style={{ flexShrink:0, marginTop:'1px' }}/> {edt.rejectionReason}
            </div>
          )}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0, flexWrap:'wrap' }}>
        <Bdg status={edt.status}/>
        {onView      && <button onClick={()=>onView(edt)}      style={S.btnSm()}><Eye size={12}/>Voir</button>}
        {onRectify   && <button onClick={()=>onRectify(edt)}   style={S.btnSm('#fff7ed','#c2410c')}><Edit3 size={12}/>Rectifier</button>}
        {onSubmit    && <button onClick={()=>onSubmit(edt)}    style={S.btnSm('#eff6ff','#1e3a8a')}><Send size={12}/>Soumettre</button>}
        {onPublish   && <button onClick={()=>onPublish(edt)}   style={S.btnSm('#f0fdf4','#15803d')}><Globe size={12}/>Publier</button>}
        {onReSubmit  && <button onClick={()=>onReSubmit(edt)}  style={S.btnSm('#eff6ff','#1e3a8a')}><Send size={12}/>Re-soumettre</button>}
        {onDelete    && <button onClick={()=>onDelete(edt)}    style={S.btnSm('#fee2e2','#dc2626')}><Trash2 size={12}/></button>}
      </div>
    </div>
  );
}

// ── Onglet 1 — Création ───────────────────────────────────────
function OngletCreation({ user, refreshEdts, initialEdt, onRectifyDone }) {
  const { toast, confirm }  = useNotification();
  const mesNiveaux = getNiveauxUtilisateur(user);

  // Selections (dropdowns)
  const [selNiveauBase,  setSelNiveauBase]  = useState(null);
  const [selNiveauEntry, setSelNiveauEntry] = useState(null);
  const [modeAuto, setModeAuto]             = useState(true);

  // EDT state
  const [edt, setEdt]           = useState(null);
  const [sessions, setSessions] = useState([]);
  const [editSess, setEditSess] = useState(null);
  const [loadingS, setLoadingS] = useState(false);
  const [creating, setCreating] = useState(false);
  // Auto-gen state
  const [genStep, setGenStep]   = useState(-1);
  const [genResult, setGenResult] = useState(null);
  const [genError, setGenError]   = useState(null);

  // Resources
  const [rooms,          setRooms]          = useState([]);
  const [teachers,       setTeachers]       = useState([]);
  const [groups,         setGroups]         = useState([]);
  const [courses,        setCourses]        = useState([]);
  const [year,           setYear]           = useState(null);
  const [globalSessions, setGlobalSessions] = useState([]); // séances des autres EDT

  // Derived lists
  const uniqueNiveaux = [...new Map(mesNiveaux.map(n => [n.niveau+(n.option||''), n])).values()];
  const semestresForNiveau = selNiveauBase
    ? mesNiveaux.filter(n => n.niveau === selNiveauBase.niveau && n.option === selNiveauBase.option)
    : [];
  const currentSemestre = selNiveauEntry?.semestre || null;

  // Cours filtrés par semestre — seuls ces cours doivent apparaître dans les dropdowns
  const semesterCourses = currentSemestre
    ? courses.filter(c => c.semestre === currentSemestre)
    : courses;

  useEffect(() => {
    RoomService.getAll().then(setRooms).catch(()=>{});
    UserService.getTeachers({ profile_status: 'VALIDE' }).then(setTeachers).catch(()=>{});
    AcademicsService.getCurrentYear().then(setYear).catch(()=>{});
    if (user?.filiereId) {
      AcademicsService.getGroups({ filiere: user.filiereId }).then(setGroups).catch(()=>{});
      AcademicsService.getCourses({ filiere: user.filiereId }).then(setCourses).catch(()=>{});
    } else {
      AcademicsService.getGroups({}).then(setGroups).catch(()=>{});
      AcademicsService.getCourses({}).then(setCourses).catch(()=>{});
    }
    // Charger toutes les séances des autres filières pour détection de conflits globaux
    TimetableService.getSessions({ page_size: 2000 })
      .then(setGlobalSessions)
      .catch(() => {});
  }, []);

  // Quand on arrive depuis "Rectifier" : charger l'EDT rejeté
  useEffect(() => {
    if (!initialEdt) return;
    const entry = NIVEAUX.find(n => n.niveau === initialEdt.niveau && n.semestre === initialEdt.semester);
    if (entry) {
      setSelNiveauBase(entry);
      setSelNiveauEntry(entry);
    }
    setEdt(initialEdt);
    setSessions(initialEdt.sessions || []);
    setModeAuto(false);
    onRectifyDone?.();
  }, [initialEdt]);

  async function loadSessions(id) {
    setLoadingS(true);
    try { setSessions(await TimetableService.getSessions({ timetable:id })); }
    catch(e) { toast.error('Erreur chargement séances', e.message); }
    finally { setLoadingS(false); }
  }

  // When semester changes, auto-load an existing timetable if one exists
  useEffect(() => {
    if (!selNiveauEntry || !user?.filiereId) return;
    const semestre = selNiveauEntry.semestre || 'S1';
    TimetableService.getAll({ filiere: user.filiereId, semestre })
      .then(res => {
        const list = res.results || (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          const t = list[0];
          setEdt(t);
          setLoadingS(true);
          TimetableService.getSessions({ timetable: t.id })
            .then(setSessions).catch(() => {}).finally(() => setLoadingS(false));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selNiveauEntry?.key, user?.filiereId]);

  async function getOrCreate() {
    if (edt) return edt;
    if (!user?.filiereId) throw new Error('Filière non configurée pour votre compte.');
    let yearObj = year;
    if (!yearObj) {
      yearObj = await AcademicsService.getCurrentYear();
      if (yearObj) setYear(yearObj);
      else throw new Error('Aucune année académique active. Contactez l\'administrateur.');
    }
    const semestre = selNiveauEntry?.semestre || 'S1';

    // Check if a timetable already exists (avoids unique_together constraint violation)
    const existing = await TimetableService.getAll({
      filiere: user.filiereId,
      semestre,
      academic_year: yearObj.id,
    });
    const list = existing.results || (Array.isArray(existing) ? existing : []);
    if (list.length > 0) {
      setEdt(list[0]);
      return list[0];
    }

    const t = await TimetableService.create({
      filiere:       user.filiereId,
      semestre,
      academic_year: yearObj.id,
    });
    setEdt(t);
    return t;
  }

  async function handleGenerate() {
    if (creating) return;
    setCreating(true);
    setGenError(null);
    try {
      setGenStep(0); await delay(700);
      setGenStep(1); await delay(700);
      setGenStep(2);
      const t = await getOrCreate();
      setGenStep(3);
      const res = await TimetableService.generateSessions(t.id);
      setGenStep(4);
      setGenResult(res);
      await loadSessions(t.id);
      refreshEdts();
    } catch(e) {
      setGenStep(-1);
      const msg = e.response?.data?.detail || e.message;
      setGenError(msg);
      toast.error('Génération échouée', msg);
    } finally { setCreating(false); }
  }

  async function handleRegénérer() {
    if (!edt) return handleGenerate();
    const ok = await confirm('Regénérer effacera toutes les séances actuelles. Continuer ?');
    if (!ok) return;
    setGenResult(null); setGenStep(-1); setSessions([]);
    setCreating(true);
    try {
      setGenStep(0); await delay(600);
      setGenStep(1); await delay(600);
      setGenStep(2); setGenStep(3);
      const res = await TimetableService.generateSessions(edt.id);
      setGenStep(4); setGenResult(res);
      await loadSessions(edt.id);
    } catch(e) {
      setGenStep(-1);
      toast.error('Regénération échouée', e.response?.data?.detail || e.message);
    } finally { setCreating(false); }
  }

  function handleSwitchToManual() {
    setModeAuto(false); // instant — no API call needed
  }

  async function handleSubmit() {
    if (!edt) return toast.error('Aucun EDT', 'Créez d\'abord un EDT.');
    const ok = await confirm(`Soumettre l'EDT "${edt.filiere} — Sem. ${edt.semester}" au chef de département ?`);
    if (!ok) return;
    try {
      await TimetableService.submit(edt.id);
      toast.success('EDT soumis', 'Le chef de département va le valider.');
      setEdt(prev => ({ ...prev, status:'EN_ATTENTE_VALIDATION' }));
      refreshEdts();
    } catch(e) { toast.error('Erreur', e.response?.data?.detail || e.message); }
  }

  function resetEdt() {
    setEdt(null); setSessions([]); setGenStep(-1); setGenResult(null); setGenError(null); setModeAuto(true);
  }

  return (
    <div style={{ display:'flex', gap:'20px', alignItems:'flex-start' }}>
      {/* ── Left panel ── */}
      <div style={{ width:'300px', flexShrink:0, display:'flex', flexDirection:'column', gap:'12px' }}>
        <div style={{ ...S.card, padding:'16px' }}>

          {/* ── Niveau dropdown ── */}
          <div style={{ marginBottom:'12px' }}>
            <label style={S.lbl}>Niveau</label>
            <select
              value={selNiveauBase?.key || ''}
              onChange={e => {
                const n = uniqueNiveaux.find(x => x.key === e.target.value) || null;
                setSelNiveauBase(n);
                setSelNiveauEntry(null);
                resetEdt();
              }}
              style={S.inp}
            >
              <option value="">— Choisir un niveau —</option>
              {uniqueNiveaux.map(n => (
                <option key={n.key} value={n.key}>
                  {n.niveau}{n.option && n.option !== 'TC' ? ` — ${n.option}` : ''}
                  {n.option === 'GL' ? ' (Génie Logiciel)' : n.option === 'RT' ? ' (Réseaux & Télécom)' : ' (Tronc commun)'}
                </option>
              ))}
            </select>
          </div>

          {/* ── Semestre dropdown (visible only when niveau chosen) ── */}
          {selNiveauBase && (
            <div style={{ marginBottom:'16px' }}>
              <label style={S.lbl}>Semestre</label>
              <select
                value={selNiveauEntry?.key || ''}
                onChange={e => {
                  const n = semestresForNiveau.find(x => x.key === e.target.value) || null;
                  setSelNiveauEntry(n);
                  resetEdt();
                }}
                style={S.inp}
              >
                <option value="">— Choisir un semestre —</option>
                {semestresForNiveau.map(n => (
                  <option key={n.key} value={n.key}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Mode toggle + actions (visible only when semestre chosen) ── */}
          {selNiveauEntry && (
            <div>

              {/* Filière prerequisite warning */}
              {!user?.filiereId && (
                <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'10px 12px', marginBottom:'12px', border:'1px solid #fca5a5', fontSize:'12px', color:'#dc2626', display:'flex', gap:'6px', alignItems:'flex-start' }}>
                  <AlertTriangle size={13} style={{ flexShrink:0, marginTop:'1px' }}/>
                  <span><strong>Filière non configurée.</strong> Demandez à l'administrateur d'associer votre compte à une filière.</span>
                </div>
              )}

              {/* ── AUTO / MANUEL toggle ── */}
              <div style={{ display:'flex', borderRadius:'8px', border:'2px solid #e2e8f0', overflow:'hidden', marginBottom:'14px' }}>
                <button
                  type="button"
                  onClick={() => { setModeAuto(true); }}
                  style={{
                    flex:1, padding:'10px 8px', border:'none', cursor:'pointer',
                    fontFamily:'inherit', fontWeight:700, fontSize:'13px',
                    background: modeAuto ? '#1e3a8a' : '#f8fafc',
                    color:      modeAuto ? '#fff'    : '#475569',
                    transition:'background .15s, color .15s',
                  }}
                >
                  ⚡ Auto
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToManual}
                  style={{
                    flex:1, padding:'10px 8px', border:'none', cursor:'pointer',
                    fontFamily:'inherit', fontWeight:700, fontSize:'13px',
                    background: !modeAuto ? '#1e3a8a' : '#f8fafc',
                    color:      !modeAuto ? '#fff'    : '#475569',
                    transition:'background .15s, color .15s',
                    borderLeft:'2px solid #e2e8f0',
                  }}
                >
                  ✏ Manuel
                </button>
              </div>

              {/* AUTO content */}
              {modeAuto && (
                <div>
                  {genStep < 0 && !genResult && (
                    <>
                      <button type="button" onClick={handleGenerate} disabled={creating || !user?.filiereId}
                        style={{ ...S.btn(), width:'100%', justifyContent:'center', padding:'12px', opacity: (creating || !user?.filiereId) ? .5 : 1 }}>
                        {creating ? <RefreshCw size={14} className="spin"/> : <Zap size={15}/>}
                        {creating ? 'Génération…' : 'Générer automatiquement'}
                      </button>
                      {genError && (
                        <div style={{ marginTop:'10px', background:'#fee2e2', borderRadius:'8px', padding:'8px 12px', border:'1px solid #fca5a5', fontSize:'12px', color:'#dc2626', display:'flex', gap:'6px', alignItems:'flex-start' }}>
                          <AlertTriangle size={12} style={{ flexShrink:0, marginTop:'2px' }}/> {genError}
                        </div>
                      )}
                    </>
                  )}
                  {genStep >= 0 && <GenLoader step={genStep}/>}
                  {genResult && (
                    <div style={{ background:'#f0fdf4', borderRadius:'10px', padding:'12px', border:'1px solid #bbf7d0' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'6px' }}>
                        <CheckCircle size={14} color="#10b981"/>
                        <span style={{ fontWeight:700, fontSize:'12px', color:'#15803d' }}>Génération réussie</span>
                      </div>
                      <div style={{ fontSize:'11px', color:'#166534', display:'grid', gap:'2px', marginBottom:'8px' }}>
                        <div>{genResult.sessions_created} séances créées</div>
                        {(genResult.sessions_unplaced??0)>0 && <div style={{color:'#dc2626'}}>⚠ {genResult.sessions_unplaced} non placées</div>}
                        <div>📊 Score : {genResult.quality_score ?? 0}/100</div>
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        <button type="button" onClick={() => setModeAuto(false)} style={S.btnSm('#dbeafe','#1e3a8a')}>
                          <Edit3 size={11}/> Modifier
                        </button>
                        <button type="button" onClick={handleRegénérer} disabled={creating} style={S.btnSm()}>
                          <RefreshCw size={11}/> Regénérer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MANUEL: just show a hint — form is in the right panel */}
              {!modeAuto && (
                <div style={{ background:'#f0f9ff', borderRadius:'8px', padding:'10px 12px', fontSize:'12px', color:'#0c4a6e', display:'flex', gap:'6px', alignItems:'center' }}>
                  <PenLine size={13}/> Remplissez le formulaire à droite pour ajouter des séances.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit button */}
        {edt && edt.status === 'BROUILLON' && (
          <button type="button" onClick={handleSubmit}
            style={{ ...S.btn('#0f766e','white'), width:'100%', justifyContent:'center', padding:'11px' }}>
            <Send size={14}/> Soumettre au Chef de Département
          </button>
        )}
        {edt && edt.status !== 'BROUILLON' && (
          <div style={{ textAlign:'center', padding:'10px' }}><Bdg status={edt.status}/></div>
        )}
      </div>

      {/* ── Right panel — form (manuel) + grid ── */}
      <div style={{ flex:1, minWidth:0 }}>

        {/* ManualForm — shown in right panel with full width */}
        {!modeAuto && selNiveauEntry && (
          <ManualForm
            edtId={edt?.id || null}
            onNeedEdt={getOrCreate}
            rooms={rooms} teachers={teachers}
            groups={groups} courses={semesterCourses}
            allSessions={[...sessions, ...globalSessions.filter(s => s.timetableId !== edt?.id)]}
            currentSemestre={currentSemestre}
            onAdded={(resolvedId) => {
              if (!edt) {
                TimetableService.getById(resolvedId)
                  .then(t => { setEdt(t); loadSessions(t.id); })
                  .catch(() => {});
              } else {
                loadSessions(edt.id);
              }
            }}
          />
        )}

        <div style={{ ...S.card, minHeight:'500px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'8px' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:'14px', color:'#1e293b' }}>
                {edt
                  ? `Grille hebdomadaire — ${edt.filiere} · Semestre ${edt.semester}`
                  : 'Grille hebdomadaire'}
              </div>
              {edt && (
                <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>
                  {sessions.length} séance{sessions.length!==1?'s':''} planifiée{sessions.length!==1?'s':''}
                  {' · '}<Bdg status={edt.status}/>
                </div>
              )}
            </div>
            {edt && (
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setEditSess('new')} style={S.btnSm('#eff6ff','#1e3a8a')}>
                  <Plus size={12}/> Ajouter
                </button>
                <button onClick={() => loadSessions(edt.id)} style={S.btnSm()} title="Actualiser">
                  <RefreshCw size={12}/>
                </button>
              </div>
            )}
          </div>

          {/* Bandeau motif de rejet */}
          {edt?.status === 'REJETE' && edt?.rejectionReason && (
            <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'8px', padding:'12px 14px', marginBottom:'14px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
              <AlertTriangle size={16} color="#c2410c" style={{ flexShrink:0, marginTop:'1px' }}/>
              <div>
                <div style={{ fontWeight:700, fontSize:'12px', color:'#c2410c', marginBottom:'3px' }}>Motif de retour du chef de département</div>
                <div style={{ fontSize:'13px', color:'#7c2d12', lineHeight:1.5 }}>{edt.rejectionReason}</div>
              </div>
            </div>
          )}

          {!edt ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'350px', color:'#94a3b8' }}>
              <Calendar size={52} style={{ marginBottom:'14px', opacity:.25 }}/>
              <div style={{ fontSize:'14px', fontWeight:600, marginBottom:'6px' }}>Aucun emploi du temps en cours</div>
              <div style={{ fontSize:'12px' }}>Sélectionnez un niveau, puis un semestre pour commencer</div>
            </div>
          ) : loadingS ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'200px' }}>
              <RefreshCw size={22} className="spin" color="#1e3a8a"/>
            </div>
          ) : (
            <WeeklyGrid sessions={sessions} onClickSession={s => setEditSess(s)}/>
          )}
        </div>
      </div>

      {/* Session modal */}
      {(editSess === 'new' || (editSess && editSess !== 'new')) && edt && (
        <SessionModal
          session={editSess === 'new' ? null : editSess}
          edtId={edt.id}
          rooms={rooms} teachers={teachers} groups={groups} courses={semesterCourses}
          allSessions={[...sessions, ...globalSessions.filter(s => s.timetableId !== edt?.id)]}
          currentSemestre={currentSemestre}
          onClose={() => setEditSess(null)}
          onSaved={async () => { setEditSess(null); await loadSessions(edt.id); }}
        />
      )}
    </div>
  );
}

// ── Tabs 2-5 — list view ──────────────────────────────────────
function EdtListTab({ edts, emptyMsg, onView, onSubmit, onPublish, onDelete, onRectify, onReSubmit }) {
  if (!edts.length) {
    return (
      <div style={{ textAlign:'center', padding:'60px 24px', color:'#94a3b8' }}>
        <Calendar size={44} style={{ marginBottom:'14px', opacity:.25 }}/>
        <div style={{ fontSize:'14px', fontWeight:600 }}>{emptyMsg}</div>
      </div>
    );
  }
  return (
    <div style={{ ...S.card, padding:0, overflow:'hidden' }}>
      {edts.map(e => (
        <EdtRow key={e.id} edt={e}
          onView={onView} onSubmit={onSubmit} onPublish={onPublish}
          onDelete={onDelete} onRectify={onRectify} onReSubmit={onReSubmit}
        />
      ))}
    </div>
  );
}

// ── View modal ────────────────────────────────────────────────
function ViewModal({ edt, onClose }) {
  if (!edt) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'92vw', maxWidth:'940px', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'17px', fontWeight:700 }}>{edt.filiere} — Semestre {edt.semester}</h3>
            <div style={{ marginTop:'4px' }}><Bdg status={edt.status}/></div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'4px', lineHeight:0 }}><X size={22}/></button>
        </div>
        <WeeklyGrid sessions={edt.sessions || []} readOnly/>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function EmploiDuTemps() {
  const { user }   = useAuth();
  const { toast, confirm }  = useNotification();
  const [tab, setTab]           = useState(0);
  const [edts, setEdts]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [viewEdt, setViewEdt]   = useState(null);
  const [rectifyEdt, setRectifyEdt] = useState(null);

  const TABS = [
    { label:'➕ Création' },
    { label:'📝 Brouillons' },
    { label:'Soumis' },
    { label:'Validés' },
    { label:'🔄 Retournés' },
  ];

  const fetchEdts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.filiereId) params.filiere = user.filiereId;
      const res = await TimetableService.getAll(params);
      setEdts(Array.isArray(res) ? res : (res.results || []));
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [user?.filiereId]);

  useEffect(() => { fetchEdts(); }, [fetchEdts]);

  const by = {
    brouillons: edts.filter(e => e.status === 'BROUILLON'),
    soumis:     edts.filter(e => e.status === 'EN_ATTENTE_VALIDATION'),
    valides:    edts.filter(e => ['VALIDE','PUBLIE'].includes(e.status)),
    retournes:  edts.filter(e => e.status === 'REJETE'),
  };

  async function openView(edt) {
    try {
      const sessions = await TimetableService.getSessions({ timetable:edt.id });
      setViewEdt({ ...edt, sessions });
    } catch(e) { toast.error('Erreur', e.message); }
  }

  async function handleSubmit(edt) {
    const ok = await confirm(`Soumettre l'EDT "${edt.filiere} · Sem. ${edt.semester}" au chef de département ?`);
    if (!ok) return;
    try {
      await TimetableService.submit(edt.id);
      toast.success('EDT soumis', 'En attente de validation par le chef de département.');
      fetchEdts();
    } catch(e) { toast.error('Erreur', e.response?.data?.detail || e.message); }
  }

  async function handlePublish(edt) {
    const ok = await confirm(`Publier l'EDT ? Il deviendra visible par tous les enseignants et étudiants.`);
    if (!ok) return;
    try {
      await TimetableService.publish(edt.id);
      toast.success('EDT publié !', 'Tous les enseignants peuvent maintenant le consulter.');
      fetchEdts();
    } catch(e) { toast.error('Erreur', e.response?.data?.detail || e.message); }
  }

  async function handleDelete(edt) {
    const ok = await confirm(`Supprimer définitivement cet EDT et toutes ses séances ?`);
    if (!ok) return;
    try {
      await TimetableService.delete(edt.id);
      toast.success('EDT supprimé');
      fetchEdts();
    } catch(e) { toast.error('Erreur', e.response?.data?.detail || e.message); }
  }

  async function handleRectify(edt) {
    try {
      const sessions = await TimetableService.getSessions({ timetable: edt.id });
      setRectifyEdt({ ...edt, sessions });
      setTab(0);
    } catch(e) { toast.error('Erreur chargement', e.message); }
  }

  const badges = [0, by.brouillons.length, by.soumis.length, by.valides.length, by.retournes.length];

  return (
    <div>
      <div style={{ marginBottom:'20px' }}>
        <h2 style={{ margin:0, fontSize:'20px', fontWeight:700, color:'#1e293b' }}>Emplois du temps</h2>
        <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#64748b' }}>Créez, soumettez et publiez les emplois du temps de votre filière.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', borderBottom:'2px solid #e2e8f0', marginBottom:'24px', overflowX:'auto', gap:0 }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              padding:'10px 18px', border:'none', cursor:'pointer', fontFamily:'inherit',
              fontWeight:tab===i?700:500, fontSize:'13px',
              color:tab===i?'#1e3a8a':'#64748b',
              background:'transparent',
              borderBottom:tab===i?'2px solid #1e3a8a':'2px solid transparent',
              marginBottom:'-2px', whiteSpace:'nowrap',
              transition:'all .15s ease',
            }}>
            {t.label}
            {badges[i] > 0 && (
              <span style={{ marginLeft:'6px', background:i===4?'#ef4444':i===2?'#f59e0b':'#1e3a8a', color:'#fff', borderRadius:'10px', fontSize:'10px', fontWeight:700, padding:'1px 7px' }}>
                {badges[i]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 0 && <OngletCreation user={user} refreshEdts={fetchEdts} initialEdt={rectifyEdt} onRectifyDone={() => setRectifyEdt(null)}/>}

      {tab === 1 && (
        <EdtListTab edts={by.brouillons}
          emptyMsg="Aucun brouillon. Créez votre premier EDT dans l'onglet Création."
          onView={openView} onSubmit={handleSubmit} onDelete={handleDelete}
        />
      )}

      {tab === 2 && (
        <EdtListTab edts={by.soumis}
          emptyMsg="Aucun EDT en attente de validation pour l'instant."
          onView={openView}
        />
      )}

      {tab === 3 && (
        <EdtListTab edts={by.valides}
          emptyMsg="Aucun EDT validé pour l'instant."
          onView={openView}
          onPublish={e => e.status === 'VALIDE' ? handlePublish(e) : null}
        />
      )}

      {tab === 4 && (
        <EdtListTab edts={by.retournes}
          emptyMsg="Aucun EDT retourné — Tout est en ordre !"
          onView={openView}
          onRectify={handleRectify}
          onReSubmit={handleSubmit}
        />
      )}

      {/* View modal (hoisted here so it works on all tabs) */}
      {viewEdt && <ViewModal edt={viewEdt} onClose={() => setViewEdt(null)}/>}
    </div>
  );
}
