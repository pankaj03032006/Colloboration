// server/src/routes/workspaceRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Workspace = require('../models/Workspace');
const Channel = require('../models/Channel');
const Message = require('../models/Message');

// @desc    Create workspace
router.post('/', protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    console.log('Creating workspace for user:', req.user.id);
    
    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }]
    });
    
    console.log('Workspace created:', workspace._id);
    
    // Create default #general channel
    const generalChannel = await Channel.create({
      name: 'general',
      workspace: workspace._id,
      createdBy: req.user.id
    });
    
    console.log('General channel created:', generalChannel._id);
    
    workspace.channels.push(generalChannel._id);
    await workspace.save();
    
    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('channels')
      .populate('members.user', 'name email avatar');
    
    res.status(201).json({
      success: true,
      workspace: populatedWorkspace,
      defaultChannel: generalChannel
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

// @desc    Get user's workspaces
router.get('/', protect, async (req, res) => {
  try {
    console.log('Fetching workspaces for user:', req.user.id);
    
    const workspaces = await Workspace.find({
      'members.user': req.user.id
    }).populate('channels members.user', '-password');
    
    console.log('Found workspaces:', workspaces.length);
    
    res.json({ success: true, workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

// @desc    Join workspace by ID
router.post('/:id/join', protect, async (req, res) => {
  try {
    const workspaceId = req.params.id;
    console.log('User attempting to join workspace:', workspaceId);
    console.log('User ID:', req.user.id);
    
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        message: 'Workspace not found' 
      });
    }
    
    // Check if already a member
    const isMember = workspace.members.some(m => m.user.toString() === req.user.id);
    if (isMember) {
      return res.status(400).json({ 
        success: false, 
        message: 'Already a member of this workspace' 
      });
    }
    
    // Add user as member
    workspace.members.push({
      user: req.user.id,
      role: 'member',
      joinedAt: new Date()
    });
    
    await workspace.save();
    
    console.log('User joined workspace successfully');
    
    res.json({ 
      success: true, 
      message: 'Joined workspace successfully',
      workspace: workspace
    });
  } catch (error) {
    console.error('Error joining workspace:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

// @desc    Get workspace by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('channels')
      .populate('members.user', 'name email avatar');
    
    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        message: 'Workspace not found' 
      });
    }
    
    res.json({ success: true, workspace });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

// @desc    Delete workspace
router.delete('/:id', protect, async (req, res) => {
  try {
    const workspaceId = req.params.id;
    console.log('Attempting to delete workspace:', workspaceId);
    console.log('User ID:', req.user.id);
    
    const workspace = await Workspace.findById(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        message: 'Workspace not found' 
      });
    }
    
    // Check if user is the owner
    const isOwner = workspace.members.some(
      m => m.user.toString() === req.user.id && m.role === 'admin'
    );
    
    if (!isOwner) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only workspace owner can delete the workspace' 
      });
    }
    
    // Delete all channels in this workspace
    await Channel.deleteMany({ workspace: workspaceId });
    
    // Delete all messages in this workspace
    await Message.deleteMany({ workspace: workspaceId });
    
    // Delete the workspace
    await workspace.deleteOne();
    
    console.log('Workspace and all channels deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Workspace deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
});

module.exports = router;