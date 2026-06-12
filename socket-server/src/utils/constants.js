// API URLs
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system'
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer'
};

// Channel types
export const CHANNEL_TYPES = {
  TEXT: 'text',
  VOICE: 'voice',
  ANNOUNCEMENT: 'announcement'
};

// User status
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy'
};

// Socket events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Chat
  JOIN_CHANNEL: 'join-channel',
  LEAVE_CHANNEL: 'leave-channel',
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  TYPING: 'typing',
  USER_TYPING: 'user-typing',
  DELETE_MESSAGE: 'delete-message',
  MESSAGE_DELETED: 'message-deleted',
  EDIT_MESSAGE: 'edit-message',
  MESSAGE_EDITED: 'message-edited',
  ADD_REACTION: 'add-reaction',
  REACTION_ADDED: 'reaction-added',
  CLEAR_CHAT: 'clear-chat',
  CHAT_CLEARED: 'chat-cleared',
  
  // Meeting
  JOIN_MEETING: 'join-meeting',
  LEAVE_MEETING: 'leave-meeting',
  CALL_USER: 'call-user',
  ACCEPT_CALL: 'accept-call',
  REJECT_CALL: 'reject-call',
  END_CALL: 'end-call',
  ICE_CANDIDATE: 'ice-candidate',
  INCOMING_CALL: 'incoming-call',
  CALL_ACCEPTED: 'call-accepted',
  CALL_REJECTED: 'call-rejected',
  CALL_ENDED: 'call-ended',
  USER_JOINED_MEETING: 'user-joined-meeting',
  USER_LEFT_MEETING: 'user-left-meeting',
  TOGGLE_AUDIO: 'toggle-audio',
  TOGGLE_VIDEO: 'toggle-video',
  START_SCREEN_SHARE: 'start-screen-share',
  STOP_SCREEN_SHARE: 'stop-screen-share',
  
  // Presence
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  UPDATE_STATUS: 'update-status',
  USER_STATUS_CHANGED: 'user-status-changed',
  GET_ONLINE_USERS: 'get-online-users',
  
  // Notification
  SEND_NOTIFICATION: 'send-notification',
  NEW_NOTIFICATION: 'new-notification',
  NOTIFICATION_READ: 'notification-read'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  WORKSPACE: 'currentWorkspace',
  CHANNEL: 'currentChannel'
};

// Common reactions
export const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

// Date formats
export const DATE_FORMATS = {
  MESSAGE_TIME: 'h:mm a',
  MESSAGE_DATE: 'MMM d, h:mm a',
  FULL_DATE: 'MMMM d, yyyy',
  SHORT_DATE: 'MMM d, yyyy'
};

export default {
  API_URL,
  SOCKET_URL,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  MESSAGE_TYPES,
  USER_ROLES,
  CHANNEL_TYPES,
  USER_STATUS,
  SOCKET_EVENTS,
  STORAGE_KEYS,
  COMMON_REACTIONS,
  DATE_FORMATS
};