import { z } from 'zod';
import { fetchGames, fetchGameById, fetchActiveGame } from '../services/gamesService.js';
import {
  saveGame,
  deleteGame,
  updateGameStatus,
  addTableToGame,
  updatePairScores,
  addHandToTable,
  updateHand,
  saveNewAnecdote,
  updateAnecdote,
  deleteAnecdote,
  finalizeTablePartida,
  cancelPendingTable,
  savePartidaSnapshot,
  getPartidaSnapshotsByGame,
} from '../services/gameMutationsService.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const saveGameSchema = z.object({
  id: z.string().optional(),
  summary: z.string().optional(),
  location_name: z.string().nullable().optional(),
  location_details: z.string().nullable().optional(),
  status: z.string().optional(),
  date: z.string().optional(),
  tables: z.array(z.any()).optional(),
  anecdotes: z.array(z.any()).optional(),
});

const statusSchema = z.object({
  status: z.string().min(1),
});

const addTableSchema = z.object({
  table_number: z.number().int(),
  points_to_win_partida: z.number().int().optional(),
  games_won_pair1: z.number().int().optional(),
  games_won_pair2: z.number().int().optional(),
  partida_finished: z.boolean().optional(),
  finished_at: z.string().nullable().optional(),
  pairs: z.array(z.any()).optional(),
});

const pairScoresSchema = z.object({
  pair1Id: z.string(),
  pair2Id: z.string(),
  pair1Score: z.number().int(),
  pair2Score: z.number().int(),
  gamesWonPair1: z.number().int(),
  gamesWonPair2: z.number().int(),
});

const handSchema = z.object({
  pair_1_score: z.number().int(),
  pair_2_score: z.number().int(),
  hand_number: z.number().int().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  duration_seconds: z.number().int().nullable().optional(),
});

const anecdoteSchema = z.object({
  text: z.string().min(1),
  mediaType: z.string().optional(),
  mediaUrl: z.string().optional(),
  date: z.string().optional(),
});

const finalizeSchema = z.object({
  incrementPair1: z.number().int().optional(),
  incrementPair2: z.number().int().optional(),
});

const snapshotSchema = z.object({
  gameId: z.string(),
  tableId: z.string(),
  tableNumber: z.number().int(),
  partidaIndex: z.number().int(),
  pair1Players: z.array(z.string().nullable()).optional(),
  pair2Players: z.array(z.string().nullable()).optional(),
  pair1Points: z.number().int().optional(),
  pair2Points: z.number().int().optional(),
  finishedAt: z.string().optional(),
});

export default async function gamesRoutes(app) {
  app.get('/games', async (request) => {
    const { limit, offset } = listQuerySchema.parse(request.query);
    const games = await fetchGames({ limit, offset });
    return games;
  });

  app.get('/games/active', async () => {
    return fetchActiveGame();
  });

  app.get('/games/:id', async (request, reply) => {
    const { id } = request.params;
    const game = await fetchGameById(id);
    if (!game) {
      return reply.notFound('Juego no encontrado');
    }
    return game;
  });

  app.post('/games', async (request, reply) => {
    const payload = saveGameSchema.parse(request.body);
    const result = await saveGame(payload);
    reply.code(201);
    return result;
  });

  app.put('/games/:id', async (request) => {
    const { id } = request.params;
    const payload = saveGameSchema.parse({ ...request.body, id });
    return saveGame(payload);
  });

  app.delete('/games/:id', async (request, reply) => {
    const { id } = request.params;
    const removed = await deleteGame(id);
    if (!removed) {
      return reply.notFound('Juego no encontrado');
    }
    reply.code(204);
  });

  app.patch('/games/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status } = statusSchema.parse(request.body);
    const updated = await updateGameStatus(id, status);
    if (!updated) {
      return reply.notFound('Juego no encontrado');
    }
    return updated;
  });

  app.post('/games/:id/tables', async (request) => {
    const { id } = request.params;
    const payload = addTableSchema.parse(request.body);
    return addTableToGame(id, payload);
  });

  app.patch('/tables/:id/pairs', async (request) => {
    const { id } = request.params;
    const payload = pairScoresSchema.parse(request.body);
    return updatePairScores({ tableId: id, ...payload });
  });

  app.post('/tables/:id/hands', async (request) => {
    const { id } = request.params;
    const payload = handSchema.parse(request.body);
    return addHandToTable(id, payload);
  });

  app.patch('/hands/:id', async (request, reply) => {
    const { id } = request.params;
    const payload = handSchema.partial().parse(request.body);
    const updated = await updateHand(id, payload);
    if (!updated) {
      return reply.notFound('Mano no encontrada');
    }
    return updated;
  });

  app.post('/games/:id/anecdotes', async (request) => {
    const { id } = request.params;
    const payload = anecdoteSchema.parse(request.body);
    return saveNewAnecdote(id, payload);
  });

  app.patch('/anecdotes/:id', async (request, reply) => {
    const { id } = request.params;
    const payload = anecdoteSchema.partial().parse(request.body);
    const updated = await updateAnecdote(id, payload);
    if (!updated) {
      return reply.notFound('Anécdota no encontrada');
    }
    return updated;
  });

  app.delete('/anecdotes/:id', async (request, reply) => {
    const { id } = request.params;
    const removed = await deleteAnecdote(id);
    if (!removed) {
      return reply.notFound('Anécdota no encontrada');
    }
    reply.code(204);
  });

  app.post('/tables/:id/finalize', async (request) => {
    const { id } = request.params;
    const payload = finalizeSchema.parse(request.body ?? {});
    return finalizeTablePartida(id, payload);
  });

  app.delete('/tables/:id', async (request) => {
    const { id } = request.params;
    return cancelPendingTable(id);
  });

  app.post('/games/:id/snapshots', async (request) => {
    const { id } = request.params;
    const payload = snapshotSchema.parse({ ...request.body, gameId: id });
    return savePartidaSnapshot(payload);
  });

  app.get('/games/:id/snapshots', async (request) => {
    const { id } = request.params;
    return getPartidaSnapshotsByGame(id);
  });
}
