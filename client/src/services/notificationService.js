// server/src/services/notificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  // Create a new notification
  async createNotification(userId, type, content, relatedId = null) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        content,
        relatedId,
        read: false,
        createdAt: new Date()
      });
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 50) {
    try {
      const notifications = await Notification.find({ user: userId })
        .sort('-createdAt')
        .limit(limit);
      
      const unreadCount = await Notification.countDocuments({ 
        user: userId, 
        read: false 
      });
      
      return { notifications, unreadCount };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { read: true },
        { new: true }
      );
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
      );
      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      await Notification.findOneAndDelete({ _id: notificationId, user: userId });
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Send notification via socket
  async sendNotification(socket, userId, notification) {
    if (socket && socket.connected) {
      socket.to(userId).emit('new-notification', notification);
    }
  }
}

module.exports = new NotificationService();