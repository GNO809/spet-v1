// ============================================================
// SPET — Conflict Checker (source unique anti-conflit)
// ============================================================

export const VALID_SLOTS = [
  { label: '08h – 10h', start: '08:00', end: '10:00' },
  { label: '10h – 12h', start: '10:00', end: '12:00' },
  { label: '15h – 17h', start: '15:00', end: '17:00' },
  { label: '17h – 19h', start: '17:00', end: '19:00' },
];

export const GRID_HOURS = ['08:00','09:00','10:00','11:00','12:00','15:00','16:00','17:00','18:00','19:00'];
export const PAUSE_START = '12:00';
export const PAUSE_END   = '15:00';
export const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

function toMins(t = '00:00') {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

// 'S1','S3','S5','S7','S9' → 1  |  'S2','S4','S6','S8','S10' → 2
function chronoPeriod(sem) {
  const n = parseInt((sem || 'S1').replace('S', ''), 10);
  return n % 2 === 1 ? 1 : 2;
}

export function overlaps(s1, e1, s2, e2) {
  return toMins(s1) < toMins(e2) && toMins(s2) < toMins(e1);
}

export function isLunchBlock(start, end) {
  return overlaps(start, end, PAUSE_START, PAUSE_END);
}

/**
 * Check if a proposed session conflicts with existing sessions.
 * @param {{ day, start, end, roomId, teacherId, groupId }} proposed
 * @param {Array} sessions – sessions to check against
 * @param {string|null} excludeId – session ID to skip (editing)
 * @param {string|null} currentSemestre – 'S1' or 'S2' (odd/even period); filters cross-filière sessions
 * @returns {Array<{ type, message, session? }>}
 */
export function checkConflicts(proposed, sessions, excludeId = null, currentSemestre = null) {
  const errors = [];

  if (isLunchBlock(proposed.start, proposed.end)) {
    errors.push({ type: 'PAUSE', message: 'Ce créneau chevauche la pause déjeuner (12h–15h) — non autorisé.' });
  }

  const period = currentSemestre ? chronoPeriod(currentSemestre) : null;

  const sameDay = (sessions || []).filter(s => {
    if (s.id === excludeId) return false;
    if (s.day !== proposed.day) return false;
    // Only compare sessions in the same chronological period (odd semesters run together, even together)
    if (period !== null && s.semestre) return chronoPeriod(s.semestre) === period;
    return true;
  });

  for (const s of sameDay) {
    if (!overlaps(proposed.start, proposed.end, s.start, s.end)) continue;

    if (proposed.roomId && s.roomId && String(proposed.roomId) === String(s.roomId)) {
      errors.push({
        type: 'ROOM_OVERLAP',
        message: `Salle déjà occupée par "${s.course}" (${s.start}–${s.end}).`,
        session: s,
      });
    }
    if (proposed.teacherId && s.teacherId && String(proposed.teacherId) === String(s.teacherId)) {
      errors.push({
        type: 'TEACHER_OVERLAP',
        message: `Enseignant déjà pris pour "${s.course}" (${s.start}–${s.end}).`,
        session: s,
      });
    }
    if (proposed.groupId && s.groupId && String(proposed.groupId) === String(s.groupId)) {
      errors.push({
        type: 'GROUP_OVERLAP',
        message: `Groupe déjà en cours pour "${s.course}" (${s.start}–${s.end}).`,
        session: s,
      });
    }
  }

  return errors;
}

/**
 * Build a teacher's weekly availability map from all sessions.
 * @param {string|null} currentSemestre – 'S1' or 'S2'; only sessions in same period are shown as busy
 * Returns: { day: { slotStart: 'free'|'self'|'other' } }
 */
export function buildTeacherMap(teacherId, allSessions, currentTimetableId, currentSemestre = null) {
  const map = {};
  DAYS.forEach(d => {
    map[d] = {};
    VALID_SLOTS.forEach(sl => { map[d][sl.start] = 'free'; });
  });

  const period = currentSemestre ? chronoPeriod(currentSemestre) : null;

  (allSessions || []).forEach(s => {
    if (!s.teacherId || String(s.teacherId) !== String(teacherId)) return;
    if (period !== null && s.semestre && chronoPeriod(s.semestre) !== period) return;
    VALID_SLOTS.forEach(sl => {
      if (s.day && map[s.day] && overlaps(sl.start, sl.end, s.start, s.end)) {
        map[s.day][sl.start] = String(s.timetableId) === String(currentTimetableId) ? 'self' : 'other';
      }
    });
  });
  return map;
}

/**
 * Build a room's weekly availability map from all sessions.
 * @param {string|null} currentSemestre – 'S1' or 'S2'; only sessions in same period are shown as busy
 * Returns: { day: { slotStart: { status: 'free'|'self'|'other', detail: string } } }
 */
export function buildRoomMap(roomId, allSessions, currentTimetableId, currentSemestre = null) {
  const map = {};
  DAYS.forEach(d => {
    map[d] = {};
    VALID_SLOTS.forEach(sl => { map[d][sl.start] = { status: 'free', detail: '' }; });
  });

  const period = currentSemestre ? chronoPeriod(currentSemestre) : null;

  (allSessions || []).forEach(s => {
    if (!s.roomId || String(s.roomId) !== String(roomId)) return;
    if (period !== null && s.semestre && chronoPeriod(s.semestre) !== period) return;
    VALID_SLOTS.forEach(sl => {
      if (s.day && map[s.day] && overlaps(sl.start, sl.end, s.start, s.end)) {
        map[s.day][sl.start] = {
          status: String(s.timetableId) === String(currentTimetableId) ? 'self' : 'other',
          detail: `${s.course}${s.group ? ' · ' + s.group : ''}`,
        };
      }
    });
  });
  return map;
}
