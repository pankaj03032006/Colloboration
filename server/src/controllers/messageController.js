const Message = require('../models/Message');
const Workspace = require('../models/Workspace');

// @desc    Send message
const sendMessage = async (req, res) => {
  try {
    const { content, channelId, workspaceId, type, fileUrl, fileName, fileSize, fileType } = req.body;
    
    const message = await Message.create({
      content,
      sender: req.user.id,
      channel: channelId,
      workspace: workspaceId,
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize,
      fileType
    });
    
    const populatedMessage = await message.populate('sender', 'name email avatar');
    
    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update message
const updateMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    message.content = content;
    message.isEdited = true;
    await message.save();
    
    const updatedMessage = await message.populate('sender', 'name email avatar');
    
    res.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete message
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const isSender = message.sender.toString() === req.user.id;
    
    if (!isSender) {
      const workspace = await Workspace.findById(message.workspace);
      const isAdmin = workspace?.members.some(m => m.user.toString() === req.user.id && m.role === 'admin');
      
      if (!isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }
    
    await message.deleteOne();
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add reaction
const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user.id && r.emoji === emoji
    );
    
    if (existingReaction) {
      message.reactions = message.reactions.filter(r => !(r.user.toString() === req.user.id && r.emoji === emoji));
    } else {
      message.reactions.push({ user: req.user.id, emoji });
    }
    
    await message.save();
    
    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  updateMessage,
  deleteMessage,
  addReaction
};