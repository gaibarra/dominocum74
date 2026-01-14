import { withTransaction, query } from '../db/pool.js';
import {
  convertInputDateToSupabase,
  convertToUTC,
  nowUTC,
} from '../utils/dates.js';
import {
  createOrGetOpenPartidaForTable,
  closeOpenPartidaForTable,
  getGameIdForTable,
} from './partidasService.js';
import { publishGameEvent } from '../realtime/gameEventBus.js';
import { conflictError, badRequestError, notFoundError } from '../utils/httpErrors.js';
import { backfillMissingCheckoutsWithClient } from './attendanceService.js';

const ACTIVE_GAME_CONFLICT_CODE = 'ACTIVE_GAME_EXISTS';
const ACTIVE_GAME_CONFLICT_MESSAGE = 'Ya existe una velada en curso. Finalízala o cancélala antes de crear una nueva.';
const PG_UNIQUE_VIOLATION = '23505';

const isUniqueViolation = (error) => error?.code === PG_UNIQUE_VIOLATION;

const assertNoActiveGameConflict = async (client, excludeGameId = null) => {
  let sql = 'SELECT id FROM games WHERE status = $1';
  const params = ['En curso'];
  if (excludeGameId) {
    sql += ' AND id <> $2';
    params.push(excludeGameId);
  }
  sql += ' LIMIT 1';
  const { rows } = await client.query(sql, params);
  if (rows.length) {
    const error = new Error(ACTIVE_GAME_CONFLICT_MESSAGE);
    error.code = ACTIVE_GAME_CONFLICT_CODE;
    throw error;
  }
};

const isTempId = (value) => !value || value.toString().startsWith('temp-');

const mapTableFields = (table = {}) => ({
  table_number: table.table_number ?? table.tableNumber ?? 1,
  points_to_win_partida: table.points_to_win_partida ?? table.pointsToWinPartida ?? 100,
  games_won_pair1: table.games_won_pair1 ?? 0,
  games_won_pair2: table.games_won_pair2 ?? 0,
  partida_finished: table.partida_finished ?? table.partidaFinished ?? false,
  finished_at: table.finished_at ?? table.finishedAt ?? null,
});

const mapAnecdoteFields = (anecdote = {}, gameId, now) => ({
  game_id: gameId,
  text: anecdote.text || '',
  media_type: anecdote.mediaType || anecdote.media_type || 'text',
  media_url: anecdote.mediaUrl || anecdote.media_url || '',
  date: anecdote.date ? convertToUTC(anecdote.date) : now,
  last_edited: anecdote.last_edited ? convertToUTC(anecdote.last_edited) : null,
});

const loadPairsWithPlayers = async (client, tableId) => {
  const pairsResult = await client.query(
    'SELECT id, score, created_at, updated_at FROM game_pairs WHERE game_table_id = $1 ORDER BY created_at ASC',
    [tableId],
  );
  const pairIds = pairsResult.rows.map((row) => row.id);
  if (!pairIds.length) return [];
  const playersResult = await client.query(
    'SELECT game_pair_id, player_id FROM game_pair_players WHERE game_pair_id = ANY($1::uuid[])',
    [pairIds],
  );
  const playersMap = new Map();
  playersResult.rows.forEach((row) => {
    if (!playersMap.has(row.game_pair_id)) playersMap.set(row.game_pair_id, []);
    playersMap.get(row.game_pair_id).push(row.player_id);
  });
  return pairsResult.rows.map((pair) => ({
    ...pair,
    players: playersMap.get(pair.id) || [],
  }));
};

