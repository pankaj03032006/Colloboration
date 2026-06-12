// server/src/services/notificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  // Create notification
  async createNotification(userId, type, content, relatedId = null, metadata = {}) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        content,
        relatedId,
        metadata,
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
  async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const notifications = await Notification.find({ user: userId })
        .sort('-createdAt')
        .skip(offset)
        .limit(limit);
      
      const total = await Notification.countDocuments({ user: userId });
      const unreadCount = await Notification.countDocuments({ 
        user: userId, 
        read: false 
      });
      
      return {
        notifications,
        total,
        unreadCount,
        hasMore: offset + limit < total
      };
    } catch (error) {
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
      
      if (!notification) {
        throw new Error('Notification not found');
      }
      
      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
      );
      
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({ 
        _id: notificationId, 
        user: userId 
      });
      
      if (!result) {
        throw new Error('Notification not found');
      }
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Delete all notifications for user
  async deleteAllNotifications(userId) {
    try {
      const result = await Notification.deleteMany({ user: userId });
      return { deletedCount: result.deletedCount };
    } catch (error) {
      throw error;
    }
  }

  // Create workspace invitation notification
  async sendWorkspaceInvitation(userId, workspaceId, workspaceName, invitedBy) {
    return this.createNotification(
      userId,
      'workspace_invite',
      `${invitedBy} invited you to join workspace: ${workspaceName}`,
      workspaceId,
      { invitedBy, workspaceName }
    );
  }

  // Create message mention notification
  async sendMentionNotification(userId, message, channelId, mentionedBy) {
    return this.createNotification(
      userId,
      'mention',
      `${mentionedBy} mentioned you in a message: ${message.substring(0, 50)}...`,
      channelId,
      { message, mentionedBy }
    );
  }

  // Create call notification
  async sendCallNotification(userId, callerName, meetingId) {
    return this.createNotification(
      userId,
      'call',
      `${callerName} is calling you`,
      meetingId,
      { callerName }
    );
  }
}

module.exports = new NotificationService();