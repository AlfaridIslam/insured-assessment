import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.io server instance
 * @param {import('http').Server} httpServer
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

/**
 * Returns active Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket(server) first.');
  }
  return io;
};

/**
 * Emit event to all connected clients
 * @param {string} event
 * @param {any} data
 */
export const emitEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

export default {
  initSocket,
  getIO,
  emitEvent,
};
