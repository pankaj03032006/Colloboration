import { createPeerConnection, addTracksToPeer, createOffer, createAnswer, setRemoteAnswer } from './peerConnection';
import { getUserMedia, stopMediaStream } from './mediaDevices';
import ScreenShareManager from './screenShare';
import { RTC_CONFIG } from './rtcConfig';

export class MeetingManager {
  constructor() {
    this.localStream = null;
    this.remoteStreams = new Map();
    this.peerConnections = new Map();
    this.isAudioEnabled = true;
    this.isVideoEnabled = true;
  }

  async initLocalStream() {
    try {
      this.localStream = await getUserMedia({ video: true, audio: true });
      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize local stream:', error);
      throw error;
    }
  }

  async startCall(targetUserId, socket) {
    const peerConnection = createPeerConnection(RTC_CONFIG);
    this.peerConnections.set(targetUserId, peerConnection);
    
    addTracksToPeer(peerConnection, this.localStream);
    
    peerConnection.ontrack = (event) => {
      this.remoteStreams.set(targetUserId, event.streams[0]);
    };
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: targetUserId });
      }
    };
    
    const offer = await createOffer(peerConnection);
    socket.emit('call-user', { offer, to: targetUserId });
    
    return peerConnection;
  }

  async acceptCall(fromUserId, offer, socket) {
    const peerConnection = createPeerConnection(RTC_CONFIG);
    this.peerConnections.set(fromUserId, peerConnection);
    
    addTracksToPeer(peerConnection, this.localStream);
    
    peerConnection.ontrack = (event) => {
      this.remoteStreams.set(fromUserId, event.streams[0]);
    };
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: fromUserId });
      }
    };
    
    const answer = await createAnswer(peerConnection, offer);
    socket.emit('accept-call', { answer, to: fromUserId });
    
    return peerConnection;
  }

  async addIceCandidate(fromUserId, candidate) {
    const peerConnection = this.peerConnections.get(fromUserId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  toggleAudio() {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.isAudioEnabled;
      });
      this.isAudioEnabled = !this.isAudioEnabled;
    }
    return this.isAudioEnabled;
  }

  toggleVideo() {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !this.isVideoEnabled;
      });
      this.isVideoEnabled = !this.isVideoEnabled;
    }
    return this.isVideoEnabled;
  }

  async startScreenShare(peerConnection) {
    const screenStream = await ScreenShareManager.startScreenShare();
    ScreenShareManager.replaceVideoTrack(peerConnection, screenStream);
    return screenStream;
  }

  stopScreenShare(peerConnection) {
    ScreenShareManager.stopScreenShare();
    ScreenShareManager.replaceVideoTrack(peerConnection, this.localStream);
  }

  endCall() {
    this.peerConnections.forEach((pc, userId) => {
      pc.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();
    stopMediaStream(this.localStream);
    this.localStream = null;
  }
}

export default new MeetingManager();