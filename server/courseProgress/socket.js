const socketIo = require('socket.io');
const { updateProgress } = require('./courseProgressController'); // Import the socket controller

// Set up Socket.io
const setupSocket = (server) => {
  const io = socketIo(server);

  // When a new client connects
  io.on('connection', (socket) => {
    console.log('User connected');

    // Listen for update-progress event and call the controller
    socket.on('update-progress', (data) => {
        console.log('Received update-progress event:', data);
      updateProgress(socket, data);
    });

    // Listen for disconnect event (optional cleanup)
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

module.exports = setupSocket;
