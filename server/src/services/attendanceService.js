import { withTransaction, query } from '../db/pool.js';
import { nowUTC, convertToUTC } from '../utils/dates.js';
import { badRequestError, conflictError, notFoundError } from '../utils/httpErrors.js';

const CLOSED_STATUSES = new Set(['finalizada', 'finalizado', 'cancelada', 'cancelado', 'cerrada', 'cerrado']);

const normalizeStatus = (value) => (value ? value.toString().trim().toLowerCase() : '');

const fetchGameMeta = async (client, gameId, { forUpdate = false } = {}) => {
  const sql = `SELECT id, status, closed_at, updated_at, date FROM games WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`;
  const { rows } = await client.query(sql, [gameId]);
  return rows[0] || null;
};

const assertGameExists = (game) => {
  if (!game) {
    throw notFoundError('La velada no existe.');
  }
};

const assertGameAllowsAttendance = (game) => {
  const normalized = normalizeStatus(game.status);
  if (CLOSED_STATUSES.has(normalized)) {
    throw conflictError('La velada está cerrada y no admite cambios de asistencia.');
  }
};

const loadActiveSeatedPlayerIds = async (gameId) => {
  const { rows } = await query(
    `SELECT DISTINCT gpp.player_id
     FROM game_tables gt
     JOIN game_pairs gp ON gp.game_table_id = gt.id
     JOIN game_pair_players gpp ON gpp.game_pair_id = gp.id
     WHERE gt.game_id = $1 AND COALESCE(gt.partida_finished, false) = false`,
    [gameId],
  );
  return new Set(rows.map((row) => row.player_id && row.player_id.toString()));
};

export const getAttendanceByGame = async (gameId) => {
  const { rows: attendanceRows } = await query(
    'SELECT * FROM game_attendance WHERE game_id = $1 ORDER BY check_in_time ASC',
    [gameId],
  );

  if (!attendanceRows.length) {
    const { rows: gameRows } = await query('SELECT id FROM games WHERE id = $1', [gameId]);
    if (!gameRows.length) {
      throw notFoundError('La velada no existe.');
    }
  }

  const seatedIds = await loadActiveSeatedPlayerIds(gameId);
  const openAttendance = attendanceRows.filter((row) => row.check_in_time && !row.check_out_time);
  const benchOrder = [];
  const openByPlayer = new Map();

  openAttendance.forEach((row) => {
    const key = row.player_id ? row.player_id.toString() : null;
    if (!key) return;
    openByPlayer.set(key, row);
    if (!seatedIds.has(key) && !benchOrder.includes(key)) {
      benchOrder.push(key);
    }
  });

  let benchProfiles = [];
  if (benchOrder.length) {
    const { rows: playerRows } = await query(
      'SELECT id, name, nickname, photo FROM players WHERE id = ANY($1::uuid[])',
      [benchOrder],
    );
    const playersById = new Map(playerRows.map((player) => [player.id, player]));
    benchProfiles = benchOrder.map((playerId) => {
      const info = playersById.get(playerId) || { id: playerId };
      const attendance = openByPlayer.get(playerId) || {};
      return {
        id: info.id || playerId,
        player_id: info.id || playerId,
        name: info.name || '',
        nickname: info.nickname || '',
        photo: info.photo || '',
        check_in_time: attendance.check_in_time || null,
      };
    });
  }

  return {
    attendance: attendanceRows,
    bench: benchProfiles,
  };
};

export const checkInPlayer = async (gameId, playerId, timestamp = null) => withTransaction(async (client) => {
  const game = await fetchGameMeta(client, gameId, { forUpdate: true });
  assertGameExists(game);
  assertGameAllowsAttendance(game);

  const existing = await client.query(
    `SELECT id FROM game_attendance
      WHERE game_id = $1 AND player_id = $2 AND check_out_time IS NULL
      LIMIT 1`,
    [gameId, playerId],
  );
  if (existing.rows.length) {
    throw conflictError('El jugador ya tiene una entrada activa en esta velada.');
  }

  const now = timestamp ? convertToUTC(timestamp) : nowUTC();
  const sql = `INSERT INTO game_attendance (game_id, player_id, check_in_time, check_out_time, created_at, updated_at)
    VALUES ($1,$2,$3,NULL,$3,$3)
    ON CONFLICT (game_id, player_id)
    DO UPDATE SET check_in_time = EXCLUDED.check_in_time,
      check_out_time = NULL,
      updated_at = EXCLUDED.updated_at
    RETURNING *`;
  const { rows } = await client.query(sql, [gameId, playerId, now]);
  if (!rows.length) {
    throw badRequestError('No se pudo registrar la entrada del jugador.');
  }
  return rows[0];
});

export const checkOutPlayer = async (gameId, playerId, timestamp = null) => withTransaction(async (client) => {
  const game = await fetchGameMeta(client, gameId, { forUpdate: true });
  assertGameExists(game);
  assertGameAllowsAttendance(game);

  const now = timestamp ? convertToUTC(timestamp) : nowUTC();
  const sql = `UPDATE game_attendance SET check_out_time = $1, updated_at = $2
    WHERE game_id = $3 AND player_id = $4 AND check_out_time IS NULL
    RETURNING *`;
  const { rows } = await client.query(sql, [now, now, gameId, playerId]);
  if (!rows.length) {
    throw badRequestError('El jugador no tiene una entrada activa para cerrar.');
  }
  return rows[0];
});

// Obtiene un fallback de salida específico por jugador:
// 1) Última mano en la que participó el jugador.
// 2) closed_at de la velada.
// 3) updated_at de la velada.
// 4) date de la velada.
const computeFallbackCheckoutForPlayer = async (client, gameId, playerId) => {
  const gameRow = await fetchGameMeta(client, gameId, { forUpdate: true });
  if (!gameRow) return null;

  const lastHandRow = (await client.query(
    `SELECT MAX(COALESCE(h.end_time, h.updated_at, h.created_at)) AS last_hand
     FROM game_hands h
     JOIN game_tables t ON t.id = h.game_table_id
     JOIN game_pairs gp ON gp.game_table_id = t.id
     JOIN game_pair_players gpp ON gpp.game_pair_id = gp.id
     WHERE t.game_id = $1 AND gpp.player_id = $2`,
    [gameId, playerId],
  )).rows[0];

  const fallback = lastHandRow?.last_hand
    || gameRow.closed_at
    || gameRow.updated_at
    || gameRow.date;

  return fallback ? convertToUTC(fallback) : null;
};

const runBackfillMissingCheckouts = async (client, gameId) => {
  const pending = await client.query('SELECT id, player_id FROM game_attendance WHERE game_id = $1 AND check_out_time IS NULL', [gameId]);
  if (!pending.rows.length) return { updated: 0 };

  const now = nowUTC();
  let updated = 0;

  // Procesar uno a uno para usar la última mano en la que participó cada jugador.
  for (const row of pending.rows) {
    const fallback = await computeFallbackCheckoutForPlayer(client, gameId, row.player_id);
    if (!fallback) continue;
    await client.query(
      'UPDATE game_attendance SET check_out_time = $1, updated_at = $2 WHERE id = $3 AND check_out_time IS NULL',
      [fallback, now, row.id],
    );
    updated += 1;
  }

  return { updated };
};

export const backfillMissingCheckouts = async (gameId) => withTransaction(async (client) => runBackfillMissingCheckouts(client, gameId));

export const backfillMissingCheckoutsWithClient = runBackfillMissingCheckouts;