const upsertPairsForTable = async (client, tableId, pairs = [], now) => {
  for (const pair of pairs) {
    const fields = { score: pair.score ?? 0 };
    let pairId = pair.id && !isTempId(pair.id) ? pair.id : null;
    if (!pairId) {
      const insertSql = `INSERT INTO game_pairs (game_table_id, score, created_at, updated_at)
        VALUES ($1, $2, $3, $3)
        RETURNING id`;
      const { rows } = await client.query(insertSql, [tableId, fields.score, now]);
      pairId = rows[0]?.id;
    } else {
      await client.query('UPDATE game_pairs SET score = $1 WHERE id = $2', [fields.score, pairId]);
    }

    await client.query('DELETE FROM game_pair_players WHERE game_pair_id = $1', [pairId]);
    const players = Array.isArray(pair.players) ? pair.players.filter(Boolean) : [];
    for (const playerId of players) {
      await client.query(
        'INSERT INTO game_pair_players (game_pair_id, player_id, created_at) VALUES ($1, $2, $3)',
        [pairId, playerId, now],
      );
    }
  }
};

const syncHandsForTable = async (client, tableId, hands = [], now) => {
  if (!hands.length) return;
  const existingIdsResult = await client.query('SELECT id FROM game_hands WHERE game_table_id = $1', [tableId]);
  const existingIds = existingIdsResult.rows.map((row) => row.id);
  const payloadIds = hands
    .filter((hand) => hand.id && !isTempId(hand.id))
    .map((hand) => hand.id);
  const toDelete = existingIds.filter((id) => !payloadIds.includes(id));
  if (toDelete.length) {
    await client.query('DELETE FROM game_hands WHERE id = ANY($1::uuid[])', [toDelete]);
  }

  for (const [index, hand] of hands.entries()) {
    const basePayload = {
      pair_1_score: hand.pair_1_score ?? 0,
      pair_2_score: hand.pair_2_score ?? 0,
      hand_number: hand.hand_number ?? index + 1,
      start_time: hand.start_time ? convertToUTC(hand.start_time) : now,
      end_time: hand.end_time ? convertToUTC(hand.end_time) : null,
      duration_seconds: hand.duration_seconds ?? null,
    };

    if (hand.id && !isTempId(hand.id)) {
      const updateSql = `UPDATE game_hands SET pair_1_score = $1, pair_2_score = $2,
        start_time = $3, end_time = $4, duration_seconds = $5 WHERE id = $6`;
      await client.query(updateSql, [
        basePayload.pair_1_score,
        basePayload.pair_2_score,
        basePayload.start_time,
        basePayload.end_time,
        basePayload.duration_seconds,
        hand.id,
      ]);
    } else {
      const partida = await createOrGetOpenPartidaForTable(client, tableId);
      const insertSql = `INSERT INTO game_hands (game_table_id, partida_id, hand_number, pair_1_score, pair_2_score,
        start_time, end_time, duration_seconds, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`;
      await client.query(insertSql, [
        tableId,
        partida?.id || null,
        basePayload.hand_number,
        basePayload.pair_1_score,
        basePayload.pair_2_score,
        basePayload.start_time,
        basePayload.end_time,
        basePayload.duration_seconds,
        now,
      ]);
    }
  }
};

const computeNextHandNumber = async (client, tableId, requestedNumber = null) => {
  if (Number.isInteger(requestedNumber) && requestedNumber > 0) {
    return requestedNumber;
  }
  const { rows } = await client.query(
    'SELECT COALESCE(MAX(hand_number), 0) + 1 AS next_number FROM game_hands WHERE game_table_id = $1',
    [tableId],
  );
  return rows[0]?.next_number || 1;
};

