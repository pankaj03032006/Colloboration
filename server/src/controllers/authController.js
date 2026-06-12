const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('Registration attempt:', { name, email });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields: name, email, password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    // Create user - THIS WILL TRIGGER THE PRE-SAVE HOOK
    const user = await User.create({
      name,
      email,
      password
    });

    console.log('User created successfully:', user._id);

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Invalid user data' 
      });
    }
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

// @desc    Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('========== LOGIN ATTEMPT ==========');
    console.log('Email:', email);
    console.log('Password provided:', password ? 'Yes (length: ' + password.length + ')' : 'No');

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ 
        success: false,
        message: 'Please provide both email and password' 
      });
    }

    // Check for user email
    console.log('🔍 Looking for user in database...');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User NOT found in database:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }
    
    console.log('✅ User found in database:', {
      id: user._id,
      name: user.name,
      email: user.email,
      hasPassword: !!user.password,
      passwordHashLength: user.password ? user.password.length : 0
    });

    // Check password
    console.log('🔐 Comparing passwords...');
    const isPasswordMatch = await user.comparePassword(password);
    console.log('Password match result:', isPasswordMatch);
    
    if (!isPasswordMatch) {
      console.log('❌ Password does NOT match for user:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Password matched successfully!');

    // Update last seen and status
    user.lastSeen = Date.now();
    user.status = 'online';
    await user.save();
    
    console.log('📝 User status updated to online');

    const token = generateToken(user._id);
    console.log('🎫 Token generated successfully');
    console.log('========== LOGIN SUCCESSFUL ==========');

    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      token: token
    });
  } catch (error) {
    console.error('❌ Login error details:', error);
    console.log('========== LOGIN FAILED ==========');
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message 
    });
  }
};

// @desc    Get current user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching profile' 
    });
  }
};

// @desc    Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['online', 'offline', 'away', 'busy'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status value' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    user.status = status;
    user.lastSeen = Date.now();
    await user.save();
    
    res.json({ 
      success: true,
      status: user.status, 
      lastSeen: user.lastSeen 
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating status' 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserStatus
};