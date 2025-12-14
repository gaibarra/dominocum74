import { apiClient } from '../apiClient';
import dayjs from 'dayjs';

const CLOSED_STATUSES = new Set(['finalizado', 'finalizada', 'cerrado', 'cerrada', 'terminado', 'terminada', 'completado', 'completada']);

const looksClosed = (game) => {
  if (!game) return false;
  if (game.closed_at) return true;
  const normalized = (game.status || '').toString().trim().toLowerCase();
  return CLOSED_STATUSES.has(normalized);
};

export const getAttendanceByGame = async (gameId) => {
  try {
    const data = await apiClient.get(`/games/${gameId}/attendance`);
    return data || [];
  } catch (error) {
    console.warn('Attendance fetch error:', error.message);
    return [];
  }
};

export const checkInPlayer = async (gameId, playerId, when = new Date().toISOString()) => {
  return apiClient.post(`/games/${gameId}/attendance/check-in`, { playerId, timestamp: when });
};

export const checkOutPlayer = async (gameId, playerId, when = new Date().toISOString()) => {
  return apiClient.post(`/games/${gameId}/attendance/check-out`, { playerId, timestamp: when });
};

export const backfillMissingCheckoutsForGame = async (game) => {
  if (!game?.id) return { updated: 0 };
  try {
    const attendance = await getAttendanceByGame(game.id);
    const hasMissing = attendance.some((a) => a.check_in_time && !a.check_out_time);
    const gameClosed = looksClosed(game);
    const isOlderThanTwelveHours = game?.date ? dayjs().diff(dayjs(game.date), 'hour') >= 12 : false;
    if (!hasMissing || (!gameClosed && !isOlderThanTwelveHours)) {
      return { updated: 0 };
    }
    return await apiClient.post(`/games/${game.id}/attendance/backfill`, {});
  } catch (e) {
    console.warn('Backfill checkouts skipped:', e.message);
    return { updated: 0 };
  }
};

export const computeAttendanceDurations = (attendance, fallbackEnd) => {
  // returns map playerId -> minutes
  const map = new Map();
  attendance.forEach(a => {
    const start = a.check_in_time ? dayjs(a.check_in_time) : null;
    let end = a.check_out_time ? dayjs(a.check_out_time) : null;
    if (!end && fallbackEnd) end = dayjs(fallbackEnd);
    if (start && end && end.isAfter(start)) {
      const mins = end.diff(start, 'minute');
      map.set(a.player_id, (map.get(a.player_id) || 0) + mins);
    }
  });
  return map;
};

export const computePlayingAndBenchMinutes = (attendance, game) => {
  // For each player: playingMinutes = sum of overlap between their attendance interval and each hand they played; benchMinutes = attendanceMinutes - playingMinutes
  // Build fallback end
  const allHands = (game.tables || []).flatMap(t => t.hands || []);
  const fallbackEnd = allHands
    .map(h => h.end_time || h.updated_at || h.created_at)
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || game.updated_at || game.date || new Date().toISOString();

  const toDay = (ts) => (ts ? dayjs(ts) : null);
  const handsByTable = new Map();
  (game.tables || []).forEach(t => {
    const hands = (t.hands || []).map(h => ({ start: toDay(h.start_time), end: toDay(h.end_time) || toDay(fallbackEnd) })).filter(h => h.start && h.end && h.end.isAfter(h.start));
    handsByTable.set(t.id, hands);
  });

  const result = new Map(); // playerId -> { playingMinutes, benchMinutes, attendanceMinutes }

  attendance.forEach(a => {
    const start = toDay(a.check_in_time);
    const end = toDay(a.check_out_time) || toDay(fallbackEnd);
    if (!start || !end || !end.isAfter(start)) return;
    const attMins = end.diff(start, 'minute');

    let playing = 0;
    // Find tables where player participates
    (game.tables || []).forEach(t => {
      const isInPair = (t.pairs || []).some(pair => Array.isArray(pair.players) && pair.players.includes(a.player_id));
      if (!isInPair) return;
      const hands = handsByTable.get(t.id) || [];
      hands.forEach(h => {
        const s = h.start.isAfter(start) ? h.start : start;
        const e = h.end.isBefore(end) ? h.end : end;
        if (e.isAfter(s)) playing += e.diff(s, 'minute');
      });
    });

    const bench = Math.max(attMins - playing, 0);
    result.set(a.player_id, {
      playingMinutes: (result.get(a.player_id)?.playingMinutes || 0) + playing,
      benchMinutes: (result.get(a.player_id)?.benchMinutes || 0) + bench,
      attendanceMinutes: (result.get(a.player_id)?.attendanceMinutes || 0) + attMins,
    });
  });

  return result;
};
