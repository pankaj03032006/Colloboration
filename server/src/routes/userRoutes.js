const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');

// ==================== AVATAR UPLOAD CONFIGURATION ====================

const avatarUploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarUploadDir)) {
  fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const avatarUpload = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (JPEG, PNG, GIF, WEBP)'));
    }
  }
});

// ==================== PROFILE ROUTES ====================

// @desc    Get user profile
// @route   GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, bio, location, website, status } = req.body;
    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (status) user.status = status;
    
    await user.save();
    
    res.json({ 
      success: true, 
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        status: user.status
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Upload avatar
// @route   POST /api/users/avatar
router.post('/avatar', protect, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    
    // Delete old avatar if exists and not default
    if (user.avatar && !user.avatar.includes('default-avatar')) {
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();
    
    res.json({ success: true, avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// @desc    Delete avatar
// @route   DELETE /api/users/avatar
router.delete('/avatar', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.avatar && !user.avatar.includes('default-avatar')) {
      const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    user.avatar = null;
    await user.save();
    
    res.json({ success: true, message: 'Avatar removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SECURITY ROUTES ====================

// @desc    Change password
// @route   POST /api/users/change-password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== ACCOUNT MANAGEMENT ROUTES ====================

// @desc    Delete user account
// @route   DELETE /api/users/account
router.delete('/account', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete user's messages
    await Message.deleteMany({ sender: userId });
    
    // Remove user from all workspaces
    await Workspace.updateMany(
      { 'members.user': userId },
      { $pull: { members: { user: userId } } }
    );
    
    // Delete user's workspaces where they are the owner
    const ownedWorkspaces = await Workspace.find({ owner: userId });
    for (const workspace of ownedWorkspaces) {
      // Delete all messages in workspace
      await Message.deleteMany({ workspace: workspace._id });
      // Delete workspace
      await workspace.deleteOne();
    }
    
    // Delete user's avatar if exists
    const user = await User.findById(userId);
    if (user.avatar && !user.avatar.includes('default-avatar')) {
      const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== USER DATA ROUTES ====================

// @desc    Get user's workspaces
// @route   GET /api/users/workspaces
router.get('/workspaces', protect, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.user.id
    }).populate('channels members.user', '-password');
    
    res.json({ success: true, workspaces });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's messages
// @route   GET /api/users/messages
router.get('/messages', protect, async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ sender: req.user.id })
      .populate('channel workspace', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Message.countDocuments({ sender: req.user.id });
    
    res.json({ 
      success: true, 
      messages,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Export user data
// @route   GET /api/users/export-data
router.get('/export-data', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const workspaces = await Workspace.find({ 'members.user': req.user.id });
    const messages = await Message.find({ sender: req.user.id })
      .populate('channel workspace', 'name');
    
    const exportData = {
      user: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        website: user.website,
        status: user.status,
        createdAt: user.createdAt
      },
      workspaces: workspaces.map(w => ({
        name: w.name,
        description: w.description,
        role: w.members.find(m => m.user.toString() === req.user.id)?.role,
        joinedAt: w.members.find(m => m.user.toString() === req.user.id)?.joinedAt
      })),
      messages: messages.map(m => ({
        content: m.content,
        channel: m.channel?.name,
        workspace: m.workspace?.name,
        createdAt: m.createdAt,
        type: m.type
      })),
      exportDate: new Date()
    };
    
    res.json({ success: true, data: exportData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;