const syncTablesForGame = async (client, gameId, tables = [], now) => {
  for (const table of tables) {
    const fields = mapTableFields(table);
    let tableId = table.id && !isTempId(table.id) ? table.id : null;
    if (!tableId) {
      const insertSql = `INSERT INTO game_tables (game_id, table_number, points_to_win_partida,
        games_won_pair1, games_won_pair2, partida_finished, finished_at, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
        RETURNING id`;
      const { rows } = await client.query(insertSql, [
        gameId,
        fields.table_number,
        fields.points_to_win_partida,
        fields.games_won_pair1,
        fields.games_won_pair2,
        fields.partida_finished,
        fields.finished_at,
        now,
      ]);
      tableId = rows[0]?.id;
    } else {
      const updateSql = `UPDATE game_tables
        SET table_number = $1,
            points_to_win_partida = $2,
            games_won_pair1 = $3,
            games_won_pair2 = $4,
            partida_finished = $5,
            finished_at = $6
        WHERE id = $7`;
      await client.query(updateSql, [
        fields.table_number,
        fields.points_to_win_partida,
        fields.games_won_pair1,
        fields.games_won_pair2,
        fields.partida_finished,
        fields.finished_at,
        tableId,
      ]);
    }

    if (Array.isArray(table.pairs)) {
      await upsertPairsForTable(client, tableId, table.pairs, now);
    }
    if (Array.isArray(table.hands)) {
      await syncHandsForTable(client, tableId, table.hands, now);
    }
  }
};

const syncAnecdotesForGame = async (client, gameId, anecdotes = [], now) => {
  const existing = await client.query('SELECT id FROM anecdotes WHERE game_id = $1', [gameId]);
  const keepIds = new Set(
    anecdotes.filter((a) => a.id && !isTempId(a.id)).map((a) => a.id),
  );
  const toDelete = existing.rows
    .map((row) => row.id)
    .filter((id) => !keepIds.has(id));
  if (toDelete.length) {
    await client.query('DELETE FROM anecdotes WHERE id = ANY($1::uuid[])', [toDelete]);
  }

  for (const anecdote of anecdotes) {
    const fields = mapAnecdoteFields(anecdote, gameId, now);
    if (anecdote.id && !isTempId(anecdote.id)) {
      const sql = `UPDATE anecdotes SET text = $1, media_type = $2, media_url = $3,
        date = $4, last_edited = $5 WHERE id = $6`;
      await client.query(sql, [
        fields.text,
        fields.media_type,
        fields.media_url,
        fields.date,
        fields.last_edited,
        anecdote.id,
      ]);
    } else {
      const insertSql = `INSERT INTO anecdotes (game_id, text, media_type, media_url, date, last_edited, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`;
      await client.query(insertSql, [
        fields.game_id,
        fields.text,
        fields.media_type,
        fields.media_url,
        fields.date,
        fields.last_edited,
        now,
      ]);
    }
  }
};

export const saveGame = async (gameData) => withTransaction(async (client) => {
  const now = nowUTC();
  const supabaseDate = convertInputDateToSupabase(gameData.date || now);
  const payload = {
    summary: gameData.summary || '',
    location_name: gameData.location_name || gameData.locationName || null,
    location_details: gameData.location_details || gameData.locationDetails || null,
    status: gameData.status || 'En curso',
    date: supabaseDate,
  };

  let gameId = gameData.id && !isTempId(gameData.id) ? gameData.id : null;
  if (!gameId || payload.status === 'En curso') {
    await assertNoActiveGameConflict(client, gameId);
  }
  if (gameId) {
    const updateSql = `UPDATE games
      SET summary = $1,
          location_name = $2,
          location_details = $3,
          status = $4,
          date = $5
      WHERE id = $6 RETURNING id`;
    const { rows } = await client.query(updateSql, [
      payload.summary,
      payload.location_name,
      payload.location_details,
      payload.status,
      payload.date,
      gameId,
    ]);
    if (!rows.length) throw new Error('Juego inexistente para actualizar');
  } else {
    const insertSql = `INSERT INTO games (summary, location_name, location_details, status, date, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$6)
      RETURNING id`;
    const { rows } = await client.query(insertSql, [
      payload.summary,
      payload.location_name,
      payload.location_details,
      payload.status,
      payload.date,
      now,
    ]);
    gameId = rows[0]?.id;
  }

  if (Array.isArray(gameData.tables)) {
    await syncTablesForGame(client, gameId, gameData.tables, now);
  }
  if (Array.isArray(gameData.anecdotes)) {
    await syncAnecdotesForGame(client, gameId, gameData.anecdotes, now);
  }

  return { id: gameId };
});

