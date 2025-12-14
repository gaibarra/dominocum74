import { query } from '../db/pool.js';
import { computePlayingAndBenchMinutes } from '../utils/attendance.js';

const rowsToMap = (rows, key) => {
  const map = new Map();
  rows.forEach((row) => {
    const value = row[key];
    if (!value) return;
    if (!map.has(value)) {
      map.set(value, []);
    }
    map.get(value).push(row);
  });
  return map;
};

const sortAsc = (prop) => (a, b) => {
  const av = a[prop];
  const bv = b[prop];
  if (av === bv) return 0;
  return av < bv ? -1 : 1;
};

const toNumber = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : Number(value) || 0);

const handDurationSeconds = (hand) => {
  if (typeof hand?.duration_seconds === 'number' && !Number.isNaN(hand.duration_seconds)) {
    return Math.max(hand.duration_seconds, 0);
  }
  const start = hand?.start_time ? Date.parse(hand.start_time) : NaN;
  const end = hand?.end_time ? Date.parse(hand.end_time) : NaN;
  if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
    return Math.floor((end - start) / 1000);
  }
  return 0;
};

const ensurePlayerStat = (statsMap, playersById, playerId) => {
  if (!playerId) return null;
  if (!statsMap.has(playerId)) {
    const info = playersById.get(playerId) || {};
    statsMap.set(playerId, {
      id: playerId,
      name: info.name || 'Jugador',
      nickname: info.nickname || 'Sin registro',
      photo: info.photo || '',
      gamesPlayed: 0,
      wins: 0,
      handsPlayed: 0,
      minutesPlayed: 0,
      minutesPlaying: 0,
      minutesBench: 0,
      totalPoints: 0,
      playingSecondsFromHands: 0,
    });
  }
  return statsMap.get(playerId);
};

const ensurePairKey = (playerIds) => {
  const filtered = (playerIds || []).filter(Boolean).map(String);
  if (filtered.length < 2) return null;
  return filtered.sort().join('-');
};

