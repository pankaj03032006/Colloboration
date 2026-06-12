// server/src/services/socketService.js
class SocketService {
  constructor() {
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.rooms = new Map(); // roomId -> Set of socketIds
  }

  // Add connected user
  addUser(socketId, userId) {
    this.connectedUsers.set(userId, socketId);
    this.userSockets.set(socketId, userId);
    console.log(`✅ User ${userId} connected with socket ${socketId}`);
    console.log(`📊 Online users: ${this.getOnlineUsers().length}`);
    return this.getOnlineUsers();
  }

  // Remove disconnected user
  removeUser(socketId) {
    const userId = this.userSockets.get(socketId);
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socketId);
      console.log(`❌ User ${userId} disconnected`);
      console.log(`📊 Online users: ${this.getOnlineUsers().length}`);
    }
    return this.getOnlineUsers();
  }

  // Get online users list
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  // Get socket ID by user ID
  getSocketId(userId) {
    return this.connectedUsers.get(userId);
  }

  // Get user ID by socket ID
  getUserId(socketId) {
    return this.userSockets.get(socketId);
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Join room
  joinRoom(socket, roomId) {
    socket.join(roomId);
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(socket.id);
    
    console.log(`User joined room: ${roomId}`);
    return this.getRoomUsers(roomId);
  }

  // Leave room
  leaveRoom(socket, roomId) {
    socket.leave(roomId);
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(socket.id);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    console.log(`User left room: ${roomId}`);
    return this.getRoomUsers(roomId);
  }

  // Get room users count
  getRoomUsers(roomId) {
    if (!this.rooms.has(roomId)) return [];
    
    const socketIds = Array.from(this.rooms.get(roomId));
    const userIds = socketIds.map(socketId => this.getUserId(socketId)).filter(id => id);
    return userIds;
  }

  // Get room user count
  getRoomUserCount(roomId) {
    return this.rooms.has(roomId) ? this.rooms.get(roomId).size : 0;
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

  // Emit to room
  emitToRoom(io, roomId, event, data) {
    io.to(roomId).emit(event, data);
  }

  // Broadcast to all except sender
  broadcastToRoomExcept(io, roomId, event, data, exceptSocketId) {
    io.to(roomId).except(exceptSocketId).emit(event, data);
  }

  // Get all rooms
  getAllRooms() {
    return Array.from(this.rooms.keys());
  }

  // Get all connected users
  getAllConnectedUsers() {
    return Array.from(this.connectedUsers.entries()).map(([userId, socketId]) => ({
      userId,
      socketId
    }));
  }
}

module.exports = new SocketService();