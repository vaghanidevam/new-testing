const CourseProgress = require("./courseProgress");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ A user connected:", socket.id);
 
 
 
    socket.on('receiveMessage', (data) => {
    console.log('Received message:', data.message);
    // Handle the message, e.g., broadcast it to other clients
  });
    // Custom Event: 'join-room'
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
      socket.to(roomId).emit("user-joined", socket.id);
    });

    // Custom Event: 'send-message'
    socket.on("send-message", ({ roomId, message }) => {
      console.log(`Message from ${socket.id} in room ${roomId}:`, message);
      io.to(roomId).emit("receive-message", {
        senderId: socket.id,
        message,
      });
     
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });
};
