import { apiClient } from '../apiClient';
import { convertInputDateToSupabase, convertDateTimeToTimeZone } from '../dateUtils';
import { normalizeHand, normalizeTable, normalizeAnecdote } from '../normalizers';

const isTempId = (value) => typeof value === 'string' && value.startsWith('temp-');

const sanitizeGamePayload = (gameData) => {
  const payload = { ...gameData };
  if (payload.locationName !== undefined && payload.location_name === undefined) {
    payload.location_name = payload.locationName;
  }
  if (payload.locationDetails !== undefined && payload.location_details === undefined) {
    payload.location_details = payload.locationDetails;
  }
  if (payload.date) {
    payload.date = convertInputDateToSupabase(payload.date);
  }
  return payload;
};

export const saveGame = async (gameData) => {
  const payload = sanitizeGamePayload(gameData);
  if (gameData.id && !isTempId(gameData.id)) {
    return apiClient.put(`/games/${gameData.id}`, payload);
  }
  const { id, ...rest } = payload;
  return apiClient.post('/games', rest);
};

export const addTableToGameDB = async (gameId, newTableData) => {
  const table = await apiClient.post(`/games/${gameId}/tables`, newTableData);
  return normalizeTable(table);
};

export const updatePairScoresInTableDB = async (tableId, pair1Id, pair1Score, pair2Id, pair2Score, gamesWonPair1, gamesWonPair2) => {
  const payload = {
    pair1Id,
    pair2Id,
    pair1Score,
    pair2Score,
    gamesWonPair1,
    gamesWonPair2,
  };
  return apiClient.patch(`/tables/${tableId}/pairs`, payload);
};

export const addHandToTableDB = async (_gameId, tableId, handData) => {
  const hand = await apiClient.post(`/tables/${tableId}/hands`, handData);
  return normalizeHand(hand);
};

export const updateHandInTableDB = async (handId, updatedHandData) => {
  const hand = await apiClient.patch(`/hands/${handId}`, updatedHandData);
  return hand ? normalizeHand(hand) : null;
};

export const saveNewAnecdoteDB = async (gameId, anecdoteData) => {
  const anecdote = await apiClient.post(`/games/${gameId}/anecdotes`, anecdoteData);
  return normalizeAnecdote(anecdote);
};

export const updateAnecdoteDB = async (anecdoteId, anecdoteData) => {
  const updated = await apiClient.patch(`/anecdotes/${anecdoteId}`, anecdoteData);
  return updated ? normalizeAnecdote(updated) : null;
};

export const deleteAnecdoteDB = async (anecdoteId) => {
  await apiClient.delete(`/anecdotes/${anecdoteId}`);
  return true;
};

export const finalizeTablePartidaDB = async (tableId, payload = {}) => {
  const updated = await apiClient.post(`/tables/${tableId}/finalize`, payload);
  return {
    ...updated,
    partidaFinished: true,
    finished_at: updated.finished_at ? convertDateTimeToTimeZone(updated.finished_at) : null,
  };
};

export const cancelPendingTableDB = async (tableId) => {
  return apiClient.delete(`/tables/${tableId}`);
};