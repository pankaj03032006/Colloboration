const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  avatar: {
    type: String,
    default: null,
  },
  // New profile fields
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters'],
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'online',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  workspaces: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
  }],
}, {
  timestamps: true,
});

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastSeen: -1 });

// Virtual for full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    location: this.location,
    website: this.website,
    status: this.status,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt
  };
});

// THIS IS THE CORRECT PRE-SAVE HOOK SYNTAX
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last seen
userSchema.methods.updateLastSeen = async function() {
  this.lastSeen = new Date();
  await this.save();
  return this.lastSeen;
};

// Method to get public profile (excludes sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    location: this.location,
    status: this.status,
    lastSeen: this.lastSeen
  };
};

// Static method to find users by workspace
userSchema.statics.findByWorkspace = function(workspaceId) {
  return this.find({ workspaces: workspaceId }).select('-password');
};

// Static method to get online users
userSchema.statics.getOnlineUsers = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.find({ 
    status: 'online',
    lastSeen: { $gt: fiveMinutesAgo }
  }).select('-password');
};

module.exports = mongoose.model('User', userSchema);