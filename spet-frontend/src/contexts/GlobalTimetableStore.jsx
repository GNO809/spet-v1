// ============================================================
// SPET — Global Timetable Store
// Source de vérité unique pour toutes les séances de tous les chefs
// Permet la détection de conflits inter-filières en temps réel
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react';
import { TIME_SLOTS } from '@/utils/constants';

const GlobalTimetableStoreContext = createContext(null);

export function GlobalTimetableStoreProvider({ children }) {
  const [sessions, setSessions] = useState([]);

  const addSession = useCallback((session) => {
    setSessions(prev => [...prev, { ...session, id: `s-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  }, []);

  const addSessions = useCallback((newSessions) => {
    setSessions(prev => [...prev, ...newSessions]);
  }, []);

  const removeSession = useCallback((sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const updateSession = useCallback((sessionId, updates) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  }, []);

  const removeSessionsByNiveau = useCallback((niveauId) => {
    setSessions(prev => prev.filter(s => s.niveauId !== niveauId));
  }, []);

  // Vérification conflit de salle (toutes filières confondues)
  const hasRoomConflict = useCallback((day, slotId, roomId, excludeId = null) => {
    return sessions.some(s =>
      s.day === day && s.slotId === slotId && s.roomId === roomId && s.id !== excludeId
    );
  }, [sessions]);

  // Vérification conflit enseignant (toutes filières confondues)
  const hasTeacherConflict = useCallback((day, slotId, teacherId, excludeId = null) => {
    if (!teacherId) return false;
    return sessions.some(s =>
      s.day === day && s.slotId === slotId && s.teacherId === teacherId && s.id !== excludeId
    );
  }, [sessions]);

  // Récupère ce qui occupe une salle à un créneau donné
  const getRoomOccupant = useCallback((day, slotId, roomId) => {
    return sessions.find(s => s.day === day && s.slotId === slotId && s.roomId === roomId) || null;
  }, [sessions]);

  // Planning complet d'un enseignant
  const getTeacherSchedule = useCallback((teacherId) => {
    return sessions.filter(s => s.teacherId === teacherId);
  }, [sessions]);

  // Taux d'occupation d'une salle (toutes filières, toute la semaine)
  const getRoomOccupancyRate = useCallback((roomId) => {
    const totalSlots = 6 * TIME_SLOTS.length; // 6 jours × 4 créneaux actifs
    const used = sessions.filter(s => s.roomId === roomId).length;
    return Math.min(100, Math.round((used / totalSlots) * 100));
  }, [sessions]);

  // Séances d'un niveau donné
  const getSessionsByNiveau = useCallback((niveauId) => {
    return sessions.filter(s => s.niveauId === niveauId);
  }, [sessions]);

  // Détail des conflits d'une séance candidate
  const getConflictDetails = useCallback((day, slotId, roomId, teacherId, excludeId = null) => {
    const conflicts = [];
    sessions.forEach(s => {
      if (s.id === excludeId) return;
      if (s.day !== day || s.slotId !== slotId) return;
      if (s.roomId === roomId) {
        conflicts.push({
          type: 'SALLE',
          message: `${s.roomName} occupée par ${s.niveauId} – ${s.courseCode} (${s.type}) · ${s.groupId || 'Tous groupes'}`,
        });
      }
      if (teacherId && s.teacherId === teacherId) {
        conflicts.push({
          type: 'ENSEIGNANT',
          message: `${s.teacherName} déjà placé en ${s.niveauId} – ${s.courseCode} (${s.type}) · ${s.roomName}`,
        });
      }
    });
    return conflicts;
  }, [sessions]);

  return (
    <GlobalTimetableStoreContext.Provider value={{
      sessions,
      addSession,
      addSessions,
      removeSession,
      updateSession,
      removeSessionsByNiveau,
      hasRoomConflict,
      hasTeacherConflict,
      getRoomOccupant,
      getTeacherSchedule,
      getRoomOccupancyRate,
      getSessionsByNiveau,
      getConflictDetails,
    }}>
      {children}
    </GlobalTimetableStoreContext.Provider>
  );
}

export function useGlobalStore() {
  const ctx = useContext(GlobalTimetableStoreContext);
  if (!ctx) throw new Error('useGlobalStore must be used inside GlobalTimetableStoreProvider');
  return ctx;
}
