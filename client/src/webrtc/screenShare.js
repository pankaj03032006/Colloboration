import { getDisplayMedia } from './mediaDevices';

export class ScreenShareManager {
  constructor() {
    this.screenStream = null;
    this.isSharing = false;
  }

  async startScreenShare() {
    try {
      this.screenStream = await getDisplayMedia({ video: true, audio: true });
      this.isSharing = true;
      
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };
      
      return this.screenStream;
    } catch (error) {
      console.error('Error sharing screen:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    this.isSharing = false;
  }

  replaceVideoTrack(peerConnection, newStream) {
    if (peerConnection && newStream) {
      const senders = peerConnection.getSenders();
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      
      if (videoSender) {
        videoSender.replaceTrack(newStream.getVideoTracks()[0]);
      }
    }
  }
}

export default new ScreenShareManager();