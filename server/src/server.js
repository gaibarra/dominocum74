import { buildApp } from './app.js';
import { env } from './env.js';

const app = buildApp();

app.listen({ port: env.port, host: env.host })
  .then(() => {
    app.log.info(`API listening on ${env.host}:${env.port}`);
  })
  .catch((err) => {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  });
