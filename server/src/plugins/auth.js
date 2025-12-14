import fp from 'fastify-plugin';
import { env } from '../env.js';

const headerName = 'x-api-key';

const extractApiKey = (request) => {
  const headerValue = request.headers[headerName] || request.headers[headerName.toLowerCase()];
  if (headerValue) return headerValue;
  if (request.query && typeof request.query.apiKey === 'string') {
    return request.query.apiKey;
  }
  if (request.query && typeof request.query.token === 'string') {
    return request.query.token;
  }
  return null;
};

async function authPlugin(app) {
  app.addHook('onRequest', async (request, reply) => {
    if (request.method === 'OPTIONS') {
      return;
    }
    const urlPath = request.raw.url || '';
    const uploadsPrefix = env.uploadsBasePath.endsWith('/')
      ? env.uploadsBasePath
      : `${env.uploadsBasePath}/`;
    const isUploadsRequest = urlPath.startsWith(uploadsPrefix);
    if ((request.method === 'GET' || request.method === 'HEAD') && isUploadsRequest) {
      return;
    }
    const provided = extractApiKey(request);
    if (!provided || provided !== env.apiKey) {
      reply.code(401);
      throw new Error('API key inválida');
    }
  });
}

export default fp(authPlugin);
