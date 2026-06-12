// server/src/sockets/meetingSocket.js
const webrtcService = require('../services/webrtcService');

module.exports = (socket, io) => {
  // Initiate a call
  socket.on('call-user', ({ offer, to, fromName, fromId }) => {
    console.log(`📞 Call from ${fromName} (${socket.userId}) to ${to}`);
    
    webrtcService.initiateCall(socket, io, to, socket.userId, fromName, offer);
  });

  // Accept a call
  socket.on('accept-call', ({ answer, to, callId }) => {
    console.log(`✅ Call accepted by ${socket.userId}`);
    
    webrtcService.acceptCall(socket, io, callId, to, answer);
  });

  // Reject a call
  socket.on('reject-call', ({ to, callId }) => {
    console.log(`❌ Call rejected by ${socket.userId}`);
    
    webrtcService.rejectCall(socket, io, callId, to);
  });

  // End a call
  socket.on('end-call', ({ to, callId }) => {
    console.log(`🔴 Call ended by ${socket.userId}`);
    
    webrtcService.endCall(socket, io, callId, socket.userId);
  });

  // ICE Candidate for WebRTC
  socket.on('ice-candidate', ({ candidate, to }) => {
    console.log(`🧊 ICE candidate from ${socket.userId} to ${to}`);
    
    webrtcService.forwardIceCandidate(socket, io, to, candidate);
  });

  // Screen sharing
  socket.on('screen-share', ({ to, isSharing }) => {
    console.log(`📺 User ${socket.userId} ${isSharing ? 'started' : 'stopped'} screen sharing`);
    
    socket.to(to).emit('screen-share-status', {
      from: socket.userId,
      isSharing
    });
  });

  // Mute/unmute audio
  socket.on('toggle-audio', ({ to, isMuted }) => {
    socket.to(to).emit('audio-toggled', {
      from: socket.userId,
      isMuted
    });
  });

  // Mute/unmute video
  socket.on('toggle-video', ({ to, isMuted }) => {
    socket.to(to).emit('video-toggled', {
      from: socket.userId,
      isMuted
    });
  });

  // Join meeting room
  socket.on('join-meeting', ({ meetingId, userName }) => {
    socket.join(`meeting:${meetingId}`);
    console.log(`User ${userName} joined meeting ${meetingId}`);
    
    socket.to(`meeting:${meetingId}`).emit('user-joined-meeting', {
      userId: socket.userId,
      userName
    });
  });

  // Leave meeting room
  socket.on('leave-meeting', ({ meetingId, userName }) => {
    socket.leave(`meeting:${meetingId}`);
    console.log(`User ${userName} left meeting ${meetingId}`);
    
    socket.to(`meeting:${meetingId}`).emit('user-left-meeting', {
      userId: socket.userId,
      userName
    });
  });
};