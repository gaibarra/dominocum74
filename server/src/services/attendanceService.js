import { withTransaction, query } from '../db/pool.js';
import { nowUTC, convertToUTC } from '../utils/dates.js';

export const getAttendanceByGame = async (gameId) => {
  const { rows } = await query(
    'SELECT * FROM game_attendance WHERE game_id = $1 ORDER BY check_in_time ASC',
    [gameId],
  );
  return rows;
};

export const checkInPlayer = async (gameId, playerId, timestamp = null) => withTransaction(async (client) => {
  const now = timestamp ? convertToUTC(timestamp) : nowUTC();
  const existing = await client.query(
    `SELECT * FROM game_attendance
      WHERE game_id = $1 AND player_id = $2 AND check_out_time IS NULL
      LIMIT 1`,
    [gameId, playerId],
  );
  if (existing.rows.length) return existing.rows[0];

  const sql = `INSERT INTO game_attendance (game_id, player_id, check_in_time, check_out_time, created_at, updated_at)
    VALUES ($1,$2,$3,NULL,$3,$3)
    ON CONFLICT (game_id, player_id)
    DO UPDATE SET check_in_time = EXCLUDED.check_in_time,
      check_out_time = NULL,
      updated_at = EXCLUDED.updated_at
    RETURNING *`;
  const { rows } = await client.query(sql, [gameId, playerId, now]);
  return rows[0];
});

export const checkOutPlayer = async (gameId, playerId, timestamp = null) => withTransaction(async (client) => {
  const now = timestamp ? convertToUTC(timestamp) : nowUTC();
  const sql = `UPDATE game_attendance SET check_out_time = $1, updated_at = $2
    WHERE game_id = $3 AND player_id = $4 AND check_out_time IS NULL
    RETURNING *`;
  const { rows } = await client.query(sql, [now, now, gameId, playerId]);
  return rows[0] || null;
});

const computeFallbackCheckout = async (client, gameId) => {
  const gameRow = (await client.query('SELECT date, updated_at, closed_at FROM games WHERE id = $1', [gameId])).rows[0];
  if (!gameRow) return null;

  const lastHandRow = (await client.query(
    `SELECT MAX(COALESCE(h.end_time, h.updated_at, h.created_at)) AS last_hand
     FROM game_hands h
     JOIN game_tables t ON t.id = h.game_table_id
     WHERE t.game_id = $1`,
    [gameId],
  )).rows[0];

  const fallback = lastHandRow?.last_hand
    || gameRow.closed_at
    || gameRow.updated_at
    || gameRow.date;

  return fallback ? convertToUTC(fallback) : null;
};

export const backfillMissingCheckouts = async (gameId) => withTransaction(async (client) => {
  const pending = await client.query('SELECT id FROM game_attendance WHERE game_id = $1 AND check_out_time IS NULL', [gameId]);
  if (!pending.rows.length) return { updated: 0 };

  const fallback = await computeFallbackCheckout(client, gameId);
  if (!fallback) return { updated: 0 };

  const now = nowUTC();
  await client.query(
    'UPDATE game_attendance SET check_out_time = $1, updated_at = $2 WHERE game_id = $3 AND check_out_time IS NULL',
    [fallback, now, gameId],
  );
  return { updated: pending.rows.length };
});