export const deleteGame = async (id) => {
  return withTransaction(async (client) => {
    // Borrar en orden inverso de dependencias para cubrir bases con FKs previas sin cascade.
    const { rows: tableRows } = await client.query('SELECT id FROM game_tables WHERE game_id = $1', [id]);
    const tableIds = tableRows.map((r) => r.id);

    if (tableIds.length) {
      await client.query(
        `DELETE FROM game_pair_players WHERE game_pair_id = ANY(
           SELECT id FROM game_pairs WHERE game_table_id = ANY($1::uuid[])
         )`,
        [tableIds],
      );
      await client.query('DELETE FROM game_pairs WHERE game_table_id = ANY($1::uuid[])', [tableIds]);
      await client.query('DELETE FROM game_hands WHERE game_table_id = ANY($1::uuid[])', [tableIds]);
      await client.query('DELETE FROM game_partidas WHERE game_table_id = ANY($1::uuid[])', [tableIds]);
      await client.query('DELETE FROM game_partida_snapshots WHERE game_table_id = ANY($1::uuid[])', [tableIds]);
      await client.query('DELETE FROM game_tables WHERE id = ANY($1::uuid[])', [tableIds]);
    }

    await client.query('DELETE FROM game_attendance WHERE game_id = $1', [id]);
    await client.query('DELETE FROM anecdotes WHERE game_id = $1', [id]);

    const { rowCount } = await client.query('DELETE FROM games WHERE id = $1', [id]);
    return rowCount > 0;
  });
};

export const updateGameStatus = async (id, status) => {
  return withTransaction(async (client) => {
    const now = nowUTC();
    if (status === 'En curso') {
      await assertNoActiveGameConflict(client, id);
    }
    let sql;
    let params;
    if (status === 'Finalizada') {
      sql = 'UPDATE games SET status = $1, closed_at = $2, updated_at = $3 WHERE id = $4 RETURNING *';
      params = [status, now, now, id];
    } else if (status === 'En curso') {
      sql = 'UPDATE games SET status = $1, closed_at = NULL, updated_at = $2 WHERE id = $3 RETURNING *';
      params = [status, now, id];
    } else {
      sql = 'UPDATE games SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *';
      params = [status, now, id];
    }
    const { rows } = await client.query(sql, params);
    const updated = rows[0] || null;
    if (updated && status === 'Finalizada') {
      await backfillMissingCheckoutsWithClient(client, id);
    }
    return updated;
  });
};

export const addTableToGame = async (gameId, tablePayload) => {
  try {
    const table = await withTransaction(async (client) => {
      const now = nowUTC();
      const fields = mapTableFields(tablePayload);
      const insertSql = `INSERT INTO game_tables (game_id, table_number, points_to_win_partida, games_won_pair1,
        games_won_pair2, partida_finished, finished_at, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
        RETURNING *`;
      const { rows } = await client.query(insertSql, [
        gameId,
        fields.table_number,
        fields.points_to_win_partida,
        fields.games_won_pair1,
        fields.games_won_pair2,
        fields.partida_finished,
        fields.finished_at,
        now,
      ]);
      const createdTable = rows[0];
      if (Array.isArray(tablePayload.pairs)) {
        await upsertPairsForTable(client, createdTable.id, tablePayload.pairs, now);
      }
      const pairs = await loadPairsWithPlayers(client, createdTable.id);
      return { ...createdTable, pairs, hands: [] };
    });

    publishGameEvent(gameId, { type: 'TABLE_CREATED', payload: { table } });
    return table;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflictError('Ya existe una mesa con ese número en esta velada.');
    }
    throw error;
  }
};

