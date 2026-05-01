// ============================================================
// SPET — Admin: Gestion des Salles
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  DoorOpen, Plus, Edit2, Trash2, Calendar,
  CheckCircle, XCircle, Wrench, X, Search,
  Projector, Wifi, Wind, Layout,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useNotification } from '@/contexts/NotificationContext';
import RoomService from '@/services/room.service';

// ── Données par défaut ───────────────────────────────────────
const DEFAULT_ROOMS = [
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `default-${i + 1}`,
    name: `Salle ${i + 1}`,
    capacity: 40,
    room_type: 'TD',
    equipment: ['Tableau blanc'],
    status: 'available',
    isDefault: true,
  })),
  { id: 'default-amphi-b', name: 'Amphi B', capacity: 200, room_type: 'AMPHI', equipment: ['Projecteur', 'Tableau blanc', 'Climatisation'], status: 'available', isDefault: true },
];

const ROOM_TYPES = [
  { code: 'TD',    label: 'Salle de cours' },
  { code: 'TP',    label: 'Laboratoire TP' },
  { code: 'AMPHI', label: 'Amphithéâtre' },
];
const EQUIPEMENTS = ['Projecteur', 'Tableau blanc', 'Climatisation', 'WiFi'];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const PLANNING_DATA = {
  '08h–10h': { Lun: 'BD', Mar: null, Mer: 'Algo', Jeu: null, Ven: 'POO', Sam: null },
  '10h–12h': { Lun: null, Mar: 'Math', Mer: null, Jeu: 'Stat', Ven: null, Sam: 'TD Info' },
  '14h–16h': { Lun: 'Réseau', Mar: null, Mer: 'BD', Jeu: 'Algo', Ven: null, Sam: null },
  '16h–18h': { Lun: null, Mar: 'POO', Mer: null, Jeu: null, Ven: 'Maths', Sam: null },
};

