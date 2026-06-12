const setupMeetingHandlers = (io, socket) => {
  socket.on('join-meeting', (meetingId) => {
    socket.join(`meeting:${meetingId}`);
    console.log(`User ${socket.userId} joined meeting ${meetingId}`);
  });
  
  socket.on('leave-meeting', (meetingId) => {
    socket.leave(`meeting:${meetingId}`);
    socket.to(`meeting:${meetingId}`).emit('user-left', { userId: socket.userId });
  });
  
  socket.on('call-user', ({ offer, to }) => {
    io.to(to).emit('incoming-call', { offer, from: socket.userId });
  });
  
  socket.on('accept-call', ({ answer, to }) => {
    io.to(to).emit('call-accepted', { answer });
  });
  
  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { candidate });
  });
};

module.exports = { setupMeetingHandlers };