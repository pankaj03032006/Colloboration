// server/src/sockets/notificationSocket.js
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');

module.exports = (socket, io) => {
  // Get user notifications
  socket.on('get-notifications', async () => {
    try {
      const notifications = await Notification.find({ user: socket.userId })
        .sort('-createdAt')
        .limit(50);
      
      const unreadCount = await Notification.countDocuments({
        user: socket.userId,
        read: false
      });
      
      socket.emit('notifications-list', {
        notifications,
        unreadCount
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  });

  // Mark notification as read
  socket.on('mark-notification-read', async ({ notificationId }) => {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, user: socket.userId },
        { read: true }
      );
      
      // Update unread count
      const unreadCount = await Notification.countDocuments({
        user: socket.userId,
        read: false
      });
      
      socket.emit('notification-updated', { notificationId, unreadCount });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });

  // Mark all notifications as read
  socket.on('mark-all-notifications-read', async () => {
    try {
      await Notification.updateMany(
        { user: socket.userId, read: false },
        { read: true }
      );
      
      socket.emit('all-notifications-read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  });

  // Delete notification
  socket.on('delete-notification', async ({ notificationId }) => {
    try {
      await Notification.findOneAndDelete({
        _id: notificationId,
        user: socket.userId
      });
      
      socket.emit('notification-deleted', { notificationId });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  });

  // Send notification to specific user
  socket.on('send-notification', async ({ toUserId, type, content, relatedId }) => {
    try {
      const notification = await Notification.create({
        user: toUserId,
        type,
        content,
        relatedId,
        read: false
      });
      
      // Send real-time notification
      socketService.emitToUser(io, toUserId, 'new-notification', notification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });

  // Typing notification (for DMs)
  socket.on('user-typing-notification', ({ toUserId, isTyping }) => {
    socketService.emitToUser(io, toUserId, 'dm-typing', {
      from: socket.userId,
      isTyping
    });
  });
};