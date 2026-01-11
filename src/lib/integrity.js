import { computePlayingMinutes } from './gameMutations/attendance';

const numberOrZero = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const hashString = (input) => {
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
};

const encodeHash = (hash) => hash.toString(36).toUpperCase().padStart(6, '0');

export const generateControlCode = (rawSource) => {
  const source = (rawSource ?? '').toString();
  if (!source) return 'SIN-DATO';
  const forward = hashString(source);
  const backward = hashString([...source].reverse().join(''));
  return `${encodeHash(forward)}-${encodeHash(backward)}`;
};

export const buildGameControlFigures = (game = {}, attendance = []) => {
  const tables = Array.isArray(game?.tables) ? game.tables.filter(Boolean) : [];
  const totalTables = tables.length;
  const finishedTables = tables.filter((table) => !!(table?.partidaFinished ?? table?.partida_finished)).length;
  const cancelledTables = tables.filter((table) => Boolean(table?.cancelled_at || table?.canceled_at || table?.cancelledAt)).length;
  const activeTables = tables.filter((table) => {
    const isFinished = table?.partidaFinished ?? table?.partida_finished;
    const isCancelled = Boolean(table?.cancelled_at || table?.canceled_at || table?.cancelledAt);
    const hasHands = Array.isArray(table?.hands) && table.hands.length > 0;
    return !isFinished && !isCancelled && hasHands;
  }).length;

  let totalHands = 0;
  let totalPoints = 0;
  let partidasDeclaradas = 0;
  const uniquePlayers = new Set();

  tables.forEach((table) => {
    const hands = Array.isArray(table?.hands) ? table.hands : [];
    totalHands += hands.length;
    hands.forEach((hand) => {
      totalPoints += numberOrZero(hand?.pair_1_score) + numberOrZero(hand?.pair_2_score);
    });
    partidasDeclaradas += numberOrZero(table?.games_won_pair1) + numberOrZero(table?.games_won_pair2);
    (table?.pairs || []).forEach((pair) => {
      (pair?.players || []).forEach((playerId) => {
        if (playerId !== null && playerId !== undefined && playerId !== '') {
          uniquePlayers.add(String(playerId));
        }
      });
    });
  });

  const attendanceArray = Array.isArray(attendance) ? attendance : [];
  const playingMap = computePlayingMinutes(attendanceArray, game);
  let totalAttendanceMinutes = 0;
  let totalPlayingMinutes = 0;
  playingMap.forEach((value) => {
    totalPlayingMinutes += numberOrZero(value?.playingMinutes);
    totalAttendanceMinutes += numberOrZero(value?.attendanceMinutes);
  });

  const digestParts = [
    game?.id || 'game',
    totalTables,
    finishedTables,
    cancelledTables,
    activeTables,
    totalHands,
    partidasDeclaradas,
    uniquePlayers.size,
    Math.round(totalPoints),
    Math.round(totalAttendanceMinutes),
    Math.round(totalPlayingMinutes),
  ];

  return {
    totalTables,
    finishedTables,
    cancelledTables,
    activeTables,
    totalHands,
    partidasRegistradas: partidasDeclaradas,
    uniquePlayers: uniquePlayers.size,
    totalPoints,
    totalAttendanceMinutes,
    totalPlayingMinutes,
    controlCode: generateControlCode(digestParts.join('|')),
    attendanceCaptured: attendanceArray.length > 0,
  };
};

export const buildStatsControlFigures = (stats = {}) => {
  const players = Array.isArray(stats?.players) ? stats.players : [];
  const totals = stats?.totals || {};
  const totalGames = numberOrZero(totals.totalGames);
  const totalHands = numberOrZero(totals.totalHands);
  const totalWins = players.reduce((sum, player) => sum + numberOrZero(player?.wins), 0);
  const totalPoints = players.reduce((sum, player) => sum + numberOrZero(player?.totalPoints), 0);
  const totalMinutesPlaying = players.reduce((sum, player) => sum + numberOrZero(player?.minutesPlaying), 0);
  const totalMinutesPresent = players.reduce((sum, player) => sum + numberOrZero(player?.minutesPlayed), 0);

  const digestParts = [
    totalGames,
    totalHands,
    players.length,
    totalWins,
    Math.round(totalPoints),
    Math.round(totalMinutesPlaying),
    Math.round(totalMinutesPresent),
  ];

  return {
    totalGames,
    totalHands,
    totalWins,
    totalPoints,
    totalMinutesPlaying,
    totalMinutesPresent,
    playersTracked: players.length,
    controlCode: generateControlCode(digestParts.join('|')),
  };
};
