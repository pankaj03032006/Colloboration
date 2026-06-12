const Workspace = require('../models/Workspace');
const Channel = require('../models/Channel');
const User = require('../models/User');

// @desc    Create workspace
const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }]
    });
    
    const generalChannel = await Channel.create({
      name: 'general',
      workspace: workspace._id,
      createdBy: req.user.id
    });
    
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's workspaces
const getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user.id
    }).populate('channels members.user', '-password');
    
    res.json({ success: true, workspaces });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get workspace by ID
const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('channels')
      .populate('members.user', 'name email avatar status');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    res.json({ success: true, workspace });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Invite user to workspace
const inviteToWorkspace = async (req, res) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMember = workspace.members.some(m => m.user.toString() === userToInvite._id.toString());
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }
    
    workspace.members.push({ user: userToInvite._id, role: role || 'member' });
    await workspace.save();
    
    res.json({ success: true, message: 'User invited successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Join workspace
const joinWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const isMember = workspace.members.some(m => m.user.toString() === req.user.id);
    if (isMember) {
      return res.status(400).json({ message: 'Already a member' });
    }
    
    workspace.members.push({ user: req.user.id, role: 'member' });
    await workspace.save();
    
    res.json({ success: true, message: 'Joined workspace successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  inviteToWorkspace,
  joinWorkspace
};