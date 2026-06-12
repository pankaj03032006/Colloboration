const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const Workspace = require('../models/Workspace');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// @desc    Upload file
router.post('/upload', protect, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Send file message
router.post('/file', protect, async (req, res) => {
  try {
    const { fileUrl, fileName, fileSize, fileType, channelId, workspaceId } = req.body;
    
    const messageType = fileType.startsWith('image/') ? 'image' : 'file';
    
    const message = await Message.create({
      content: fileName,
      sender: req.user.id,
      channel: channelId,
      workspace: workspaceId,
      type: messageType,
      fileUrl,
      fileName,
      fileSize,
      fileType
    });
    
    const populatedMessage = await message.populate('sender', 'name email avatar');
    
    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Error sending file message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send text message
router.post('/', protect, async (req, res) => {
  try {
    const { content, channelId, workspaceId } = req.body;
    
    const message = await Message.create({
      content,
      sender: req.user.id,
      channel: channelId,
      workspace: workspaceId,
      type: 'text'
    });
    
    const populatedMessage = await message.populate('sender', 'name email avatar');
    
    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get messages for channel
router.get('/channel/:channelId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ 
      channel: req.params.channelId, 
      isDeleted: false 
    })
      .populate('sender', 'name email avatar')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add or remove reaction from message
// @route   POST /api/messages/:id/reactions
router.post('/:id/reactions', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user.id && r.emoji === emoji
    );
    
    let action = existingReaction ? 'removed' : 'added';
    
    await message.addReaction(req.user.id, emoji);
    
    const populatedMessage = await Message.findById(req.params.id)
      .populate('reactions.user', 'name email avatar');
    
    res.json({ 
      success: true, 
      action,
      reactions: populatedMessage.reactions,
      summary: populatedMessage.getReactionSummary()
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get reactions for a message
// @route   GET /api/messages/:id/reactions
router.get('/:id/reactions', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('reactions.user', 'name email avatar');
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.json({ 
      success: true, 
      reactions: message.reactions,
      summary: message.getReactionSummary()
    });
  } catch (error) {
    console.error('Error getting reactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete message
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    const isSender = message.sender.toString() === req.user.id;
    
    if (!isSender) {
      const workspace = await Workspace.findById(message.workspace);
      const isAdmin = workspace?.members.some(
        m => m.user.toString() === req.user.id && m.role === 'admin'
      );
      
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }
    
    if (message.fileUrl) {
      const filename = message.fileUrl.split('/').pop();
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await message.deleteOne();
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Clear channel messages
router.delete('/channel/:channelId/clear', protect, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }
    
    const workspace = await Workspace.findById(channel.workspace);
    const isAdmin = workspace?.members.some(
      m => m.user.toString() === req.user.id && m.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can clear chat' });
    }
    
    const messages = await Message.find({ channel: req.params.channelId });
    for (const message of messages) {
      if (message.fileUrl) {
        const filename = message.fileUrl.split('/').pop();
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    
    await Message.deleteMany({ channel: req.params.channelId });
    
    res.json({ success: true, message: 'Chat cleared' });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;