const setupChatHandlers = (io, socket) => {
  socket.on('join-channel', (channelId) => {
    socket.join(`channel:${channelId}`);
    console.log(`User ${socket.userId} joined channel ${channelId}`);
  });
  
  socket.on('leave-channel', (channelId) => {
    socket.leave(`channel:${channelId}`);
    console.log(`User ${socket.userId} left channel ${channelId}`);
  });
  
  socket.on('send-message', (data) => {
    io.to(`channel:${data.channelId}`).emit('new-message', data);
  });
  
  socket.on('typing', ({ channelId, isTyping }) => {
    socket.to(`channel:${channelId}`).emit('user-typing', {
      userId: socket.userId,
      isTyping
    });
  });
};

module.exports = { setupChatHandlers };