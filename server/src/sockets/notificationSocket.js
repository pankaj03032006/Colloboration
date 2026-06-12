// server/src/sockets/notificationSocket.js
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');

module.exports = (socket, io) => {
  // Get user notifications
  socket.on('get-notifications', async ({ limit = 50, offset = 0 }) => {
    try {
      const notifications = await Notification.find({ user: socket.userId })
        .sort('-createdAt')
        .skip(offset)
        .limit(limit);
      
      const total = await Notification.countDocuments({ user: socket.userId });
      const unreadCount = await Notification.countDocuments({
        user: socket.userId,
        read: false
      });
      
      socket.emit('notifications-list', {
        notifications,
        total,
        unreadCount,
        hasMore: offset + limit < total
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      socket.emit('notifications-error', { error: 'Failed to fetch notifications' });
    }
  });

  // Mark notification as read
  socket.on('mark-notification-read', async ({ notificationId }) => {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, user: socket.userId },
        { read: true }
      );
      
      const unreadCount = await Notification.countDocuments({
        user: socket.userId,
        read: false
      });
      
      socket.emit('notification-marked-read', { notificationId, unreadCount });
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
      
      socket.emit('all-notifications-marked-read');
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

  // Delete all notifications
  socket.on('delete-all-notifications', async () => {
    try {
      await Notification.deleteMany({ user: socket.userId });
      socket.emit('all-notifications-deleted');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  });

  // Send notification to specific user
  socket.on('send-notification', async ({ toUserId, type, content, relatedId, metadata }) => {
    try {
      const notification = await Notification.create({
        user: toUserId,
        type,
        content,
        relatedId,
        metadata,
        read: false
      });
      
      // Send real-time notification if user is online
      socketService.emitToUser(io, toUserId, 'new-notification', notification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });

  // Workspace invite notification
  socket.on('invite-to-workspace', async ({ toUserId, workspaceId, workspaceName }) => {
    try {
      const notification = await Notification.create({
        user: toUserId,
        type: 'workspace_invite',
        content: `${socket.userId} invited you to join workspace: ${workspaceName}`,
        relatedId: workspaceId,
        metadata: { invitedBy: socket.userId, workspaceName }
      });
      
      socketService.emitToUser(io, toUserId, 'workspace-invite', notification);
    } catch (error) {
      console.error('Error sending workspace invite:', error);
    }
  });
};