// server/src/sockets/presenceSocket.js
const socketService = require('../services/socketService');
const User = require('../models/User');

module.exports = (socket, io) => {
  // Update user status
  socket.on('update-status', async ({ status }) => {
    try {
      const validStatuses = ['online', 'offline', 'away', 'busy'];
      if (!validStatuses.includes(status)) {
        return socket.emit('status-error', { error: 'Invalid status' });
      }
      
      await User.findByIdAndUpdate(socket.userId, {
        status,
        lastSeen: Date.now()
      });
      
      // Broadcast status update to all connected users
      io.emit('user-status-changed', {
        userId: socket.userId,
        status,
        lastSeen: Date.now()
      });
      
    } catch (error) {
      console.error('Error updating status:', error);
    }
  });

  // Get online users
  socket.on('get-online-users', () => {
    const onlineUsers = socketService.getOnlineUsers();
    socket.emit('online-users-list', { users: onlineUsers });
  });

  // Get user presence
  socket.on('get-user-presence', async ({ userId }) => {
    try {
      const isOnline = socketService.isUserOnline(userId);
      let lastSeen = null;
      
      if (!isOnline) {
        const user = await User.findById(userId).select('lastSeen status');
        if (user) {
          lastSeen = user.lastSeen;
        }
      }
      
      socket.emit('user-presence', {
        userId,
        isOnline,
        lastSeen,
        status: isOnline ? 'online' : 'offline'
      });
    } catch (error) {
      console.error('Error getting user presence:', error);
    }
  });

  // Heartbeat to keep connection alive
  socket.on('heartbeat', () => {
    socket.emit('heartbeat-ack', { timestamp: Date.now() });
  });

  // User activity tracking
  socket.on('user-active', async () => {
    try {
      await User.findByIdAndUpdate(socket.userId, {
        lastSeen: Date.now()
      });
      
      // Update status to online if it was away
      const user = await User.findById(socket.userId);
      if (user && user.status === 'away') {
        user.status = 'online';
        await user.save();
        
        io.emit('user-status-changed', {
          userId: socket.userId,
          status: 'online',
          lastSeen: Date.now()
        });
      }
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  });

  // User idle tracking
  socket.on('user-idle', async () => {
    try {
      await User.findByIdAndUpdate(socket.userId, {
        status: 'away',
        lastSeen: Date.now()
      });
      
      io.emit('user-status-changed', {
        userId: socket.userId,
        status: 'away',
        lastSeen: Date.now()
      });
    } catch (error) {
      console.error('Error updating idle status:', error);
    }
  });

  // Get typing status for DM
  socket.on('typing-dm', ({ toUserId, isTyping }) => {
    socketService.emitToUser(io, toUserId, 'dm-typing', {
      from: socket.userId,
      isTyping
    });
  });

  // Read receipt for messages
  socket.on('message-read', ({ messageId, channelId, userId }) => {
    io.to(`channel:${channelId}`).emit('message-read-receipt', {
      messageId,
      userId,
      readAt: new Date()
    });
  });

  // Get user's last seen
  socket.on('get-last-seen', async ({ userId }) => {
    try {
      const user = await User.findById(userId).select('lastSeen status');
      if (user) {
        socket.emit('last-seen-response', {
          userId,
          lastSeen: user.lastSeen,
          status: user.status
        });
      }
    } catch (error) {
      console.error('Error getting last seen:', error);
    }
  });
};