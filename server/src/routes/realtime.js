import { subscribeToGameEvents } from '../realtime/gameEventBus.js';

export default async function realtimeRoutes(app) {
  app.get('/games/:id/events', { websocket: true }, (connection, request) => {
    const { id } = request.params;
    subscribeToGameEvents(id, connection);
  });
}