export const updatePairScores = async ({ tableId, pair1Id, pair1Score, pair2Id, pair2Score, gamesWonPair1, gamesWonPair2 }) => {
  const result = await withTransaction(async (client) => {
    if (pair1Id === pair2Id) {
      throw badRequestError('Las parejas deben ser distintas para actualizar los puntajes.');
    }
    const now = nowUTC();
    const tableMeta = await client.query('SELECT game_id FROM game_tables WHERE id = $1 FOR UPDATE', [tableId]);
    if (!tableMeta.rows.length) {
      throw notFoundError('Mesa no encontrada');
    }
    const { rows: pairRows } = await client.query(
      'SELECT id FROM game_pairs WHERE id = ANY($1::uuid[]) AND game_table_id = $2 FOR UPDATE',
      [[pair1Id, pair2Id], tableId],
    );
    if (pairRows.length !== 2) {
      throw badRequestError('Las parejas proporcionadas no pertenecen a la mesa indicada.');
    }

    await client.query('UPDATE game_pairs SET score = $1 WHERE id = $2', [pair1Score, pair1Id]);
    await client.query('UPDATE game_pairs SET score = $1 WHERE id = $2', [pair2Score, pair2Id]);
    await client.query(
      'UPDATE game_tables SET games_won_pair1 = $1, games_won_pair2 = $2, updated_at = $3 WHERE id = $4',
      [gamesWonPair1, gamesWonPair2, now, tableId],
    );
    return {
      info: {
        pair1_updated_at: now,
        pair2_updated_at: now,
        table_updated_at: now,
      },
      gameId: tableMeta.rows[0].game_id,
    };
  });

  publishGameEvent(result.gameId, {
    type: 'PAIR_SCORES_UPDATED',
    tableId,
    payload: {
      pair1Id,
      pair1Score,
      pair2Id,
      pair2Score,
      gamesWonPair1,
      gamesWonPair2,
    },
  });

  return result.info;
};

export const addHandToTable = async (tableId, handPayload) => {
  try {
    const result = await withTransaction(async (client) => {
      const now = nowUTC();
      let lockedGameId;
      try {
        lockedGameId = await getGameIdForTable(client, tableId, { lock: true });
      } catch (error) {
        throw notFoundError('Mesa no encontrada');
      }

      const handNumber = await computeNextHandNumber(client, tableId, handPayload.hand_number);
      const duplicateCheck = await client.query(
        'SELECT 1 FROM game_hands WHERE game_table_id = $1 AND hand_number = $2 LIMIT 1',
        [tableId, handNumber],
      );
      if (duplicateCheck.rows.length) {
        throw conflictError('Ya existe una mano con ese número para esta mesa.');
      }

      const partida = await createOrGetOpenPartidaForTable(client, tableId);
      const insertSql = `INSERT INTO game_hands (game_table_id, partida_id, hand_number, pair_1_score, pair_2_score,
        start_time, end_time, duration_seconds, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
        RETURNING *`;
      const { rows } = await client.query(insertSql, [
        tableId,
        partida?.id || null,
        handNumber,
        handPayload.pair_1_score ?? 0,
        handPayload.pair_2_score ?? 0,
        handPayload.start_time ? convertToUTC(handPayload.start_time) : now,
        handPayload.end_time ? convertToUTC(handPayload.end_time) : null,
        handPayload.duration_seconds ?? null,
        now,
      ]);
      const hand = rows[0];
      const gameId = partida?.game_id || lockedGameId;
      return { hand, gameId };
    });

    publishGameEvent(result.gameId, {
      type: 'HAND_ADDED',
      tableId,
      payload: { hand: result.hand },
    });

    return result.hand;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw conflictError('Ya existe una mano con ese número para esta mesa.');
    }
    throw error;
  }
};

