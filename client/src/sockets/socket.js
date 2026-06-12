// server/src/sockets/socket.js
const chatSocket = require('./chatSocket');
const meetingSocket = require('./meetingSocket');
const notificationSocket = require('./notificationSocket');
const socketService = require('../services/socketService');

const initializeSockets = (io) => {
  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ New socket connection:', socket.userId);
    
    // Add user to online users
    const onlineUsers = socketService.addUser(socket.id, socket.userId);
    io.emit('users-online', onlineUsers);

    // Initialize all socket modules
    chatSocket(socket, io);
    meetingSocket(socket, io);
    notificationSocket(socket, io);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.userId);
      const onlineUsers = socketService.removeUser(socket.id);
      io.emit('users-online', onlineUsers);
    });
  });
};

module.exports = initializeSockets;