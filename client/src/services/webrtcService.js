import Peer from 'simple-peer';

class WebRTCService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.callListeners = {};
  }

  async initLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      return this.localStream;
    } catch (error) {
      console.error('Error getting media devices:', error);
      throw error;
    }
  }

  startCall(socket, toUserId, fromName, fromId) {
    this.peer = new Peer({ initiator: true, stream: this.localStream });
    
    this.peer.on('signal', (data) => {
      socket.emit('call-user', {
        offer: data,
        to: toUserId,
        fromName: fromName,
        fromId: fromId
      });
    });

    this.peer.on('stream', (stream) => {
      this.remoteStream = stream;
      if (this.callListeners.onRemoteStream) {
        this.callListeners.onRemoteStream(stream);
      }
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (this.callListeners.onError) {
        this.callListeners.onError(err);
      }
    });

    this.peer.on('close', () => {
      if (this.callListeners.onClose) {
        this.callListeners.onClose();
      }
    });

    return this.peer;
  }

  acceptCall(socket, offer, fromUserId) {
    this.peer = new Peer({ initiator: false, stream: this.localStream });
    
    this.peer.on('signal', (data) => {
      socket.emit('accept-call', { answer: data, to: fromUserId });
    });

    this.peer.on('stream', (stream) => {
      this.remoteStream = stream;
      if (this.callListeners.onRemoteStream) {
        this.callListeners.onRemoteStream(stream);
      }
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (this.callListeners.onError) {
        this.callListeners.onError(err);
      }
    });

    this.peer.signal(offer);
    return this.peer;
  }

  addICECandidate(candidate) {
    if (this.peer) {
      this.peer.signal(candidate);
    }
  }

  endCall() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  on(event, callback) {
    this.callListeners[event] = callback;
  }
}

export default new WebRTCService();