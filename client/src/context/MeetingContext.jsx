import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';
import MeetingManager from '../webrtc/meetingManager';

export const MeetingContext = createContext();

export const MeetingProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [participants, setParticipants] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  
  const peerConnections = useRef(new Map());

  const createMeeting = async () => {
    const meetingId = Math.random().toString(36).substring(2, 10);
    await startMeeting(meetingId);
    return meetingId;
  };

  const startMeeting = async (meetingId) => {
    try {
      const stream = await MeetingManager.startMeeting(meetingId, user._id, user.name);
      setLocalStream(stream);
      setCurrentMeeting({ id: meetingId, startedAt: new Date() });
      
      socket.emit('create-meeting', { meetingId, userId: user._id, userName: user.name });
      
      setupMeetingListeners(meetingId);
    } catch (error) {
      console.error('Failed to start meeting:', error);
      throw error;
    }
  };

  const joinMeeting = async (meetingId) => {
    try {
      const stream = await MeetingManager.joinMeeting(meetingId, user._id, user.name);
      setLocalStream(stream);
      setCurrentMeeting({ id: meetingId, joinedAt: new Date() });
      
      socket.emit('join-meeting', { meetingId, userId: user._id, userName: user.name });
      
      setupMeetingListeners(meetingId);
    } catch (error) {
      console.error('Failed to join meeting:', error);
      throw error;
    }
  };

  const setupMeetingListeners = (meetingId) => {
    socket.on('user-joined', async ({ userId, userName }) => {
      MeetingManager.addParticipant(userId, userName);
      setParticipants(new Map(MeetingManager.participants));
      
      const peer = MeetingManager.createPeer(userId, true, localStream);
      peerConnections.current.set(userId, peer);
      
      const offer = await MeetingManager.createOffer(userId);
      socket.emit('offer', { to: userId, offer });
    });
    
    socket.on('offer', async ({ from, offer }) => {
      MeetingManager.addParticipant(from, 'User');
      setParticipants(new Map(MeetingManager.participants));
      
      const peer = MeetingManager.createPeer(from, false, localStream);
      peerConnections.current.set(from, peer);
      
      const answer = await MeetingManager.createAnswer(from, offer);
      socket.emit('answer', { to: from, answer });
    });
    
    socket.on('answer', async ({ from, answer }) => {
      await MeetingManager.setRemoteDescription(from, answer);
    });
    
    socket.on('ice-candidate', async ({ from, candidate }) => {
      await MeetingManager.addIceCandidate(from, candidate);
    });
    
    socket.on('user-left', ({ userId }) => {
      MeetingManager.removeParticipant(userId);
      peerConnections.current.delete(userId);
      setParticipants(new Map(MeetingManager.participants));
    });
    
    socket.on('meeting-message', ({ userId, userName, message }) => {
      setChatMessages(prev => [...prev, { userId, userName, message, timestamp: new Date() }]);
    });
  };

  const leaveMeeting = () => {
    if (currentMeeting) {
      socket.emit('leave-meeting', { meetingId: currentMeeting.id, userId: user._id });
      MeetingManager.leaveMeeting();
      setCurrentMeeting(null);
      setParticipants(new Map());
      setLocalStream(null);
      setChatMessages([]);
      peerConnections.current.clear();
    }
  };

  const toggleAudio = () => {
    const enabled = MeetingManager.toggleAudio();
    setIsAudioEnabled(enabled);
    if (currentMeeting) {
      socket.emit('toggle-audio', { meetingId: currentMeeting.id, userId: user._id, enabled });
    }
  };

  const toggleVideo = () => {
    const enabled = MeetingManager.toggleVideo();
    setIsVideoEnabled(enabled);
    if (currentMeeting) {
      socket.emit('toggle-video', { meetingId: currentMeeting.id, userId: user._id, enabled });
    }
  };

  const sendMessage = (message) => {
    if (currentMeeting) {
      socket.emit('meeting-message', {
        meetingId: currentMeeting.id,
        userId: user._id,
        userName: user.name,
        message
      });
      setChatMessages(prev => [...prev, { userId: user._id, userName: user.name, message, timestamp: new Date() }]);
    }
  };

  return (
    <MeetingContext.Provider value={{
      currentMeeting,
      participants,
      localStream,
      isAudioEnabled,
      isVideoEnabled,
      isSharingScreen,
      chatMessages,
      createMeeting,
      startMeeting,
      joinMeeting,
      leaveMeeting,
      toggleAudio,
      toggleVideo,
      sendMessage,
      MeetingManager
    }}>
      {children}
    </MeetingContext.Provider>
  );
};