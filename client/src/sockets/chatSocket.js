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
    return this.getOnlineUsers();
  }

  // Remove disconnected user
  removeUser(socketId) {
    const userId = this.userSockets.get(socketId);
    if (userId) {
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socketId);
      console.log(`❌ User ${userId} disconnected`);
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

  // Join workspace (specific method for workspaces)
  joinWorkspace(socket, workspaceId, userId) {
    const roomName = `workspace:${workspaceId}`;
    socket.join(roomName);
    console.log(`User ${userId} joined workspace ${workspaceId}`);
    
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(socket.id);
    
    return this;
  }

  // Join channel (specific method for channels)
  joinChannel(socket, channelId, userId) {
    const roomName = `channel:${channelId}`;
    socket.join(roomName);
    console.log(`User ${userId} joined channel ${channelId}`);
    
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(socket.id);
    
    return this;
  }

  // Leave channel
  leaveChannel(socket, channelId, userId) {
    const roomName = `channel:${channelId}`;
    socket.leave(roomName);
    console.log(`User ${userId} left channel ${channelId}`);
    
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(socket.id);
      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      }
    }
    
    return this;
  }

  // Generic join room
  joinRoom(socket, roomId) {
    socket.join(roomId);
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(socket.id);
    
    return this;
  }

  // Generic leave room
  leaveRoom(socket, roomId) {
    socket.leave(roomId);
    
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(socket.id);
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    return this;
  }

  // Get room users
  getRoomUsers(roomId) {
    if (!this.rooms.has(roomId)) return [];
    
    const socketIds = Array.from(this.rooms.get(roomId));
    const userIds = socketIds.map(socketId => this.getUserId(socketId)).filter(id => id);
    return userIds;
  }

  // Get user ID by socket ID
  getUserId(socketId) {
    return this.userSockets.get(socketId);
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

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Get all rooms
  getAllRooms() {
    return Array.from(this.rooms.keys());
  }
}

module.exports = new SocketService();