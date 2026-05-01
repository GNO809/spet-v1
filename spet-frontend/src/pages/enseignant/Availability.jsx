// ============================================================
// SPET — Enseignant: Availability Management
// ============================================================

import { useState, useEffect } from 'react';
import { Save, Info, Clock } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { DAYS, TIME_SLOTS } from '@/utils/constants';
import UserService from '@/services/user.service';

const buildEmpty = () => {
  const obj = {};
  DAYS.forEach(d => { obj[d] = []; });
  return obj;
};

const VALID_SLOT_KEYS = new Set(TIME_SLOTS.map(s => `${s.start}-${s.end}`));

function slotDurationH(key) {
  const [start, end] = key.split('-');
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - sh * 60 - sm) / 60;
}

/** Convertit [{day, start_time, end_time}] → {Lundi: ['08:00-10:00', ...], ...} */
function apiToGrid(slots) {
  const grid = buildEmpty();
  slots.forEach(s => {
    const key = `${s.start_time.slice(0,5)}-${s.end_time.slice(0,5)}`;
    if (grid[s.day] && VALID_SLOT_KEYS.has(key)) grid[s.day].push(key);
  });
  return grid;
}

/** Convertit {Lundi: ['07:30-09:00',...]} → [{day, start_time, end_time}] */
function gridToApi(avail) {
  const slots = [];
  Object.entries(avail).forEach(([day, keys]) => {
    keys.forEach(key => {
      const [start, end] = key.split('-');
      slots.push({ day, start_time: start + ':00', end_time: end + ':00' });
    });
  });
  return slots;
}

export default function Availability() {
  const [avail,   setAvail]   = useState(buildEmpty());
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useNotification();

  useEffect(() => {
    UserService.getMyAvailabilities()
      .then(slots => setAvail(apiToGrid(slots)))
      .catch(() => toast.error('Erreur', 'Impossible de charger vos disponibilités.'))
      .finally(() => setLoading(false));
  }, []);

  const slotKey = (slot) => `${slot.start}-${slot.end}`;

  const toggle = (day, slot) => {
    const key = slotKey(slot);
    setAvail(prev => {
      const daySlots = prev[day] || [];
      const has = daySlots.includes(key);
      return { ...prev, [day]: has ? daySlots.filter(s => s !== key) : [...daySlots, key] };
    });
  };

  const isActive = (day, slot) => (avail[day] || []).includes(slotKey(slot));

  const totalSlots = Object.values(avail).reduce((s, a) => s + a.length, 0);
  const totalHours = Object.values(avail).flat().reduce((s, key) => s + slotDurationH(key), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await UserService.setAvailabilities(gridToApi(avail));
      toast.success('Disponibilités enregistrées', 'Vos disponibilités ont été mises à jour avec succès.');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur lors de l\'enregistrement.';
      toast.error('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  const selectAll = (day) => setAvail(prev => ({ ...prev, [day]: TIME_SLOTS.map(slotKey) }));
  const clearDay  = (day) => setAvail(prev => ({ ...prev, [day]: [] }));

  if (loading) return <div className="loader" style={{ margin: '40px auto' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h2 className="text-page-title">Mes disponibilités</h2>
          <p className="text-subtitle">Indiquez vos créneaux disponibles pour ce semestre</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : <><Save size={14} /> Enregistrer</>}
        </button>
      </div>

      <div className="alert alert-info">
        <Info size={16} style={{ flexShrink: 0 }} />
        <span>Cliquez sur les créneaux en vert pour indiquer vos disponibilités. Ces informations seront utilisées pour la génération automatique des emplois du temps.</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Clock size={15} color="#64748b" />
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          <strong style={{ color: '#1e293b' }}>{totalSlots}</strong> créneaux sélectionnés
          · <strong style={{ color: '#1e293b' }}>{totalHours}h</strong> de disponibilité
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '700px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', gap: '4px', marginBottom: '4px' }}>
            <div style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Créneau</div>
            {DAYS.map(day => (
              <div key={day} style={{ textAlign: 'center' }}>
                <div style={{ padding: '8px', fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>{day}</div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={() => selectAll(day)}>Tout</button>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '10px', padding: '2px 8px' }} onClick={() => clearDay(day)}>Aucun</button>
                </div>
              </div>
            ))}
          </div>
          {TIME_SLOTS.map(slot => (
            <div key={slot.label} style={{ display: 'grid', gridTemplateColumns: '100px repeat(6, 1fr)', gap: '4px', marginBottom: '4px' }}>
              <div style={{ padding: '10px 6px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center', fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 600 }}>{slot.start}</span>
                <span style={{ opacity: 0.6 }}>→ {slot.end}</span>
              </div>
              {DAYS.map(day => {
                const active = isActive(day, slot);
                return (
                  <button key={day} onClick={() => toggle(day, slot)} style={{ height: '52px', borderRadius: '8px', border: `2px solid ${active ? '#10b981' : '#e2e8f0'}`, background: active ? '#dcfce7' : '#f8fafc', cursor: 'pointer', transition: 'all 0.15s ease', fontSize: '18px' }} title={`${day} ${slot.label}`}>
                    {active ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#64748b' }}>Légende :</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
          <span style={{ width: '16px', height: '16px', background: '#dcfce7', border: '2px solid #10b981', borderRadius: '4px', display: 'inline-block' }} /> Disponible
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
          <span style={{ width: '16px', height: '16px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '4px', display: 'inline-block' }} /> Non disponible
        </span>
      </div>
    </div>
  );
}
