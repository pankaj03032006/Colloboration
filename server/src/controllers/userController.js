const User = require('../models/User');

// @desc    Get all users in workspace
// @route   GET /api/users/workspace/:workspaceId
const getUsersInWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const users = await User.find({
      _id: { $in: workspace.members.map(m => m.user) }
    }).select('-password');
    
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, avatar, status } = req.body;
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (status) user.status = status;
    
    await user.save();
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getUsersInWorkspace, updateProfile };