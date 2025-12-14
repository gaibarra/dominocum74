import dayjs from 'dayjs';

const toDay = (ts) => (ts ? dayjs(ts) : null);

const getFallbackEnd = (game) => {
  const allHands = (game?.tables || []).flatMap((table) => table?.hands || []);
  const candidates = allHands
    .map((hand) => hand.end_time || hand.updated_at || hand.created_at)
    .filter(Boolean)
    .sort();
  if (candidates.length) {
    return candidates[candidates.length - 1];
  }
  return game?.closed_at || game?.updated_at || game?.date || new Date().toISOString();
};

export const computePlayingAndBenchMinutes = (attendance = [], game = {}) => {
  const fallbackEnd = getFallbackEnd(game);
  const fallbackEndDay = toDay(fallbackEnd);
  const result = new Map();
  const handsByTable = new Map();

  (game?.tables || []).forEach((table) => {
    const hands = (table?.hands || [])
      .map((hand) => ({
        start: toDay(hand.start_time),
        end: toDay(hand.end_time) || fallbackEndDay,
      }))
      .filter((interval) => interval.start && interval.end && interval.end.isAfter(interval.start));
    handsByTable.set(table.id, hands);
  });

  attendance.forEach((record) => {
    const start = toDay(record.check_in_time);
    const end = toDay(record.check_out_time) || fallbackEndDay;
    if (!start || !end || !end.isAfter(start)) return;
    const attendanceMinutes = end.diff(start, 'minute');
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

    const benchMinutes = Math.max(attendanceMinutes - playingMinutes, 0);
    const previous = result.get(record.player_id) || { playingMinutes: 0, benchMinutes: 0, attendanceMinutes: 0 };
    result.set(record.player_id, {
      playingMinutes: previous.playingMinutes + playingMinutes,
      benchMinutes: previous.benchMinutes + benchMinutes,
      attendanceMinutes: previous.attendanceMinutes + attendanceMinutes,
    });
  });

  return result;
};
