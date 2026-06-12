// server/src/sockets/meetingSocket.js
const webrtcService = require('../services/webrtcService');
const socketService = require('../services/socketService');
const Meeting = require('../models/Meeting');

module.exports = (socket, io) => {
  // Create meeting
  socket.on('create-meeting', async ({ title, description }) => {
    try {
      const meetingId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const meeting = new Meeting({
        meetingId,
        host: socket.userId,
        title,
        description,
        participants: [socket.userId]
      });
      await meeting.save();
      
      socket.join(`meeting:${meetingId}`);
      socket.emit('meeting-created', { meetingId, meeting });
    } catch (error) {
      console.error('Error creating meeting:', error);
      socket.emit('meeting-error', { error: 'Failed to create meeting' });
    }
  });

  // Join meeting
  socket.on('join-meeting', async ({ meetingId, userName }) => {
    try {
      let meeting = await Meeting.findOne({ meetingId });
      
      if (!meeting) {
        // Create new meeting if doesn't exist
        meeting = new Meeting({
          meetingId,
          host: socket.userId,
          title: `Meeting ${meetingId}`,
          participants: [socket.userId]
        });
        await meeting.save();
      }
      
      if (!meeting.participants.includes(socket.userId)) {
        meeting.participants.push(socket.userId);
        await meeting.save();
      }
      
      socket.join(`meeting:${meetingId}`);
      
      socket.emit('meeting-joined', { meeting });
      socket.to(`meeting:${meetingId}`).emit('user-joined-meeting', {
        userId: socket.userId,
        userName,
        timestamp: new Date()
      });
      
      // Send existing participants to new user
      const participants = meeting.participants.map(p => ({ userId: p }));
      socket.emit('meeting-participants', { participants });
      
    } catch (error) {
      console.error('Error joining meeting:', error);
      socket.emit('meeting-error', { error: 'Failed to join meeting' });
    }
  });

  // Leave meeting
  socket.on('leave-meeting', async ({ meetingId, userName }) => {
    try {
      socket.leave(`meeting:${meetingId}`);
      
      const meeting = await Meeting.findOne({ meetingId });
      if (meeting) {
        meeting.participants = meeting.participants.filter(p => p.toString() !== socket.userId);
        
        if (meeting.participants.length === 0) {
          meeting.status = 'ended';
          meeting.endedAt = new Date();
        }
        await meeting.save();
      }
      
      socket.to(`meeting:${meetingId}`).emit('user-left-meeting', {
        userId: socket.userId,
        userName,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error leaving meeting:', error);
    }
  });

  // End meeting
  socket.on('end-meeting', async ({ meetingId }) => {
    try {
      const meeting = await Meeting.findOne({ meetingId });
      if (meeting && meeting.host.toString() === socket.userId) {
        meeting.status = 'ended';
        meeting.endedAt = new Date();
        await meeting.save();
        
        io.to(`meeting:${meetingId}`).emit('meeting-ended', {
          meetingId,
          endedBy: socket.userId
        });
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
    }
  });

  // WebRTC Signaling
  socket.on('call-user', ({ offer, to, fromName, fromId }) => {
    console.log(`📞 Call from ${fromName} to ${to}`);
    socket.to(to).emit('incoming-call', {
      offer,
      from: socket.userId,
      fromName,
      fromId
    });
  });

  socket.on('accept-call', ({ answer, to }) => {
    console.log(`✅ Call accepted by ${socket.userId}`);
    socket.to(to).emit('call-accepted', { answer });
  });

  socket.on('reject-call', ({ to }) => {
    console.log(`❌ Call rejected by ${socket.userId}`);
    socket.to(to).emit('call-rejected');
  });

  socket.on('end-call', ({ to }) => {
    console.log(`🔴 Call ended by ${socket.userId}`);
    socket.to(to).emit('call-ended');
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    socket.to(to).emit('ice-candidate', { candidate, from: socket.userId });
  });

  // Screen sharing
  socket.on('screen-share', ({ meetingId, isSharing }) => {
    socket.to(`meeting:${meetingId}`).emit('screen-share-status', {
      userId: socket.userId,
      isSharing
    });
  });

  // Toggle audio/video
  socket.on('toggle-audio', ({ meetingId, isMuted }) => {
    socket.to(`meeting:${meetingId}`).emit('audio-toggled', {
      userId: socket.userId,
      isMuted
    });
  });

  socket.on('toggle-video', ({ meetingId, isMuted }) => {
    socket.to(`meeting:${meetingId}`).emit('video-toggled', {
      userId: socket.userId,
      isMuted
    });
  });
};