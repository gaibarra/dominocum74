import dayjs from 'dayjs';

const toDay = (ts) => (ts ? dayjs(ts) : null);

// Guardrails to prevent runaway durations when there is no check-out
const MAX_GAME_DURATION_MINUTES = 12 * 60; // cap any single velada to 12h for stats

const buildGameWindow = (game) => {
  const allHands = (game?.tables || []).flatMap((table) => table?.hands || []);
  const startCandidates = allHands
    .map((hand) => hand.start_time || hand.created_at)
    .filter(Boolean)
    .sort();
  const endCandidates = allHands
    .map((hand) => hand.end_time || hand.updated_at || hand.created_at)
    .filter(Boolean)
    .sort();

  const fallbackStartTs = game?.date || game?.created_at || game?.updated_at;
  const fallbackEndTs = game?.closed_at || game?.updated_at || fallbackStartTs || new Date().toISOString();

  const windowStart = toDay(startCandidates[0] || fallbackStartTs) || dayjs();
  let windowEnd = toDay(endCandidates[endCandidates.length - 1] || fallbackEndTs) || windowStart;

  if (!windowEnd.isAfter(windowStart)) {
    windowEnd = windowStart.add(4, 'hour');
  }

  const maxEnd = windowStart.add(MAX_GAME_DURATION_MINUTES, 'minute');
  if (windowEnd.isAfter(maxEnd)) {
    windowEnd = maxEnd;
  }

  return { windowStart, windowEnd };
};

export const computePlayingMinutes = (attendance = [], game = {}) => {
  const { windowStart, windowEnd } = buildGameWindow(game);
  const result = new Map();
  const handsByTable = new Map();

  (game?.tables || []).forEach((table) => {
    const hands = (table?.hands || [])
      .map((hand) => {
        const start = toDay(hand.start_time) || windowStart;
        const end = toDay(hand.end_time) || windowEnd;
        const clampedStart = start.isBefore(windowStart) ? windowStart : start;
        const clampedEnd = end.isAfter(windowEnd) ? windowEnd : end;
        return { start: clampedStart, end: clampedEnd };
      })
      .filter((interval) => interval.start && interval.end && interval.end.isAfter(interval.start));
    handsByTable.set(table.id, hands);
  });

  attendance.forEach((record) => {
    let start = toDay(record.check_in_time);
    let end = toDay(record.check_out_time);

    // Clamp to the game window and provide sane fallback when no check-out exists
    if (!start || start.isBefore(windowStart)) start = windowStart;
    if (!end) end = windowEnd;
    if (end.isAfter(windowEnd)) end = windowEnd;
    if (!start || !end || !end.isAfter(start)) return;

    let attendanceMinutes = end.diff(start, 'minute');
    if (attendanceMinutes > MAX_GAME_DURATION_MINUTES) {
      attendanceMinutes = MAX_GAME_DURATION_MINUTES;
    }
    let playingMinutes = 0;

    (game?.tables || []).forEach((table) => {
      const isParticipant = (table?.pairs || []).some((pair) => Array.isArray(pair.players) && pair.players.includes(record.player_id));
      if (!isParticipant) return;
      const handWindows = handsByTable.get(table.id) || [];
      handWindows.forEach((hand) => {
        const overlapStart = hand.start.isAfter(start) ? hand.start : start;
        const overlapEnd = hand.end.isBefore(end) ? hand.end : end;
        if (overlapEnd.isAfter(overlapStart)) {
          playingMinutes += overlapEnd.diff(overlapStart, 'minute');
        }
      });
    });

    if (playingMinutes > attendanceMinutes) {
      playingMinutes = attendanceMinutes;
    }

    const previous = result.get(record.player_id) || { playingMinutes: 0, attendanceMinutes: 0 };
    result.set(record.player_id, {
      playingMinutes: previous.playingMinutes + playingMinutes,
      attendanceMinutes: previous.attendanceMinutes + attendanceMinutes,
    });
  });

  return result;
};
