const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const channelRoutes = require('./routes/channelRoutes');
const messageRoutes = require('./routes/messageRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Store meeting participants
const meetingParticipants = new Map(); // meetingId -> Map of socketId -> { userId, userName }

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.io connection handling with Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.userId);
  
  // Join workspace room
  socket.on('join-workspace', (workspaceId) => {
    socket.join(`workspace:${workspaceId}`);
    console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
  });
  
  // Join channel room
  socket.on('join-channel', (channelId) => {
    socket.join(`channel:${channelId}`);
    console.log(`User ${socket.userId} joined channel ${channelId}`);
    
    socket.to(`channel:${channelId}`).emit('user-joined', {
      userId: socket.userId,
      message: 'User joined the channel'
    });
  });
  
  // Leave channel
  socket.on('leave-channel', (channelId) => {
    socket.leave(`channel:${channelId}`);
    console.log(`User ${socket.userId} left channel ${channelId}`);
  });
  
  // ========== MEETING ROOM EVENTS ==========
  
  // Join a meeting room
  socket.on('join-meeting', ({ meetingId, userId, userName }) => {
    console.log(`📹 JOIN MEETING: ${userName} (${userId}) joining ${meetingId}`);
    
    // Store socket info
    socket.meetingId = meetingId;
    socket.userName = userName;
    
    // Add to meeting participants
    if (!meetingParticipants.has(meetingId)) {
      meetingParticipants.set(meetingId, new Map());
    }
    const meeting = meetingParticipants.get(meetingId);
    meeting.set(socket.id, { userId, userName });
    
    // Join socket room
    socket.join(`meeting:${meetingId}`);
    
    // Get existing participants (excluding current user)
    const existingParticipants = [];
    for (const [sid, data] of meeting.entries()) {
      if (sid !== socket.id) {
        existingParticipants.push({
          userId: data.userId,
          userName: data.userName
        });
      }
    }
    
    console.log(`📹 Existing participants in ${meetingId}:`, existingParticipants.length);
    
    // Send existing participants to the new user
    socket.emit('meeting-participants', { participants: existingParticipants });
    
    // Notify all other users about new participant
    socket.to(`meeting:${meetingId}`).emit('user-joined-meeting', {
      userId,
      userName
    });
  });
  
  // Leave a meeting room
  socket.on('leave-meeting', ({ meetingId, userId }) => {
    console.log(`📹 LEAVE MEETING: User ${userId} leaving ${meetingId}`);
    
    // Remove from meeting participants
    if (meetingParticipants.has(meetingId)) {
      const meeting = meetingParticipants.get(meetingId);
      meeting.delete(socket.id);
      if (meeting.size === 0) {
        meetingParticipants.delete(meetingId);
      }
    }
    
    socket.leave(`meeting:${meetingId}`);
    socket.to(`meeting:${meetingId}`).emit('user-left-meeting', { userId });
  });
  
  // Handle sending messages
  socket.on('send-message', async (data) => {
    console.log('📨 Received message:', data);
    
    try {
      const { content, channelId, workspaceId } = data;
      
      const Message = require('./models/Message');
      const message = await Message.create({
        content,
        sender: socket.userId,
        channel: channelId,
        workspace: workspaceId
      });
      
      const populatedMessage = await message.populate('sender', 'name email avatar');
      
      io.to(`channel:${channelId}`).emit('new-message', populatedMessage);
      console.log('✅ Message broadcasted');
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
  
  // Handle typing indicator
  socket.on('typing', ({ channelId, isTyping }) => {
    socket.to(`channel:${channelId}`).emit('user-typing', {
      userId: socket.userId,
      isTyping
    });
  });
  
  // ========== WEBRTC VIDEO CALL SIGNALING ==========
  
  // Initiate a call
  socket.on('call-user', ({ offer, to, fromName, fromId }) => {
    console.log(`📞 Call from ${fromName} (${socket.userId}) to ${to}`);
    io.to(to).emit('incoming-call', {
      offer,
      from: socket.userId,
      fromName: fromName,
      fromId: fromId
    });
  });
  
  // Accept a call
  socket.on('accept-call', ({ answer, to }) => {
    console.log(`✅ Call accepted by ${socket.userId}`);
    io.to(to).emit('call-accepted', { answer, from: socket.userId });
  });
  
  // Reject a call
  socket.on('reject-call', ({ to }) => {
    console.log(`❌ Call rejected by ${socket.userId}`);
    io.to(to).emit('call-rejected');
  });
  
  // End a call
  socket.on('end-call', ({ to }) => {
    console.log(`🔴 Call ended by ${socket.userId}`);
    io.to(to).emit('call-ended');
  });
  
  // ICE Candidate for WebRTC
  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.userId });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.userId);
    
    // Remove from meeting if in one
    if (socket.meetingId && meetingParticipants.has(socket.meetingId)) {
      const meeting = meetingParticipants.get(socket.meetingId);
      meeting.delete(socket.id);
      if (meeting.size === 0) {
        meetingParticipants.delete(socket.meetingId);
      }
      socket.to(`meeting:${socket.meetingId}`).emit('user-left-meeting', { 
        userId: socket.userId 
      });
    }
  });
});

// Create basic route files that don't exist yet
const routesDir = './src/routes';

if (!fs.existsSync(`${routesDir}/userRoutes.js`)) {
  fs.writeFileSync(`${routesDir}/userRoutes.js`, `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
`);
}

if (!fs.existsSync(`${routesDir}/meetingRoutes.js`)) {
  fs.writeFileSync(`${routesDir}/meetingRoutes.js`, `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, async (req, res) => {
  res.json({ message: 'Meeting routes - coming soon' });
});

module.exports = router;
`);
}

if (!fs.existsSync(`${routesDir}/notificationRoutes.js`)) {
  fs.writeFileSync(`${routesDir}/notificationRoutes.js`, `
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  res.json({ notifications: [] });
});

module.exports = router;
`);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/collab')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\n📡 Available Routes:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/users/profile`);
  console.log(`   POST   /api/workspaces`);
  console.log(`   GET    /api/workspaces`);
  console.log(`   POST   /api/channels`);
  console.log(`   GET    /api/channels/:id/messages`);
  console.log(`   POST   /api/messages`);
  console.log(`\n🎥 WebRTC Signaling:`);
  console.log(`   call-user, accept-call, reject-call, end-call, ice-candidate`);
  console.log(`\n📹 Meeting Room Events:`);
  console.log(`   join-meeting, leave-meeting, meeting-participants`);
});