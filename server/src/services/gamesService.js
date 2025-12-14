import { query } from '../db/pool.js';

const rowsToMap = (rows, key) => {
  const map = new Map();
  rows.forEach((row) => {
    const k = row[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(row);
  });
  return map;
};

const sortBy = (prop) => (a, b) => {
  if (a[prop] === b[prop]) return 0;
  return a[prop] < b[prop] ? -1 : 1;
};

export const fetchGames = async ({ limit = 20, offset = 0, ids = null } = {}) => {
  let baseSql = `SELECT id, date, summary, location_name, location_details, status, closed_at, created_at, updated_at
     FROM games`;
  const params = [];

  if (Array.isArray(ids) && ids.length > 0) {
    params.push(ids);
    baseSql += ` WHERE id = ANY($${params.length}::uuid[])`;
  }

  baseSql += ' ORDER BY date DESC';

  if (!ids) {
    params.push(limit, offset);
    baseSql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
  }

  const { rows: games } = await query(baseSql, params);

  if (!games.length) return [];

  const gameIds = games.map((g) => g.id);

  const { rows: tables } = await query(
    `SELECT * FROM game_tables WHERE game_id = ANY($1::uuid[])`,
    [gameIds],
  );
  const tableIds = tables.map((t) => t.id);

  const { rows: pairs } = tableIds.length
    ? await query('SELECT * FROM game_pairs WHERE game_table_id = ANY($1::uuid[])', [tableIds])
    : { rows: [] };
  const pairIds = pairs.map((p) => p.id);

  const { rows: pairPlayers } = pairIds.length
    ? await query('SELECT game_pair_id, player_id FROM game_pair_players WHERE game_pair_id = ANY($1::uuid[])', [pairIds])
    : { rows: [] };

  const { rows: hands } = tableIds.length
    ? await query('SELECT * FROM game_hands WHERE game_table_id = ANY($1::uuid[])', [tableIds])
    : { rows: [] };

  const { rows: anecdotes } = await query('SELECT * FROM anecdotes WHERE game_id = ANY($1::uuid[])', [gameIds]);

  const tablesByGame = rowsToMap(tables, 'game_id');
  const pairsByTable = rowsToMap(pairs, 'game_table_id');
  const handsByTable = rowsToMap(hands, 'game_table_id');
  const pairPlayersByPair = rowsToMap(pairPlayers, 'game_pair_id');
  const anecdotesByGame = rowsToMap(anecdotes, 'game_id');

  return games.map((game) => ({
    ...game,
    tables: (tablesByGame.get(game.id) || [])
      .sort(sortBy('table_number'))
      .map((table) => ({
        ...table,
        pairs: (pairsByTable.get(table.id) || [])
          .map((pair) => ({
            ...pair,
            players: (pairPlayersByPair.get(pair.id) || []).map((pp) => pp.player_id),
          })),
        hands: (handsByTable.get(table.id) || []).sort(sortBy('hand_number')),
      })),
    anecdotes: (anecdotesByGame.get(game.id) || []).sort((a, b) => new Date(b.date) - new Date(a.date)),
  }));
};

export const fetchGameById = async (id) => {
  const games = await fetchGames({ ids: [id], limit: 1, offset: 0 });
  return games[0] || null;
};

export const fetchActiveGame = async () => {
  const { rows } = await query(
    'SELECT id FROM games WHERE status = $1 ORDER BY date DESC LIMIT 1',
    ['En curso'],
  );
  if (!rows.length) return null;
  return fetchGameById(rows[0].id);
};
