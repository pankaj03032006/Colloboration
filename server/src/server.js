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

// ========== CORS Configuration ==========
const allowedOrigins = [
  'https://real-timecollabplatform.vercel.app',        // Your new Vercel URL
  'https://real-timecollabplatform.vercel.app/',   // Alternative
       // Another variant
  
];

// CORS middleware for Express
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
}));

// ========== Socket.IO Configuration ==========
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
});

// Make io accessible to routes
app.set('io', io);

// Store meeting participants
const meetingParticipants = new Map(); // meetingId -> Map of socketId -> { userId, userName }

// ========== Express Middleware ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== Routes ==========
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);

// ========== Health & Root Routes ==========

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Real-Time Collaboration Platform API',
    version: '1.0.0',
    status: '✅ Server is running',
    environment: process.env.NODE_ENV || 'production',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        status: 'PUT /api/auth/status',
      },
      users: {
        profile: 'GET /api/users/profile',
      },
      workspaces: {
        create: 'POST /api/workspaces',
        list: 'GET /api/workspaces',
      },
      channels: {
        create: 'POST /api/channels',
        messages: 'GET /api/channels/:id/messages',
      },
      messages: {
        send: 'POST /api/messages',
      },
      meetings: {
        create: 'POST /api/meetings/create',
      },
      notifications: {
        list: 'GET /api/notifications',
      },
    },
    websocket: {
      status: '✅ Socket.IO ready',
      endpoints: {
        connection: 'ws://real-time-collab-platform.onrender.com',
      },
      events: [
        'join-workspace',
        'join-channel', 
        'leave-channel',
        'send-message',
        'typing',
        'call-user',
        'accept-call',
        'reject-call',
        'end-call',
        'ice-candidate',
        'join-meeting',
        'leave-meeting',
        'meeting-participants',
      ],
    },
    cors: {
      allowedOrigins: allowedOrigins,
    },
    mongodb: {
      status: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
    },
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
  });
});

// ========== Socket.IO Authentication ==========
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.log('❌ No token provided for socket connection');
    return next(new Error('Authentication error'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    console.log('✅ Socket authenticated for user:', socket.userId);
    next();
  } catch (err) {
    console.log('❌ Invalid token for socket connection:', err.message);
    next(new Error('Authentication error'));
  }
});

// ========== Socket.IO Events ==========
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

// ========== MongoDB Connection ==========
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/collab')
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ========== Start Server ==========
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Production: https://real-time-collab-platform.onrender.com`);
  console.log(`📍 Frontend: https://real-time-collabplatform.vercel.app`);
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
  console.log(`\n🔗 WebSocket:`);
  console.log(`   ws://localhost:${PORT} or wss://real-time-collab-platform.onrender.com`);
  console.log(`\n✅ CORS allowed origins:`);
  allowedOrigins.forEach(origin => console.log(`   ${origin}`));
  console.log(`\n🌐 Server is ready for connections!`);
});

// ========== Graceful Shutdown ==========
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
