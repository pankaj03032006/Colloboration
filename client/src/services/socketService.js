// server/src/services/socketService.js
const connectedUsers = new Map();

class SocketService {
  // Add connected user
  addUser(socketId, userId) {
    connectedUsers.set(userId, socketId);
    console.log(`User ${userId} connected with socket ${socketId}`);
    return this.getOnlineUsers();
  }

  // Remove disconnected user
  removeUser(socketId) {
    let removedUserId = null;
    for (let [userId, sId] of connectedUsers.entries()) {
      if (sId === socketId) {
        connectedUsers.delete(userId);
        removedUserId = userId;
        break;
      }
    }
    if (removedUserId) {
      console.log(`User ${removedUserId} disconnected`);
    }
    return this.getOnlineUsers();
  }

  // Get online users list
  getOnlineUsers() {
    return Array.from(connectedUsers.keys());
  }

  // Get socket ID by user ID
  getSocketId(userId) {
    return connectedUsers.get(userId);
  }

  // Check if user is online
  isUserOnline(userId) {
    return connectedUsers.has(userId);
  }

  // Join user to workspace room
  joinWorkspace(socket, workspaceId, userId) {
    const room = `workspace:${workspaceId}`;
    socket.join(room);
    console.log(`User ${userId} joined workspace room ${room}`);
  }

  // Join user to channel room
  joinChannel(socket, channelId, userId) {
    const room = `channel:${channelId}`;
    socket.join(room);
    console.log(`User ${userId} joined channel room ${room}`);
  }

  // Leave channel room
  leaveChannel(socket, channelId, userId) {
    const room = `channel:${channelId}`;
    socket.leave(room);
    console.log(`User ${userId} left channel room ${room}`);
  }

  // Emit to specific user
  emitToUser(io, userId, event, data) {
    const socketId = this.getSocketId(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Emit to workspace room
  emitToWorkspace(io, workspaceId, event, data) {
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }

  // Emit to channel room
  emitToChannel(io, channelId, event, data) {
    io.to(`channel:${channelId}`).emit(event, data);
  }

  // Broadcast typing indicator
  sendTyping(io, channelId, userId, isTyping) {
    io.to(`channel:${channelId}`).emit('user-typing', {
      userId,
      isTyping
    });
  }
}

module.exports = new SocketService();