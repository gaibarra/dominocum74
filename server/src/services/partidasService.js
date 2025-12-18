import { nowUTC } from '../utils/dates.js';

const firstRow = (result) => result?.rows?.[0] || null;

const ensureClient = (client) => {
  if (!client) throw new Error('Transaction client required for partida operations');
  return client;
};

export const getGameIdForTable = async (client, tableId, { lock = false } = {}) => {
  const sql = `SELECT game_id FROM game_tables WHERE id = $1${lock ? ' FOR UPDATE' : ''}`;
  const row = firstRow(await client.query(sql, [tableId]));
  if (!row) throw new Error('game_tables row not found for partida linkage');
  return row.game_id;
};

export const createOrGetOpenPartidaForTable = async (client, tableId) => {
  const trx = ensureClient(client);
  const selectSql = `SELECT id, game_id, game_table_id, partida_index, started_at, closed_at
    FROM game_partidas
    WHERE game_table_id = $1 AND closed_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1
    FOR UPDATE`;
  const existing = firstRow(await trx.query(selectSql, [tableId]));
  if (existing) return existing;

  const gameId = await getGameIdForTable(trx, tableId, { lock: true });
  const nextSql = 'SELECT COALESCE(MAX(partida_index), 0) + 1 AS next_index FROM game_partidas WHERE game_table_id = $1';
  const { next_index: nextIndex } = firstRow(await trx.query(nextSql, [tableId])) || { next_index: 1 };
  const now = nowUTC();
  const insertSql = `INSERT INTO game_partidas (game_id, game_table_id, partida_index, started_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $4, $4)
    ON CONFLICT (game_table_id, partida_index) DO NOTHING
    RETURNING id, game_id, game_table_id, partida_index, started_at, closed_at`;
  const inserted = firstRow(await trx.query(insertSql, [gameId, tableId, nextIndex, now]));
  if (inserted) return inserted;
  // if another transaction inserted concurrently, fetch the latest open partida
  const fallback = firstRow(await trx.query(selectSql, [tableId]));
  if (fallback) return fallback;
  throw new Error('Unable to create partida record for table');
};

export const closeOpenPartidaForTable = async (client, tableId, { finishedAt = null, winnerPairIndex = null } = {}) => {
  const trx = ensureClient(client);
  const selectSql = `SELECT id FROM game_partidas
    WHERE game_table_id = $1 AND closed_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1
    FOR UPDATE`;
  const row = firstRow(await trx.query(selectSql, [tableId]));
  if (!row) return false;
  const now = nowUTC();
  await trx.query(
    'UPDATE game_partidas SET closed_at = $1, winner_pair_index = $2, updated_at = $3 WHERE id = $4',
    [finishedAt || now, winnerPairIndex, now, row.id],
  );
  return true;
};
