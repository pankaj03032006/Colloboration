import io from 'socket.io-client';

let socket = null;

/**
 * Initialize socket connection
 * @param {string} token - JWT token for authentication
 * @returns {object} Socket instance
 */
export const initSocket = (token) => {
  if (!token) {
    console.error('No token provided for socket connection');
    return null;
  }

  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Reconnect manually
      socket.connect();
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
  });

  socket.on('reconnect_error', (error) => {
    console.error('❌ Socket reconnection error:', error);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Socket reconnection failed');
  });

  return socket;
};

/**
 * Get current socket instance
 * @returns {object|null} Socket instance
 */
export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized. Call initSocket first.');
    return null;
  }
  return socket;
};

/**
 * Check if socket is connected
 * @returns {boolean} Connection status
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected manually');
  }
};

/**
 * Reconnect socket
 * @returns {object|null} Socket instance
 */
export const reconnectSocket = () => {
  if (socket) {
    socket.connect();
    return socket;
  }
  return null;
};

/**
 * Join a channel room
 * @param {string} channelId - Channel ID to join
 */
export const joinChannel = (channelId) => {
  if (socket && socket.connected) {
    socket.emit('join-channel', channelId);
    console.log(`Joined channel: ${channelId}`);
  }
};

/**
 * Leave a channel room
 * @param {string} channelId - Channel ID to leave
 */
export const leaveChannel = (channelId) => {
  if (socket && socket.connected) {
    socket.emit('leave-channel', channelId);
    console.log(`Left channel: ${channelId}`);
  }
};

/**
 * Send a message to a channel
 * @param {object} messageData - Message data
 * @param {string} messageData.content - Message content
 * @param {string} messageData.channelId - Channel ID
 * @param {string} messageData.workspaceId - Workspace ID
 */
export const sendMessage = (messageData) => {
  if (socket && socket.connected) {
    socket.emit('send-message', messageData);
  } else {
    console.error('Socket not connected, cannot send message');
  }
};

/**
 * Send typing indicator
 * @param {object} typingData - Typing data
 * @param {string} typingData.channelId - Channel ID
 * @param {boolean} typingData.isTyping - Typing status
 */
export const sendTyping = (typingData) => {
  if (socket && socket.connected) {
    socket.emit('typing', typingData);
  }
};

/**
 * Delete a message
 * @param {object} deleteData - Delete data
 * @param {string} deleteData.messageId - Message ID
 * @param {string} deleteData.channelId - Channel ID
 */
export const deleteMessageSocket = (deleteData) => {
  if (socket && socket.connected) {
    socket.emit('delete-message', deleteData);
  }
};

/**
 * Edit a message
 * @param {object} editData - Edit data
 * @param {string} editData.messageId - Message ID
 * @param {string} editData.content - New content
 * @param {string} editData.channelId - Channel ID
 */
export const editMessageSocket = (editData) => {
  if (socket && socket.connected) {
    socket.emit('edit-message', editData);
  }
};

/**
 * Add reaction to a message
 * @param {object} reactionData - Reaction data
 * @param {string} reactionData.messageId - Message ID
 * @param {string} reactionData.emoji - Emoji
 * @param {string} reactionData.channelId - Channel ID
 */
export const addReactionSocket = (reactionData) => {
  if (socket && socket.connected) {
    socket.emit('add-reaction', reactionData);
  }
};

/**
 * Join a meeting room
 * @param {object} meetingData - Meeting data
 * @param {string} meetingData.meetingId - Meeting ID
 * @param {string} meetingData.userId - User ID
 * @param {string} meetingData.userName - User name
 */
export const joinMeeting = (meetingData) => {
  if (socket && socket.connected) {
    socket.emit('join-meeting', meetingData);
  }
};

/**
 * Leave a meeting room
 * @param {object} meetingData - Meeting data
 * @param {string} meetingData.meetingId - Meeting ID
 * @param {string} meetingData.userId - User ID
 */
export const leaveMeeting = (meetingData) => {
  if (socket && socket.connected) {
    socket.emit('leave-meeting', meetingData);
  }
};

/**
 * Start a call to a user
 * @param {object} callData - Call data
 * @param {object} callData.offer - WebRTC offer
 * @param {string} callData.to - Target user ID
 * @param {string} callData.fromName - Caller name
 * @param {string} callData.fromId - Caller ID
 */
export const callUser = (callData) => {
  if (socket && socket.connected) {
    socket.emit('call-user', callData);
  }
};

/**
 * Accept a call
 * @param {object} acceptData - Accept data
 * @param {object} acceptData.answer - WebRTC answer
 * @param {string} acceptData.to - Target user ID
 */
export const acceptCall = (acceptData) => {
  if (socket && socket.connected) {
    socket.emit('accept-call', acceptData);
  }
};

/**
 * Reject a call
 * @param {object} rejectData - Reject data
 * @param {string} rejectData.to - Target user ID
 */
export const rejectCall = (rejectData) => {
  if (socket && socket.connected) {
    socket.emit('reject-call', rejectData);
  }
};

/**
 * End a call
 * @param {object} endData - End data
 * @param {string} endData.to - Target user ID
 */
export const endCallSocket = (endData) => {
  if (socket && socket.connected) {
    socket.emit('end-call', endData);
  }
};

/**
 * Send ICE candidate
 * @param {object} iceData - ICE candidate data
 * @param {object} iceData.candidate - ICE candidate
 * @param {string} iceData.to - Target user ID
 */
export const sendIceCandidate = (iceData) => {
  if (socket && socket.connected) {
    socket.emit('ice-candidate', iceData);
  }
};

/**
 * Update user status
 * @param {object} statusData - Status data
 * @param {string} statusData.status - User status (online/offline/away/busy)
 */
export const updateUserStatus = (statusData) => {
  if (socket && socket.connected) {
    socket.emit('update-status', statusData);
  }
};

/**
 * Get online users
 */
export const getOnlineUsers = () => {
  if (socket && socket.connected) {
    socket.emit('get-online-users');
  }
};

/**
 * Send notification to user
 * @param {object} notificationData - Notification data
 * @param {string} notificationData.userId - Target user ID
 * @param {object} notificationData.notification - Notification content
 */
export const sendNotification = (notificationData) => {
  if (socket && socket.connected) {
    socket.emit('send-notification', notificationData);
  }
};

/**
 * Event listeners
 */
export const on = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

export const off = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

export const once = (event, callback) => {
  if (socket) {
    socket.once(event, callback);
  }
};

export const removeAllListeners = (event) => {
  if (socket) {
    if (event) {
      socket.off(event);
    } else {
      socket.removeAllListeners();
    }
  }
};

export default {
  initSocket,
  getSocket,
  isSocketConnected,
  disconnectSocket,
  reconnectSocket,
  joinChannel,
  leaveChannel,
  sendMessage,
  sendTyping,
  deleteMessageSocket,
  editMessageSocket,
  addReactionSocket,
  joinMeeting,
  leaveMeeting,
  callUser,
  acceptCall,
  rejectCall,
  endCallSocket,
  sendIceCandidate,
  updateUserStatus,
  getOnlineUsers,
  sendNotification,
  on,
  off,
  once,
  removeAllListeners
};