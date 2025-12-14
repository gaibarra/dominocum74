const listeners = new Map();
const HEARTBEAT_MS = 30000;

const resolveSocket = (connection) => {
  if (!connection) return null;
  if (connection.socket) return connection.socket;
  return connection;
};

const sendMessage = (socket, payload) => {
  if (!socket || socket.readyState !== socket.OPEN) return false;
  try {
    socket.send(JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Failed to send realtime payload', err);
    return false;
  }
};

const closeConnection = (connection) => {
  if (connection?.end) {
    try {
      connection.end();
    } catch {}
  }
  const socket = resolveSocket(connection);
  if (socket?.close) {
    try {
      socket.close();
    } catch {}
  }
};

const cleanupSocket = (gameId, socket) => {
  if (!listeners.has(gameId)) return;
  const bucket = listeners.get(gameId);
  bucket.delete(socket);
  if (!bucket.size) {
    listeners.delete(gameId);
  }
};

export const subscribeToGameEvents = (gameId, connection) => {
  const socket = resolveSocket(connection);
  if (!gameId || !socket) {
    closeConnection(connection);
    return;
  }

  if (!listeners.has(gameId)) {
    listeners.set(gameId, new Set());
  }
  listeners.get(gameId).add(socket);

  const interval = setInterval(() => {
    sendMessage(socket, { type: 'PING', ts: Date.now() });
  }, HEARTBEAT_MS);

  socket.on('close', () => {
    clearInterval(interval);
    cleanupSocket(gameId, socket);
  });

  socket.on('error', () => {
    clearInterval(interval);
    cleanupSocket(gameId, socket);
  });

  sendMessage(socket, { type: 'READY', gameId, ts: Date.now() });
};

export const publishGameEvent = (gameId, event) => {
  if (!gameId || !listeners.has(gameId) || !event?.type) {
    return;
  }
  const payload = {
    ...event,
    gameId,
    ts: Date.now(),
  };
  const bucket = listeners.get(gameId);
  for (const socket of bucket) {
    const delivered = sendMessage(socket, payload);
    if (!delivered) {
      cleanupSocket(gameId, socket);
    }
  }
};
