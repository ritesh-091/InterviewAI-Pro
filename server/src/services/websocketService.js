const socketIo = require('socket.io');

/**
 * Initializes the Socket.io WebSocket server
 * @param {object} server - The HTTP server instance
 */
const initWebSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);

    // Join candidate session room
    socket.on('join-session', (room) => {
      socket.join(room);
      console.log(`Socket client ${socket.id} joined interview session room: ${room}`);
      
      socket.emit('session-joined', {
        status: 'ready',
        message: 'Successfully established real-time session socket tunnel.'
      });
    });

    // Handle real-time candidate verbal typing status updates
    socket.on('candidate-status', (data) => {
      // data: { room, status: 'speaking' | 'paused' | 'evaluating' | 'thinking' }
      let aiStatus = 'listening';
      let message = 'AI is listening closely...';

      if (data.status === 'paused') {
        aiStatus = 'analyzing';
        message = 'AI is analyzing sentence pacing and delivery fluency...';
      } else if (data.status === 'evaluating') {
        aiStatus = 'scoring';
        message = 'AI is evaluating technical logics and keyword matrices...';
      } else if (data.status === 'thinking') {
        aiStatus = 'generating';
        message = 'AI is preparing the next question prompt...';
      }

      // Broadcast changes to the room
      io.to(data.room).emit('evaluator-status', {
        status: aiStatus,
        message,
        timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initWebSocket };
