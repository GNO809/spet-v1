// ============================================================
// SPET — Cours Assignés (Chef de filière)
// Affiche les cours de la filière avec leurs enseignants assignés
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, RefreshCw, CheckCircle, Clock, Search, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import AcademicsService from '@/services/academics.service';
import { getNiveauxUtilisateur, MAQUETTE } from '@/utils/constants';

const S = {
  card: { background:'#fff', borderRadius:'12px', border:'1px solid #e2e8f0', padding:'20px' },
  btn:  (bg='#1e3a8a', c='white', extra={}) => ({
    display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px',
    borderRadius:'8px', border:'none', background:bg, color:c,
    fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', ...extra,
  }),
  inp: { padding:'8px 12px', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'13px', color:'#1e293b', background:'#fff', fontFamily:'inherit' },
};

function TypeBadge({ type }) {
  const map = { CM:{ bg:'#dbeafe',c:'#1e3a8a' }, TD:{ bg:'#dcfce7',c:'#15803d' }, TP:{ bg:'#fef3c7',c:'#b45309' } };
  const m = map[type] || map.CM;
  return <span style={{ padding:'2px 7px', borderRadius:'5px', fontSize:'10px', fontWeight:700, background:m.bg, color:m.c }}>{type}</span>;
}

function CourseRow({ course, isNew, onMarkRead }) {
  const hasTeacher = !!course.teacher_name;

  return (
    <div onClick={() => isNew && onMarkRead(course.id)}
      style={{
        display:'flex', alignItems:'center', gap:'14px',
        padding:'13px 16px', borderBottom:'1px solid #f1f5f9',
        cursor: isNew ? 'pointer' : 'default',
        background: isNew ? '#fffbeb' : '#fff',
        transition:'background 0.2s',
      }}>
      {/* Dot */}
      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: isNew ? '#f59e0b' : '#e2e8f0', flexShrink:0 }} />

      {/* Icon */}
      <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <BookOpen size={15} color="#1e3a8a"/>
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:'13px', color:'#1e293b', display:'flex', alignItems:'center', gap:'8px' }}>
          <span>{course.code && `[${course.code}] `}{course.name}</span>
          {isNew && <span style={{ fontSize:'9px', fontWeight:700, background:'#fef3c7', color:'#b45309', padding:'1px 6px', borderRadius:'8px' }}>NOUVEAU</span>}
        </div>
        <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px', display:'flex', gap:'10px', flexWrap:'wrap' }}>
          {course.filiere_name && <span>📚 {course.filiere_name}</span>}
          {course.volume_cm > 0 && <span>CM:{course.volume_cm}h</span>}
          {course.volume_td > 0 && <span>TD:{course.volume_td}h</span>}
          {course.volume_tp > 0 && <span>TP:{course.volume_tp}h</span>}
        </div>
      </div>

      {/* Teacher */}
      <div style={{ flexShrink:0, textAlign:'right' }}>
        {hasTeacher ? (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', justifyContent:'flex-end' }}>
              <CheckCircle size={13} color="#10b981"/>
              <span style={{ fontSize:'12px', fontWeight:600, color:'#15803d' }}>Assigné</span>
            </div>
            <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>👤 {course.teacher_name}</div>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <Clock size={13} color="#f59e0b"/>
            <span style={{ fontSize:'12px', color:'#94a3b8' }}>Non assigné</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoursAssignes() {
  const { user }  = useAuth();
  const { toast } = useNotification();

  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [readIds, setReadIds]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('spet_cours_read') || '[]'); }
    catch { return []; }
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await AcademicsService.getCourses({ filiere: user?.filiereId, is_active: true });
      setCourses(list);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [user?.filiereId]);

  useEffect(() => { load(); }, [load]);

  // Poll every 30s for new assignments
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  function markRead(id) {
    const updated = [...new Set([...readIds, id])];
    setReadIds(updated);
    localStorage.setItem('spet_cours_read', JSON.stringify(updated));
  }

  function markAllRead() {
    const updated = courses.filter(c => c.teacher_name).map(c => c.id);
    setReadIds(prev => [...new Set([...prev, ...updated])]);
    localStorage.setItem('spet_cours_read', JSON.stringify([...new Set([...readIds, ...updated])]));
  }

  const filtered = courses.filter(c => {
    const q = search.trim().toLowerCase();
    return !q || `${c.name} ${c.code || ''} ${c.teacher_name || ''}`.toLowerCase().includes(q);
  });

  const assigned    = filtered.filter(c => !!c.teacher_name);
  const unassigned  = filtered.filter(c => !c.teacher_name);
  const newItems    = assigned.filter(c => !readIds.includes(c.id));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h2 style={{ margin:0, fontSize:'20px', fontWeight:700, color:'#1e293b' }}>Cours assignés</h2>
          <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#64748b' }}>
            Cours de votre filière avec leurs enseignants assignés par le chef de département.
          </p>
        </div>
        {newItems.length > 0 && (
          <button onClick={markAllRead} style={S.btn('#fff7ed','#c2410c')}>
            Tout marquer comme lu ({newItems.length})
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
        {[
          { label:'Nouvelles assignations', value: newItems.length,   bg:'#fffbeb', c:'#c2410c' },
          { label:'Cours assignés',          value: assigned.length,   bg:'#f0fdf4', c:'#15803d' },
          { label:'Non assignés',            value: unassigned.length, bg:'#f8fafc', c:'#475569' },
        ].map(({ label, value, bg, c }) => (
          <div key={label} style={{ background:bg, borderRadius:'10px', padding:'14px 16px', border:'1px solid #e2e8f0' }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:c, textTransform:'uppercase', marginBottom:'4px' }}>{label}</div>
            <div style={{ fontSize:'24px', fontWeight:800, color:c }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search + refresh */}
      <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un cours ou un enseignant…"
            style={{ ...S.inp, paddingLeft:'32px', width:'100%', boxSizing:'border-box' }} />
        </div>
        <button onClick={load} style={S.btn('#f8fafc','#64748b')}><RefreshCw size={13}/></button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'48px', color:'#94a3b8' }}>
          <RefreshCw size={24} className="spin" style={{ marginBottom:'12px' }}/>
          <div>Chargement…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px', color:'#94a3b8' }}>
          <BookOpen size={40} style={{ marginBottom:'12px', opacity:0.3 }}/>
          <div style={{ fontSize:'14px', fontWeight:500 }}>Aucun cours trouvé</div>
        </div>
      ) : (
        <>
          {/* New assignments banner */}
          {newItems.length > 0 && (
            <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'12px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
              <Clock size={18} color="#f59e0b"/>
              <span style={{ fontWeight:600, fontSize:'13px', color:'#92400e' }}>
                {newItems.length} nouvelle{newItems.length>1?'s':''} assignation{newItems.length>1?'s':''} — Cliquez pour marquer comme lue
              </span>
            </div>
          )}

          <div style={{ ...S.card, padding:0, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid #f1f5f9', background:'#f8fafc', display:'flex', alignItems:'center', gap:'6px' }}>
              <CheckCircle size={13} color="#10b981"/>
              <span style={{ fontSize:'12px', fontWeight:700, color:'#15803d' }}>Cours assignés ({assigned.length})</span>
            </div>
            {assigned.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>Aucun cours assigné pour l'instant.</div>
            ) : (
              assigned.map(c => (
                <CourseRow key={c.id} course={c} isNew={!readIds.includes(c.id)} onMarkRead={markRead} />
              ))
            )}
          </div>

          {unassigned.length > 0 && (
            <div style={{ ...S.card, padding:0, overflow:'hidden' }}>
              <div style={{ padding:'10px 16px', borderBottom:'1px solid #f1f5f9', background:'#f8fafc', display:'flex', alignItems:'center', gap:'6px' }}>
                <Clock size={13} color="#f59e0b"/>
                <span style={{ fontSize:'12px', fontWeight:700, color:'#b45309' }}>Cours sans enseignant ({unassigned.length})</span>
              </div>
              {unassigned.map(c => (
                <CourseRow key={c.id} course={c} isNew={false} onMarkRead={() => {}} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