export const updateHand = async (handId, updates) => {
  const result = await withTransaction(async (client) => {
    const metaSql = `SELECT gh.game_table_id, gt.game_id
      FROM game_hands gh
      JOIN game_tables gt ON gh.game_table_id = gt.id
      WHERE gh.id = $1`;
    const meta = await client.query(metaSql, [handId]);
    if (!meta.rows.length) {
      return { hand: null };
    }
    const now = nowUTC();
    const sql = `UPDATE game_hands SET pair_1_score = $1, pair_2_score = $2,
      start_time = COALESCE($3, start_time),
      end_time = COALESCE($4, end_time),
      duration_seconds = $5,
      updated_at = $6
      WHERE id = $7
      RETURNING *`;
    const { rows } = await client.query(sql, [
      updates.pair_1_score ?? 0,
      updates.pair_2_score ?? 0,
      updates.start_time ? convertToUTC(updates.start_time) : null,
      updates.end_time ? convertToUTC(updates.end_time) : null,
      updates.duration_seconds ?? null,
      now,
      handId,
    ]);
    return {
      hand: rows[0] || null,
      tableId: meta.rows[0].game_table_id,
      gameId: meta.rows[0].game_id,
    };
  });

  if (result.hand) {
    publishGameEvent(result.gameId, {
      type: 'HAND_UPDATED',
      tableId: result.tableId,
      payload: { hand: result.hand },
    });
  }

  return result.hand;
};

export const saveNewAnecdote = async (gameId, payload) => {
  const anecdote = await withTransaction(async (client) => {
    const now = nowUTC();
    const fields = mapAnecdoteFields(payload, gameId, now);
    const sql = `INSERT INTO anecdotes (game_id, text, media_type, media_url, date, last_edited, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
      RETURNING *`;
    const { rows } = await client.query(sql, [
      fields.game_id,
      fields.text,
      fields.media_type,
      fields.media_url,
      fields.date,
      fields.last_edited,
      now,
    ]);
    return rows[0];
  });

  publishGameEvent(gameId, {
    type: 'ANECDOTE_CREATED',
    payload: { anecdote },
  });
  return anecdote;
};

export const updateAnecdote = async (anecdoteId, payload) => {
  const result = await withTransaction(async (client) => {
    const meta = await client.query('SELECT game_id FROM anecdotes WHERE id = $1', [anecdoteId]);
    if (!meta.rows.length) {
      return { anecdote: null };
    }
    const now = nowUTC();
    const sql = `UPDATE anecdotes SET text = $1, media_type = $2, media_url = $3,
      date = COALESCE($4, date),
      last_edited = $5, updated_at = $5
      WHERE id = $6 RETURNING *`;
    const { rows } = await client.query(sql, [
      payload.text || '',
      payload.mediaType || payload.media_type || 'text',
      payload.mediaUrl || payload.media_url || '',
      payload.date ? convertToUTC(payload.date) : null,
      now,
      anecdoteId,
    ]);
    return {
      anecdote: rows[0] || null,
      gameId: meta.rows[0].game_id,
    };
  });

  if (result.anecdote) {
    publishGameEvent(result.gameId, {
      type: 'ANECDOTE_UPDATED',
      payload: { anecdote: result.anecdote },
    });
  }

  return result.anecdote;
};

export const deleteAnecdote = async (anecdoteId) => {
  const existing = await query('SELECT game_id FROM anecdotes WHERE id = $1', [anecdoteId]);
  if (!existing.rows.length) {
    return false;
  }
  const { rowCount } = await query('DELETE FROM anecdotes WHERE id = $1', [anecdoteId]);
  if (rowCount > 0) {
    publishGameEvent(existing.rows[0].game_id, {
      type: 'ANECDOTE_DELETED',
      payload: { anecdoteId },
    });
  }
  return rowCount > 0;
};

