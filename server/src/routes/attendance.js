import { z } from 'zod';
import {
  getAttendanceByGame,
  checkInPlayer,
  checkOutPlayer,
  backfillMissingCheckouts,
} from '../services/attendanceService.js';

const playerSchema = z.object({
  playerId: z.string(),
  timestamp: z.string().optional(),
});

export default async function attendanceRoutes(app) {
  app.get('/games/:id/attendance', async (request) => {
    const { id } = request.params;
    return getAttendanceByGame(id);
  });

  app.post('/games/:id/attendance/check-in', async (request) => {
    const { id } = request.params;
    const { playerId, timestamp } = playerSchema.parse(request.body);
    return checkInPlayer(id, playerId, timestamp);
  });

  app.post('/games/:id/attendance/check-out', async (request) => {
    const { id } = request.params;
    const { playerId, timestamp } = playerSchema.parse(request.body);
    return checkOutPlayer(id, playerId, timestamp);
  });

  app.post('/games/:id/attendance/backfill', async (request) => {
    const { id } = request.params;
    return backfillMissingCheckouts(id);
  });
}
