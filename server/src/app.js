import fs from 'node:fs';
import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import { env } from './env.js';
import authPlugin from './plugins/auth.js';
import playerRoutes from './routes/players.js';
import gamesRoutes from './routes/games.js';
import attendanceRoutes from './routes/attendance.js';
import uploadRoutes from './routes/uploads.js';
import realtimeRoutes from './routes/realtime.js';
import statsRoutes from './routes/stats.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: env.nodeEnv !== 'test',
    ...opts,
  });

  fs.mkdirSync(env.uploadsDir, { recursive: true });

  app.register(sensible);
  app.register(websocket);

  if (env.enableCors) {
    app.register(cors, {
      origin: (origin, cb) => cb(null, true),
      credentials: true,
    });
  }

  app.register(multipart, {
    limits: {
      fileSize: env.uploadMaxBytes,
    },
  });

  const uploadsPrefix = env.uploadsBasePath.endsWith('/')
    ? env.uploadsBasePath
    : `${env.uploadsBasePath}/`;

  app.register(fastifyStatic, {
    root: env.uploadsDir,
    prefix: uploadsPrefix,
    decorateReply: false,
  });

  app.register(authPlugin);
  app.register(playerRoutes);
  app.register(gamesRoutes);
  app.register(attendanceRoutes);
  app.register(uploadRoutes);
  app.register(realtimeRoutes);
  app.register(statsRoutes);

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}
