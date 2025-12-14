import { apiClient } from './apiClient';
import { convertSupabaseDateToInput, convertDateTimeToTimeZone } from './dateUtils';
import { normalizeAnecdote } from './normalizers';

const formatAnecdoteRecord = (anecdote) => {
  if (!anecdote) return null;
  return normalizeAnecdote(anecdote);
};

const mapHands = (hands = []) =>
  hands
    .map((hand) => ({
      ...hand,
      created_at: convertDateTimeToTimeZone(hand.created_at),
      updated_at: hand.updated_at ? convertDateTimeToTimeZone(hand.updated_at) : null,
      start_time: hand.start_time ? convertDateTimeToTimeZone(hand.start_time) : null,
      end_time: hand.end_time ? convertDateTimeToTimeZone(hand.end_time) : null,
    }))
    .sort((a, b) => a.hand_number - b.hand_number);

const mapTable = (table) => {
  if (!table) return table;
  return {
    ...table,
    partidaFinished: table.partidaFinished ?? !!table.partida_finished,
    finished_at: table.finished_at ? convertDateTimeToTimeZone(table.finished_at) : null,
    created_at: convertDateTimeToTimeZone(table.created_at),
    updated_at: table.updated_at ? convertDateTimeToTimeZone(table.updated_at) : null,
    pairs: Array.isArray(table.pairs)
      ? table.pairs.map((pair) => ({
        ...pair,
        players: Array.isArray(pair.players) ? pair.players : [],
        created_at: convertDateTimeToTimeZone(pair.created_at),
        updated_at: pair.updated_at ? convertDateTimeToTimeZone(pair.updated_at) : null,
      }))
      : [],
    hands: mapHands(table.hands || []),
  };
};

const sortByNumber = (prop) => (a, b) => (a[prop] ?? 0) - (b[prop] ?? 0);

const mapGame = (game) => {
  if (!game) return game;
  return {
    ...game,
    locationName: game.location_name || null,
    locationDetails: game.location_details || null,
    date: convertSupabaseDateToInput(game.date),
    created_at: convertDateTimeToTimeZone(game.created_at),
    updated_at: convertDateTimeToTimeZone(game.updated_at),
    closed_at: game.closed_at ? convertDateTimeToTimeZone(game.closed_at) : null,
    tables: Array.isArray(game.tables)
      ? game.tables.map(mapTable).sort(sortByNumber('table_number'))
      : [],
    anecdotes: Array.isArray(game.anecdotes)
      ? game.anecdotes
          .map(formatAnecdoteRecord)
          .filter(Boolean)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
      : [],
  };
};

export const getGames = async ({ limit = 20, offset = 0 } = {}) => {
  try {
    const data = await apiClient.get(`/games?limit=${limit}&offset=${offset}`);
    return (data || []).map(mapGame);
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
};

export const getGamesLight = async () => {
  try {
    const data = await apiClient.get('/games?limit=100&offset=0');
    return (data || []).map((game) => ({
      id: game.id,
      date: convertSupabaseDateToInput(game.date),
      summary: game.summary,
      locationName: game.location_name || null,
      locationDetails: game.location_details || null,
      status: game.status,
      created_at: convertDateTimeToTimeZone(game.created_at),
      updated_at: convertDateTimeToTimeZone(game.updated_at),
      tables: Array.isArray(game.tables) ? game.tables.map((t) => ({ id: t.id })) : [],
      anecdotes: Array.isArray(game.anecdotes) ? game.anecdotes.map((a) => ({ id: a.id })) : [],
    }));
  } catch (error) {
    console.error('Error fetching games (light):', error);
    return [];
  }
};

export const getActiveGame = async () => {
  try {
    const data = await apiClient.get('/games/active');
    return data ? mapGame(data) : null;
  } catch (error) {
    if (error.status === 404) return null;
    console.error('Error fetching active game:', error);
    throw error;
  }
};

export const getGameById = async (id) => {
  try {
    const data = await apiClient.get(`/games/${id}`);
    return data ? mapGame(data) : null;
  } catch (error) {
    console.error('Error fetching game by ID:', error);
    return null;
  }
};

export const deleteGame = async (id) => {
  try {
    await apiClient.delete(`/games/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting game:', error);
    return false;
  }
};

export const updateGameStatus = async (id, status) => {
  try {
    const updated = await apiClient.patch(`/games/${id}/status`, { status });
    if (!updated) return null;
    return {
      ...updated,
      date: convertSupabaseDateToInput(updated.date),
      created_at: convertDateTimeToTimeZone(updated.created_at),
      updated_at: convertDateTimeToTimeZone(updated.updated_at),
      closed_at: updated.closed_at ? convertDateTimeToTimeZone(updated.closed_at) : null,
    };
  } catch (error) {
    console.error('Error updating game status:', error);
    throw error;
  }
};