export const fetchStatsOverview = async () => {
  const [{ rows: players }, { rows: games }] = await Promise.all([
    query('SELECT id, name, nickname, photo FROM players ORDER BY nickname ASC'),
    query('SELECT id, date, summary, location_name, location_details, status, closed_at, created_at, updated_at FROM games ORDER BY date DESC'),
  ]);

  if (!games.length) {
    const emptyPlayers = players.map((p) => ({
      id: p.id,
      name: p.name,
      nickname: p.nickname,
      photo: p.photo,
      gamesPlayed: 0,
      wins: 0,
      handsPlayed: 0,
      minutesPlayed: 0,
      minutesPlaying: 0,
      minutesBench: 0,
      totalPoints: 0,
      pointsPerGame: 0,
      winRate: 0,
    }));
    return {
      totals: { totalGames: 0, totalHands: 0 },
      players: emptyPlayers,
      pairs: [],
    };
  }

  const playersById = new Map(players.map((p) => [p.id, p]));
  const gameIds = games.map((g) => g.id);

  const tablesResult = await query('SELECT * FROM game_tables WHERE game_id = ANY($1::uuid[])', [gameIds]);
  const tables = tablesResult.rows;
  const tableIds = tables.map((t) => t.id);

  const pairs = tableIds.length
    ? (await query('SELECT * FROM game_pairs WHERE game_table_id = ANY($1::uuid[]) ORDER BY created_at ASC', [tableIds])).rows
    : [];
  const pairIds = pairs.map((p) => p.id);

  const pairPlayers = pairIds.length
    ? (await query('SELECT game_pair_id, player_id FROM game_pair_players WHERE game_pair_id = ANY($1::uuid[])', [pairIds])).rows
    : [];

  const hands = tableIds.length
    ? (await query('SELECT * FROM game_hands WHERE game_table_id = ANY($1::uuid[]) ORDER BY hand_number ASC', [tableIds])).rows
    : [];

  const attendance = (await query('SELECT * FROM game_attendance WHERE game_id = ANY($1::uuid[])', [gameIds])).rows;
  const snapshots = (await query('SELECT * FROM game_partida_snapshots WHERE game_id = ANY($1::uuid[])', [gameIds])).rows;

  const partidas = tableIds.length
    ? (await query('SELECT id, game_id, game_table_id, partida_index, winner_pair_index FROM game_partidas WHERE game_id = ANY($1::uuid[])', [gameIds])).rows
    : [];

  const tablesByGame = rowsToMap(tables, 'game_id');
  const pairsByTable = rowsToMap(pairs, 'game_table_id');
  const pairPlayersByPair = rowsToMap(pairPlayers, 'game_pair_id');
  const handsByTable = rowsToMap(hands, 'game_table_id');
  const handsByPartida = rowsToMap(hands.filter((hand) => hand.partida_id), 'partida_id');
  const attendanceByGame = rowsToMap(attendance, 'game_id');
  const snapshotsByGame = rowsToMap(snapshots, 'game_id');
  const snapshotsByTable = rowsToMap(snapshots, 'game_table_id');
  const partidaMetaByKey = new Map();
  partidas.forEach((row) => {
    const key = `${row.game_id}:${row.game_table_id}:${row.partida_index}`;
    partidaMetaByKey.set(key, row);
  });

  const gamesDetailed = games.map((game) => ({
    ...game,
    tables: (tablesByGame.get(game.id) || [])
      .sort(sortAsc('table_number'))
      .map((table) => ({
        ...table,
        pairs: (pairsByTable.get(table.id) || [])
          .sort(sortAsc('created_at'))
          .map((pair, idx) => ({
            ...pair,
            pair_index: idx + 1,
            players: (pairPlayersByPair.get(pair.id) || []).map((pp) => pp.player_id),
          })),
        hands: (handsByTable.get(table.id) || []).sort(sortAsc('hand_number')),
      })),
  }));

  const playerStats = new Map();
  players.forEach((p) => ensurePlayerStat(playerStats, playersById, p.id));
  const pairStats = new Map();

  let totalHands = 0;
  let totalPartidas = 0;

  gamesDetailed.forEach((game) => {
    (game.tables || []).forEach((table) => {
      const handsForTable = table.hands || [];
      totalHands += handsForTable.length;
      const partidasTerminadas = toNumber(table.games_won_pair1) + toNumber(table.games_won_pair2);
      const hayPartidaEnCurso = !table.partida_finished && handsForTable.length > 0 ? 1 : 0;
      totalPartidas += partidasTerminadas + hayPartidaEnCurso;

      const hasSnapshots = (snapshotsByTable.get(table.id) || []).length > 0;
      const shouldUseLiveCounters = !hasSnapshots || !table.partida_finished;

      if (shouldUseLiveCounters) {
        const pair1Players = table.pairs?.[0]?.players?.filter(Boolean) || [];
        const pair2Players = table.pairs?.[1]?.players?.filter(Boolean) || [];
        const uniquePlayers = Array.from(new Set([...pair1Players, ...pair2Players]));
        const pair1Points = handsForTable.reduce((sum, hand) => sum + toNumber(hand.pair_1_score), 0);
        const pair2Points = handsForTable.reduce((sum, hand) => sum + toNumber(hand.pair_2_score), 0);
        const tableHandSeconds = handsForTable.reduce((sum, hand) => sum + handDurationSeconds(hand), 0);

        uniquePlayers.forEach((playerId) => {
          const stat = ensurePlayerStat(playerStats, playersById, playerId);
          if (!stat) return;
          stat.gamesPlayed += partidasTerminadas + hayPartidaEnCurso;
          stat.handsPlayed += handsForTable.length;
          stat.playingSecondsFromHands += tableHandSeconds;
        });

        pair1Players.forEach((playerId) => {
          const stat = ensurePlayerStat(playerStats, playersById, playerId);
          if (!stat) return;
          stat.wins += toNumber(table.games_won_pair1);
          stat.totalPoints += pair1Points;
        });
        pair2Players.forEach((playerId) => {
          const stat = ensurePlayerStat(playerStats, playersById, playerId);
          if (!stat) return;
          stat.wins += toNumber(table.games_won_pair2);
          stat.totalPoints += pair2Points;
        });

        const addPairStat = (playerIds, wins, points) => {
          const key = ensurePairKey(playerIds);
          if (!key) return;
          if (!pairStats.has(key)) {
            pairStats.set(key, {
              key,
              playerIds: playerIds.filter(Boolean).map(String).sort(),
              gamesPlayed: 0,
              wins: 0,
              totalPoints: 0,
            });
          }
          const entry = pairStats.get(key);
          entry.gamesPlayed += partidasTerminadas + hayPartidaEnCurso;
          entry.wins += wins;
          entry.totalPoints += points;
        };

        addPairStat(pair1Players, toNumber(table.games_won_pair1), pair1Points);
        addPairStat(pair2Players, toNumber(table.games_won_pair2), pair2Points);
      }
    });

    const attendanceRecords = attendanceByGame.get(game.id) || [];
    if (attendanceRecords.length) {
      const splitMap = computePlayingAndBenchMinutes(attendanceRecords, game);
      splitMap.forEach((value, playerId) => {
        const stat = ensurePlayerStat(playerStats, playersById, playerId);
        if (!stat) return;
        stat.minutesPlayed += value.attendanceMinutes;
        stat.minutesPlaying += value.playingMinutes;
        stat.minutesBench += value.benchMinutes;
      });
    }
  });

  snapshots.forEach((snapshot) => {
    const pairPlayersList = [snapshot.player1_id, snapshot.player2_id].filter(Boolean);
    if (!pairPlayersList.length) return;
    const partidaKey = `${snapshot.game_id}:${snapshot.game_table_id}:${snapshot.partida_index}`;
    const partidaMeta = partidaMetaByKey.get(partidaKey);
    const handCount = partidaMeta?.id ? (handsByPartida.get(partidaMeta.id) || []).length : 0;

    pairPlayersList.forEach((playerId) => {
      const stat = ensurePlayerStat(playerStats, playersById, playerId);
      if (!stat) return;
      stat.gamesPlayed += 1;
      stat.handsPlayed += handCount;
      stat.totalPoints += toNumber(snapshot.points);
      if (partidaMeta?.winner_pair_index && partidaMeta.winner_pair_index === snapshot.pair_index) {
        stat.wins += 1;
      }
    });

    const pairKey = ensurePairKey(pairPlayersList);
    if (pairKey) {
      if (!pairStats.has(pairKey)) {
        pairStats.set(pairKey, {
          key: pairKey,
          playerIds: pairPlayersList.map(String).sort(),
          gamesPlayed: 0,
          wins: 0,
          totalPoints: 0,
        });
      }
      const entry = pairStats.get(pairKey);
      entry.gamesPlayed += 1;
      entry.totalPoints += toNumber(snapshot.points);
      if (partidaMeta?.winner_pair_index && partidaMeta.winner_pair_index === snapshot.pair_index) {
        entry.wins += 1;
      }
    }
  });

  const finalizedPlayerStats = Array.from(playerStats.values()).map((stat) => {
    const fallbackPlayingMinutes = Math.round((stat.playingSecondsFromHands || 0) / 60);
    if (fallbackPlayingMinutes > stat.minutesPlaying) {
      stat.minutesPlaying = fallbackPlayingMinutes;
    }
    if (stat.minutesPlayed < stat.minutesPlaying) {
      stat.minutesPlayed = stat.minutesPlaying;
    }
    stat.minutesBench = Math.max(stat.minutesPlayed - stat.minutesPlaying, 0);
    stat.pointsPerGame = stat.gamesPlayed ? Number((stat.totalPoints / stat.gamesPlayed).toFixed(1)) : 0;
    stat.winRate = stat.gamesPlayed ? Number(((stat.wins / stat.gamesPlayed) * 100).toFixed(1)) : 0;
    delete stat.playingSecondsFromHands;
    return stat;
  });

  const sortedPlayerStats = finalizedPlayerStats
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.nickname.localeCompare(b.nickname);
    });

  const pairStatsArray = Array.from(pairStats.values()).map((pair) => ({
    playerIds: pair.playerIds,
    gamesPlayed: pair.gamesPlayed,
    wins: pair.wins,
    totalPoints: pair.totalPoints,
    winRate: pair.gamesPlayed ? Number(((pair.wins / pair.gamesPlayed) * 100).toFixed(1)) : 0,
    pointsPerGame: pair.gamesPlayed ? Number((pair.totalPoints / pair.gamesPlayed).toFixed(1)) : 0,
  }));
  pairStatsArray.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
    return b.totalPoints - a.totalPoints;
  });

  return {
    totals: {
      totalGames: totalPartidas,
      totalHands,
    },
    players: sortedPlayerStats,
    pairs: pairStatsArray,
  };
};
