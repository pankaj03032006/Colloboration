const { Server } = require('socket.io');

const io = new Server({
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  socket.userId = token;
  next();
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Chat events
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
  
  // Meeting events
  socket.on('join-meeting', (meetingId) => {
    socket.join(`meeting:${meetingId}`);
    console.log(`User ${socket.userId} joined meeting ${meetingId}`);
    socket.to(`meeting:${meetingId}`).emit('user-joined', { userId: socket.userId });
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
  
  socket.on('reject-call', ({ to }) => {
    io.to(to).emit('call-rejected');
  });
  
  socket.on('end-call', ({ to }) => {
    io.to(to).emit('call-ended');
  });
  
  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { candidate });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

const PORT = process.env.PORT || 5001;
io.listen(PORT);
console.log(`Socket server running on port ${PORT}`);