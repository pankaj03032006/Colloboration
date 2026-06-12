import { useState, useRef, useCallback } from 'react';

export const useWebRTC = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const peerConnection = useRef(null);

  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  const createPeerConnection = useCallback((configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }) => {
    const pc = new RTCPeerConnection(configuration);
    peerConnection.current = pc;
    return pc;
  }, []);

  const addLocalTracks = useCallback((pc, stream) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const newState = !isAudioEnabled;
      localStream.getAudioTracks().forEach(track => track.enabled = newState);
      setIsAudioEnabled(newState);
    }
  }, [localStream, isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const newState = !isVideoEnabled;
      localStream.getVideoTracks().forEach(track => track.enabled = newState);
      setIsVideoEnabled(newState);
    }
  }, [localStream, isVideoEnabled]);

  const stopStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    setRemoteStream,
    isAudioEnabled,
    isVideoEnabled,
    initLocalStream,
    createPeerConnection,
    addLocalTracks,
    toggleAudio,
    toggleVideo,
    stopStream
  };
};