const STATUS_CFG = {
  available:   { label: 'Disponible',   bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0', icon: CheckCircle },
  maintenance: { label: 'Maintenance',  bg: '#fef3c7', color: '#d97706', border: '#fde68a', icon: Wrench },
  occupied:    { label: 'Occupée',      bg: '#fee2e2', color: '#dc2626', border: '#fecaca', icon: XCircle },
};

const EMPTY_FORM = { name: '', capacity: '', room_type: 'TD', equipment: [], status: 'available' };


// ── Modal planning ────────────────────────────────────────────
function PlanningModal({ room, onClose }) {
  if (!room) return null;
  const totalSlots = Object.values(PLANNING_DATA).reduce((sum, jours) =>
    sum + Object.values(jours).filter(Boolean).length, 0);
  const totalPossible = 4 * 5;
  const occupation = Math.round((totalSlots / totalPossible) * 100);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Planning semaine — {room.name}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {/* Résumé */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { label: 'Capacité', value: `${room.capacity} places` },
              { label: 'Type', value: ROOM_TYPES.find(t => t.code === room.room_type)?.label || room.room_type },
              { label: 'Occupation sem.', value: `${occupation}%` },
            ].map(s => (
              <div key={s.label} style={{
                padding: '8px 14px', background: '#f8fafc',
                borderRadius: '8px', border: '1px solid #e2e8f0',
              }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Grille */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: '500px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(6, 1fr)', gap: '4px', marginBottom: '4px' }}>
                <div />
                {JOURS.map(j => (
                  <div key={j} style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textAlign: 'center', padding: '4px 0' }}>{j}</div>
                ))}
              </div>
              {Object.entries(PLANNING_DATA).map(([creneau, jours]) => (
                <div key={creneau} style={{ display: 'grid', gridTemplateColumns: '90px repeat(6, 1fr)', gap: '4px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>{creneau}</div>
                  {JOURS.map(j => {
                    const cours = jours[j];
                    return (
                      <div key={j} style={{
                        background: cours ? '#eff6ff' : '#f8fafc',
                        border: cours ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                        borderRadius: '6px', padding: '8px 4px', textAlign: 'center',
                        minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {cours && <span style={{ fontSize: '11px', fontWeight: 700, color: '#1a56db' }}>{cours}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
            {[['Occupée', '#eff6ff', '#bfdbfe'], ['Disponible', '#f8fafc', '#f1f5f9']].map(([l, bg, b]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                <span style={{ width: '12px', height: '12px', background: bg, border: `1px solid ${b}`, borderRadius: '3px', display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carte de salle ────────────────────────────────────────────
function RoomCard({ room, onEdit, onDelete, onPlanning }) {
  const cfg = STATUS_CFG[room.status] || STATUS_CFG.available;
  const Icon = cfg.icon;
  const typeLabel = ROOM_TYPES.find(t => t.code === room.room_type)?.label || room.room_type;

  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '16px',
      border: `1px solid ${room.status !== 'available' ? cfg.border : '#e2e8f0'}`,
      display: 'flex', flexDirection: 'column', gap: '10px',
      transition: 'box-shadow 0.15s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>{room.name}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{typeLabel}</div>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '3px 9px', borderRadius: '20px',
          background: cfg.bg, color: cfg.color, fontSize: '10px', fontWeight: 700,
        }}>
          <Icon size={10} /> {cfg.label}
        </span>
      </div>

      {/* Capacité */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px', background: '#f8fafc', borderRadius: '8px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{room.capacity}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>places</div>
        </div>
      </div>

      {/* Équipements */}
      {room.equipment?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {room.equipment.map(eq => (
            <span key={eq} style={{
              fontSize: '10px', padding: '2px 7px',
              background: '#f1f5f9', color: '#64748b', borderRadius: '20px',
            }}>{eq}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '5px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1, fontSize: '11px' }} onClick={() => onPlanning(room)}>
          <Calendar size={12} /> Planning
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(room)} title="Modifier">
          <Edit2 size={12} />
        </button>
        <button
          onClick={() => onDelete(room)} title="Supprimer"
          style={{
            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px',
            color: '#ef4444', cursor: 'pointer',
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function AdminRooms() {
  const [rooms,        setRooms]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState({ open: false, mode: 'create', room: null });
  const [planningRoom, setPlanningRoom] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [errors,       setErrors]       = useState({});
  const { toast, confirm } = useNotification();

  const load = () => {
    setLoading(true);
    RoomService.getAll()
      .then(data => {
        const apiRooms = Array.isArray(data) ? data : [];
        const apiNames = new Set(apiRooms.map(r => r.name?.toLowerCase()));
        const missing  = DEFAULT_ROOMS.filter(d => !apiNames.has(d.name.toLowerCase()));
        setRooms([...apiRooms, ...missing]);
      })
      .catch(() => setRooms(DEFAULT_ROOMS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter(r => {
      const matchQ = !search || r.name.toLowerCase().includes(q);
      const matchF = filter === 'all' || r.status === filter;
      return matchQ && matchF;
    });
  }, [rooms, filter, search]);

  const stats = {
    total:       rooms.length,
    available:   rooms.filter(r => r.status === 'available').length,
    occupied:    rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  };

  const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setModal({ open: true, mode: 'create', room: null }); };
  const openEdit   = r  => {
    setErrors({});
    setForm({ name: r.name, capacity: String(r.capacity), room_type: r.room_type || 'TD', equipment: [...(r.equipment || [])], status: r.status || 'available' });
    setModal({ open: true, mode: 'edit', room: r });
  };
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const askDelete = async (r) => {
    const ok = await confirm(`Supprimer la salle "${r.name}" ? Cette action est irréversible.`);
    if (!ok) return;
    if (r.isDefault) {
      setRooms(prev => prev.filter(x => x.id !== r.id));
      toast.success('Salle supprimée', `${r.name} a été supprimée.`);
      return;
    }
    try {
      await RoomService.delete(r.id);
      setRooms(prev => prev.filter(x => x.id !== r.id));
      toast.success('Salle supprimée', `${r.name} a été supprimée.`);
    } catch {
      toast.error('Erreur', 'Impossible de supprimer cette salle.');
    }
  };

  const toggleEquip = eq => setForm(f => ({
    ...f, equipment: f.equipment.includes(eq)
      ? f.equipment.filter(e => e !== eq)
      : [...f.equipment, eq],
  }));

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim())          e.name     = 'Le nom est obligatoire';
    if (!form.capacity || Number(form.capacity) < 1) e.capacity = 'Capacité ≥ 1';
    if (Object.keys(e).length) { setErrors(e); return; }
    if (modal.mode === 'create') {
      const dup = rooms.find(r => r.name.toLowerCase() === form.name.trim().toLowerCase());
      if (dup) { setErrors({ name: 'Une salle avec ce nom existe déjà' }); return; }
    }
    setErrors({});
    setSaving(true);
    const payload = { name: form.name.trim(), capacity: Number(form.capacity), room_type: form.room_type, equipment: form.equipment, status: form.status };
    try {
      if (modal.mode === 'create') {
        try {
          const created = await RoomService.create(payload);
          setRooms(prev => [created, ...prev]);
        } catch {
          setRooms(prev => [{ ...payload, id: `local-${Date.now()}`, isDefault: true }, ...prev]);
        }
        toast.success('Salle créée', `${form.name} a été ajoutée.`);
      } else {
        const rid = modal.room.id;
        if (modal.room.isDefault) {
          setRooms(prev => prev.map(r => r.id === rid ? { ...r, ...payload } : r));
        } else {
          try {
            const updated = await RoomService.update(rid, payload);
            setRooms(prev => prev.map(r => r.id === rid ? updated : r));
          } catch {
            setRooms(prev => prev.map(r => r.id === rid ? { ...r, ...payload } : r));
          }
        }
        toast.success('Salle mise à jour', 'Les modifications ont été enregistrées.');
      }
      closeModal();
    } catch {
      toast.error('Erreur', 'Impossible d\'enregistrer la salle.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="loader" style={{ margin: '60px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>

      {/* ── En-tête ── */}
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Gestion des salles</h2>
          <p className="text-subtitle">{rooms.length} salles enregistrées</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Ajouter une salle
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid-4">
        {[
          { label: 'Total',       value: stats.total,       bg: '#eff6ff', color: '#1a56db' },
          { label: 'Disponibles', value: stats.available,   bg: '#f0fdf4', color: '#10b981' },
          { label: 'Occupées',    value: stats.occupied,    bg: '#fef2f2', color: '#ef4444' },
          { label: 'Maintenance', value: stats.maintenance, bg: '#fffbeb', color: '#d97706' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <DoorOpen size={20} color={s.color} />
            </div>
            <div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres & Recherche ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une salle…"
            style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: '13px', border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={13} color="#94a3b8" /></button>}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['all', 'Toutes'], ['available', 'Disponibles'], ['occupied', 'Occupées'], ['maintenance', 'Maintenance']].map(([v, l]) => (
            <button key={v} className={`chip ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Grille salles ── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <DoorOpen size={40} />
          <h3>{search ? 'Aucune salle trouvée' : 'Aucune salle enregistrée'}</h3>
          <p>{search ? 'Essayez un autre terme de recherche.' : 'Cliquez sur "Ajouter une salle" pour commencer.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          {filtered.map(room => (
            <RoomCard
              key={room.id} room={room}
              onEdit={openEdit}
              onDelete={askDelete}
              onPlanning={setPlanningRoom}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {planningRoom && <PlanningModal room={planningRoom} onClose={() => setPlanningRoom(null)} />}


      <Modal
        open={modal.open} onClose={closeModal}
        title={modal.mode === 'create' ? 'Ajouter une salle' : `Modifier — ${modal.room?.name}`}
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
            <label className="form-label required">Nom</label>
            <input className="form-input" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Salle 5, Amphi A"
              style={errors.name ? { borderColor: '#ef4444' } : {}} />
            {errors.name && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.name}</span>}
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label required">Capacité</label>
            <input className="form-input" type="number" min="1" value={form.capacity}
              onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
              placeholder="40"
              style={errors.capacity ? { borderColor: '#ef4444' } : {}} />
            {errors.capacity && <span style={{ fontSize: '11px', color: '#ef4444' }}>{errors.capacity}</span>}
          </div>
        </div>
        <div className="grid-2" style={{ gap: '12px', marginTop: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select className="form-select" value={form.room_type}
              onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}>
              {ROOM_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Statut</label>
            <select className="form-select" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="available">Disponible</option>
              <option value="occupied">Occupée</option>
              <option value="maintenance">En maintenance</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginTop: '14px', marginBottom: 0 }}>
          <label className="form-label">Équipements</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
            {EQUIPEMENTS.map(eq => (
              <label key={eq} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '13px', color: '#374151', userSelect: 'none' }}>
                <input type="checkbox"
                  checked={form.equipment.includes(eq)}
                  onChange={() => toggleEquip(eq)}
                  style={{ width: '15px', height: '15px', accentColor: '#1a56db', cursor: 'pointer' }}
                />
                {eq}
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
