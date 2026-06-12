const Channel = require('../models/Channel');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');

// @desc    Create channel
const createChannel = async (req, res) => {
  try {
    const { name, workspaceId, type } = req.body;
    
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const channel = await Channel.create({
      name,
      workspace: workspaceId,
      type: type || 'text',
      createdBy: req.user.id
    });
    
    workspace.channels.push(channel._id);
    await workspace.save();
    
    res.status(201).json({ success: true, channel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get channel messages
const getChannelMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      channel: req.params.id,
      isDeleted: false
    })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update channel
const updateChannel = async (req, res) => {
  try {
    const { name } = req.body;
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    channel.name = name;
    await channel.save();
    
    res.json({ success: true, channel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete channel
const deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    
    await Workspace.findByIdAndUpdate(channel.workspace, {
      $pull: { channels: channel._id }
    });
    
    await Message.deleteMany({ channel: channel._id });
    await channel.deleteOne();
    
    res.json({ success: true, message: 'Channel deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createChannel,
  getChannelMessages,
  updateChannel,
  deleteChannel
};