export const finalizeTablePartida = async (tableId, { incrementPair1 = 0, incrementPair2 = 0 } = {}) => {
  const result = await withTransaction(async (client) => {
    const now = nowUTC();
    const selectSql = 'SELECT game_id, games_won_pair1, games_won_pair2 FROM game_tables WHERE id = $1 FOR UPDATE';
    const { rows } = await client.query(selectSql, [tableId]);
    if (!rows.length) throw new Error('Mesa no encontrada');
    const updated = {
      games_won_pair1: rows[0].games_won_pair1 + incrementPair1,
      games_won_pair2: rows[0].games_won_pair2 + incrementPair2,
      partida_finished: true,
      finished_at: now,
    };
    await client.query(
      'UPDATE game_tables SET games_won_pair1 = $1, games_won_pair2 = $2, partida_finished = $3, finished_at = $4, updated_at = $5 WHERE id = $6',
      [updated.games_won_pair1, updated.games_won_pair2, updated.partida_finished, updated.finished_at, now, tableId],
    );
    let winner = null;
    if (incrementPair1 > incrementPair2) winner = 1;
    else if (incrementPair2 > incrementPair1) winner = 2;
    await closeOpenPartidaForTable(client, tableId, { finishedAt: now, winnerPairIndex: winner });
    return {
      updated,
      gameId: rows[0].game_id,
    };
  });

  publishGameEvent(result.gameId, {
    type: 'TABLE_FINALIZED',
    tableId,
    payload: result.updated,
  });
  return result.updated;
};

export const cancelPendingTable = async (tableId) => {
  const result = await withTransaction(async (client) => {
    const row = (await client.query('SELECT id, partida_finished, games_won_pair1, games_won_pair2, game_id FROM game_tables WHERE id = $1', [tableId])).rows[0];
    if (!row) throw new Error('Mesa no encontrada');
    const alreadyStarted = row.partida_finished || row.games_won_pair1 > 0 || row.games_won_pair2 > 0;
    if (alreadyStarted) throw new Error('La mesa ya fue finalizada');

    await client.query('DELETE FROM game_hands WHERE game_table_id = $1', [tableId]);
    await client.query('DELETE FROM game_partida_snapshots WHERE game_table_id = $1', [tableId]);
    await client.query('DELETE FROM game_partidas WHERE game_table_id = $1', [tableId]);
    const pairs = await client.query('SELECT id FROM game_pairs WHERE game_table_id = $1', [tableId]);
    const pairIds = pairs.rows.map((p) => p.id);
    if (pairIds.length) {
      await client.query('DELETE FROM game_pair_players WHERE game_pair_id = ANY($1::uuid[])', [pairIds]);
      await client.query('DELETE FROM game_pairs WHERE id = ANY($1::uuid[])', [pairIds]);
    }
    await client.query('DELETE FROM game_tables WHERE id = $1', [tableId]);
    return { success: true, gameId: row.game_id };
  });

  publishGameEvent(result.gameId, {
    type: 'TABLE_CANCELLED',
    tableId,
  });

  return { success: true };
};

export const savePartidaSnapshot = async ({
  gameId,
  tableId,
  tableNumber,
  partidaIndex,
  pair1Players = [],
  pair2Players = [],
  pair1Points = 0,
  pair2Points = 0,
  finishedAt = null,
}) => withTransaction(async (client) => {
  const now = nowUTC();
  const rows = [
    {
      pairIndex: 1,
      players: pair1Players,
      points: pair1Points,
    },
    {
      pairIndex: 2,
      players: pair2Players,
      points: pair2Points,
    },
  ];

  for (const row of rows) {
    const sql = `INSERT INTO game_partida_snapshots (game_id, game_table_id, table_number, partida_index, pair_index,
      player1_id, player2_id, points, finished_at, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)
      ON CONFLICT (game_id, game_table_id, partida_index, pair_index)
      DO UPDATE SET player1_id = EXCLUDED.player1_id,
        player2_id = EXCLUDED.player2_id,
        points = EXCLUDED.points,
        finished_at = EXCLUDED.finished_at,
        updated_at = EXCLUDED.updated_at`;
    await client.query(sql, [
      gameId,
      tableId,
      tableNumber,
      partidaIndex,
      row.pairIndex,
      row.players?.[0] || null,
      row.players?.[1] || null,
      row.points,
      finishedAt ? convertToUTC(finishedAt) : now,
      now,
    ]);
  }
  return true;
});

export const getPartidaSnapshotsByGame = async (gameId) => {
  const { rows } = await query(
    'SELECT * FROM game_partida_snapshots WHERE game_id = $1 ORDER BY finished_at ASC NULLS LAST, created_at ASC',
    [gameId],
  );
  return rows;
};
