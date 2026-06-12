// server/src/sockets/chatSocket.js
const Message = require('../models/Message');
const socketService = require('../services/socketService');
const messageService = require('../services/messageService');

module.exports = (socket, io) => {
  // Join workspace
  socket.on('join-workspace', (workspaceId) => {
    socketService.joinRoom(socket, `workspace:${workspaceId}`);
    console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
  });

  // Leave workspace
  socket.on('leave-workspace', (workspaceId) => {
    socketService.leaveRoom(socket, `workspace:${workspaceId}`);
    console.log(`User ${socket.userId} left workspace ${workspaceId}`);
  });

  // Join channel
  socket.on('join-channel', (channelId) => {
    socketService.joinRoom(socket, `channel:${channelId}`);
    console.log(`User ${socket.userId} joined channel ${channelId}`);
    
    // Notify others in channel
    socket.to(`channel:${channelId}`).emit('user-joined-channel', {
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  // Leave channel
  socket.on('leave-channel', (channelId) => {
    socketService.leaveRoom(socket, `channel:${channelId}`);
    console.log(`User ${socket.userId} left channel ${channelId}`);
    
    // Notify others in channel
    socket.to(`channel:${channelId}`).emit('user-left-channel', {
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { content, channelId, workspaceId, isFile, fileUrl, fileName, fileType } = data;
      
      let messageData = {
        content,
        sender: socket.userId,
        channel: channelId,
        workspace: workspaceId
      };
      
      if (isFile && fileUrl) {
        messageData.file = {
          url: fileUrl,
          name: fileName,
          type: fileType
        };
      }
      
      const message = await Message.create(messageData);
      const populatedMessage = await message.populate('sender', 'name email avatar');
      
      // Broadcast to channel
      io.to(`channel:${channelId}`).emit('new-message', populatedMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Edit message
  socket.on('edit-message', async ({ messageId, content, channelId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && message.sender.toString() === socket.userId) {
        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();
        
        io.to(`channel:${channelId}`).emit('message-edited', {
          messageId,
          content,
          editedAt: message.editedAt
        });
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  });

  // Delete message
  socket.on('delete-message', async ({ messageId, channelId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message && message.sender.toString() === socket.userId) {
        await message.deleteOne();
        io.to(`channel:${channelId}`).emit('message-deleted', { 
          messageId, 
          channelId 
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  });

  // Clear chat
  socket.on('clear-chat', async ({ channelId }) => {
    try {
      await Message.deleteMany({ channel: channelId });
      io.to(`channel:${channelId}`).emit('chat-cleared', { channelId });
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  });

  // Typing indicator
  socket.on('typing', ({ channelId, isTyping }) => {
    socket.to(`channel:${channelId}`).emit('user-typing', {
      userId: socket.userId,
      isTyping
    });
  });

  // Add reaction
  socket.on('add-reaction', async ({ messageId, emoji, channelId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        const existingReaction = message.reactions.find(
          r => r.user.toString() === socket.userId && r.emoji === emoji
        );
        
        if (existingReaction) {
          message.reactions = message.reactions.filter(
            r => !(r.user.toString() === socket.userId && r.emoji === emoji)
          );
        } else {
          message.reactions.push({ user: socket.userId, emoji });
        }
        
        await message.save();
        
        io.to(`channel:${channelId}`).emit('reaction-updated', {
          messageId,
          reactions: message.reactions
        });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  });

  // Pin message
  socket.on('pin-message', async ({ messageId, channelId }) => {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        message.isPinned = !message.isPinned;
        await message.save();
        
        io.to(`channel:${channelId}`).emit('message-pinned', {
          messageId,
          isPinned: message.isPinned
        });
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  });
};