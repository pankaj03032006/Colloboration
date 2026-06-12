// server/src/routes/channelRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Channel = require('../models/Channel');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');

// @desc    Create channel
router.post('/', protect, async (req, res) => {
  try {
    const { name, workspaceId, type = 'public' } = req.body;
    
    const channel = await Channel.create({
      name,
      workspace: workspaceId,
      type,
      createdBy: req.user.id
    });
    
    // Add channel to workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { channels: channel._id }
    });
    
    res.status(201).json({
      success: true,
      channel
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

// @desc    Get channel messages
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find({ channel: req.params.id })
      .sort('-createdAt')
      .limit(50)
      .populate('sender', 'name email avatar');
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

// @desc    Delete channel
router.delete('/:id', protect, async (req, res) => {
  try {
    const channelId = req.params.id;
    console.log('Attempting to delete channel:', channelId);
    console.log('User ID:', req.user.id);
    
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Channel not found' 
      });
    }
    
    // Get workspace to check permissions
    const workspace = await Workspace.findById(channel.workspace);
    
    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        message: 'Workspace not found' 
      });
    }
    
    // Check if user is workspace admin or channel creator
    const isWorkspaceAdmin = workspace.members.some(
      m => m.user.toString() === req.user.id && m.role === 'admin'
    );
    const isChannelCreator = channel.createdBy.toString() === req.user.id;
    
    if (!isWorkspaceAdmin && !isChannelCreator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this channel' 
      });
    }
    
    // Don't allow deleting the default 'general' channel
    if (channel.name === 'general') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the default #general channel' 
      });
    }
    
    // Delete all messages in the channel
    await Message.deleteMany({ channel: channelId });
    
    // Remove channel from workspace's channels array
    await Workspace.findByIdAndUpdate(channel.workspace, {
      $pull: { channels: channelId }
    });
    
    // Delete the channel
    await channel.deleteOne();
    
    console.log('Channel and all messages deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Channel deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

module.exports = router;