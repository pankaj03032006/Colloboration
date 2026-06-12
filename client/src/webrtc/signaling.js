class SignalingService {
  constructor(socket) {
    this.socket = socket;
    this.callbacks = {};
  }

  on(event, callback) {
    this.callbacks[event] = callback;
    this.socket.on(event, callback);
  }

  off(event) {
    if (this.callbacks[event]) {
      this.socket.off(event, this.callbacks[event]);
      delete this.callbacks[event];
    }
  }

  joinMeeting(meetingId, userId, userName) {
    this.socket.emit('join-meeting', { meetingId, userId, userName });
  }

  leaveMeeting(meetingId, userId) {
    this.socket.emit('leave-meeting', { meetingId, userId });
  }

  callUser(toUserId, offer, fromName, fromId) {
    this.socket.emit('call-user', { to: toUserId, offer, fromName, fromId });
  }

  acceptCall(toUserId, answer) {
    this.socket.emit('accept-call', { to: toUserId, answer });
  }

  rejectCall(toUserId) {
    this.socket.emit('reject-call', { to: toUserId });
  }

  endCall(toUserId) {
    this.socket.emit('end-call', { to: toUserId });
  }

  sendIceCandidate(toUserId, candidate) {
    this.socket.emit('ice-candidate', { to: toUserId, candidate });
  }

  sendMeetingMessage(meetingId, userId, userName, message) {
    this.socket.emit('meeting-message', { meetingId, userId, userName, message });
  }

  toggleAudio(meetingId, userId, enabled) {
    this.socket.emit('toggle-audio', { meetingId, userId, enabled });
  }

  toggleVideo(meetingId, userId, enabled) {
    this.socket.emit('toggle-video', { meetingId, userId, enabled });
  }
}

export default SignalingService;