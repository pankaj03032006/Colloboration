import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import io from 'socket.io-client';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Meeting states
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  // Use ref for peer connections
  const peerConnections = useRef({});

  // Socket connection
  useEffect(() => {
    if (user && user.token) {
      console.log('Creating socket connection for user:', user.name);
      const newSocket = io('http://localhost:5000', {
        auth: { token: user.token }
      });
      
      newSocket.on('connect', () => {
        console.log('✅ Socket connected with ID:', newSocket.id);
        if (currentChannel) {
          newSocket.emit('join-channel', currentChannel._id);
        }
      });
      
      newSocket.on('connect_error', (error) => {
        console.log('❌ Socket connection error:', error.message);
      });
      
      newSocket.on('new-message', (message) => {
        console.log('📨 New message received:', message);
        if (message.channel === currentChannel?._id) {
          setMessages(prev => [...prev, message]);
        }
      });
      
      newSocket.on('user-typing', ({ userId, isTyping }) => {
        setTypingUsers(prev => ({ ...prev, [userId]: isTyping }));
      });
      
      newSocket.on('message-deleted', ({ messageId, channelId }) => {
        if (channelId === currentChannel?._id) {
          setMessages(prev => prev.filter(msg => msg._id !== messageId));
        }
      });
      
      newSocket.on('chat-cleared', ({ channelId }) => {
        if (channelId === currentChannel?._id) {
          setMessages([]);
        }
      });
      
      newSocket.on('reaction-added', ({ messageId, emoji, userId, userName }) => {
        setMessages(prev => prev.map(msg => {
          if (msg._id === messageId) {
            const existingReaction = msg.reactions?.find(r => r.user === userId && r.emoji === emoji);
            let newReactions;
            
            if (existingReaction) {
              newReactions = msg.reactions.filter(r => !(r.user === userId && r.emoji === emoji));
            } else {
              newReactions = [...(msg.reactions || []), { 
                user: userId, 
                emoji,
                userDetails: { name: userName }
              }];
            }
            
            return { ...msg, reactions: newReactions };
          }
          return msg;
        }));
      });
      
      // ========== MEETING SOCKET LISTENERS ==========
      
      // Meeting creation response
      newSocket.on('meeting-created', ({ meetingId }) => {
        console.log('📅 Meeting created:', meetingId);
      });
      
      // User joined meeting
      newSocket.on('user-joined-meeting', ({ userId, userName }) => {
        console.log(`👤 ${userName} joined the meeting`);
      });
      
      // User left meeting
      newSocket.on('user-left-meeting', ({ userId, userName }) => {
        console.log(`👋 ${userName} left the meeting`);
      });
      
      // Meeting ended
      newSocket.on('meeting-ended', ({ meetingId, endedBy }) => {
        console.log(`🔴 Meeting ${meetingId} ended by:`, endedBy);
        endCall();
      });
      
      // ========== END MEETING SOCKET LISTENERS ==========
      
      // WebRTC Signaling Listeners
      newSocket.on('incoming-call', async ({ offer, from, fromName, fromId }) => {
        console.log('📞 Incoming call from:', fromName);
        setIncomingCall({ offer, from, fromName, fromId });
        setCallerInfo({ name: fromName, id: from });
      });

      newSocket.on('call-accepted', async ({ answer, to }) => {
        console.log('✅ Call accepted');
        const pc = peerConnections.current[to];
        if (pc && pc.signalingState !== 'closed') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error('Error setting remote description:', err);
          }
        }
      });

      newSocket.on('call-rejected', () => {
        console.log('❌ Call rejected');
        alert(`${callerInfo?.name || 'The user'} rejected your call`);
        endCall();
      });

      newSocket.on('call-ended', () => {
        console.log('🔴 Call ended');
        endCall();
      });

      newSocket.on('ice-candidate', async ({ candidate, from }) => {
        const pc = peerConnections.current[from];
        if (pc && candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
      });
      
      setSocket(newSocket);
      
      return () => {
        console.log('Closing socket');
        newSocket.close();
      };
    }
  }, [user]);

  // Load workspaces on mount
  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);

  // Auto-select shared workspace
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace && !currentChannel) {
      console.log('Auto-selecting workspace...');
      const sharedWorkspace = workspaces.find(w => w.owner !== user?._id);
      const workspaceToSelect = sharedWorkspace || workspaces[0];
      setCurrentWorkspace(workspaceToSelect);
      
      if (workspaceToSelect.channels && workspaceToSelect.channels.length > 0) {
        const firstChannel = workspaceToSelect.channels[0];
        setCurrentChannel(firstChannel);
        loadChannelMessages(firstChannel._id);
        if (socket) {
          socket.emit('join-workspace', workspaceToSelect._id);
          socket.emit('join-channel', firstChannel._id);
        }
      }
    }
  }, [workspaces]);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/workspaces', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWorkspaces(data.workspaces);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const createWorkspace = async (name, description) => {
    try {
      const response = await fetch('http://localhost:5000/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ name, description })
      });
      const data = await response.json();
      if (data.success) {
        await loadWorkspaces();
        setCurrentWorkspace(data.workspace);
        setCurrentChannel(data.defaultChannel);
        if (socket) {
          socket.emit('join-workspace', data.workspace._id);
          socket.emit('join-channel', data.defaultChannel._id);
        }
      }
      return data;
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  const loadChannelMessages = async (channelId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/channel/${channelId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = (content) => {
    if (!content.trim() || !currentChannel || !socket?.connected) return;
    
    socket.emit('send-message', {
      content: content.trim(),
      channelId: currentChannel._id,
      workspaceId: currentWorkspace?._id
    });
  };

  const uploadFile = async (file) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:5000/api/messages/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        const messageResponse = await fetch('http://localhost:5000/api/messages/file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileType: data.fileType,
            channelId: currentChannel._id,
            workspaceId: currentWorkspace._id
          })
        });
        
        const messageData = await messageResponse.json();
        
        if (messageData.success) {
          socket.emit('send-message', {
            content: messageData.message.content,
            channelId: currentChannel._id,
            workspaceId: currentWorkspace._id,
            isFile: true,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileType: data.fileType
          });
          setMessages(prev => [...prev, messageData.message]);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const clearChat = async () => {
    if (!currentChannel) return;
    
    const confirmClear = window.confirm('⚠️ Are you sure you want to clear ALL messages? This cannot be undone.');
    if (!confirmClear) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/messages/channel/${currentChannel._id}/clear`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setMessages([]);
        alert('Chat cleared successfully!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('Failed to clear chat');
    }
  };

  // Delete workspace
  const deleteWorkspace = async (workspaceId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedWorkspaces = workspaces.filter(ws => ws._id !== workspaceId);
        setWorkspaces(updatedWorkspaces);
        
        if (currentWorkspace?._id === workspaceId) {
          if (updatedWorkspaces.length > 0) {
            setCurrentWorkspace(updatedWorkspaces[0]);
            if (updatedWorkspaces[0].channels?.length > 0) {
              await switchChannel(updatedWorkspaces[0].channels[0]);
            }
          } else {
            setCurrentWorkspace(null);
            setCurrentChannel(null);
            setMessages([]);
          }
        }
        
        alert('✅ Workspace deleted successfully');
        return { success: true };
      }
      alert(data.message || 'Failed to delete workspace');
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error deleting workspace:', error);
      alert('Network error. Please try again.');
      return { success: false, message: 'Network error' };
    }
  };

  // Delete channel
  const deleteChannel = async (channelId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/channels/${channelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWorkspaces(prev => prev.map(ws => {
          if (ws._id === currentWorkspace?._id) {
            return {
              ...ws,
              channels: ws.channels.filter(ch => ch._id !== channelId)
            };
          }
          return ws;
        }));
        
        if (currentWorkspace) {
          const updatedChannels = currentWorkspace.channels.filter(ch => ch._id !== channelId);
          setCurrentWorkspace({
            ...currentWorkspace,
            channels: updatedChannels
          });
        }
        
        if (currentChannel?._id === channelId && currentWorkspace?.channels?.length > 0) {
          const remainingChannels = currentWorkspace.channels.filter(ch => ch._id !== channelId);
          if (remainingChannels.length > 0) {
            await switchChannel(remainingChannels[0]);
          }
        }
        
        alert('✅ Channel deleted successfully');
        return { success: true };
      }
      alert(data.message || 'Failed to delete channel');
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Network error. Please try again.');
      return { success: false, message: 'Network error' };
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ emoji })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, reactions: data.reactions }
            : msg
        ));
        
        if (socket && socket.connected) {
          socket.emit('add-reaction', {
            messageId,
            emoji,
            channelId: currentChannel?._id,
            userId: user._id,
            userName: user.name
          });
        }
        
        console.log(`✅ Reaction ${data.action}: ${emoji} on message ${messageId}`);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const testSocket = () => {
    if (socket) {
      console.log('Socket ID:', socket.id);
      console.log('Socket Connected:', socket.connected);
      return { id: socket.id, connected: socket.connected };
    }
    return { connected: false };
  };
  
  const sendTyping = (isTyping) => {
    socket?.emit('typing', { channelId: currentChannel?._id, isTyping });
  };

  const switchChannel = async (channel) => {
    if (currentChannel) socket?.emit('leave-channel', currentChannel._id);
    setCurrentChannel(channel);
    await loadChannelMessages(channel._id);
    socket?.emit('join-channel', channel._id);
  };

  const createMeeting = async () => {
    try {
      const meetingId = Math.random().toString(36).substring(2, 10).toUpperCase();
      console.log('Creating meeting with ID:', meetingId);
      
      if (socket) {
        socket.emit('create-meeting', { meetingId });
      }
      
      return meetingId;
    } catch (error) {
      console.error('Error creating meeting:', error);
      return null;
    }
  };

  const joinMeeting = async (meetingId) => {
    try {
      console.log('Joining meeting:', meetingId);
      if (socket) {
        socket.emit('join-meeting', { meetingId, userName: user?.name });
      }
      return meetingId;
    } catch (error) {
      console.error('Error joining meeting:', error);
      return null;
    }
  };

  const initiateCall = async (toUserId, toUserName) => {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsCallActive(true);
      setCallerInfo({ name: toUserName, id: toUserId });
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnections.current[toUserId] = peerConnection;
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: toUserId
          });
        }
      };
      
      peerConnection.ontrack = (event) => {
        console.log('Remote stream received');
        setRemoteStream(event.streams[0]);
      };
      
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed' ||
            peerConnection.connectionState === 'closed') {
          endCall();
        }
      };
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket.emit('call-user', {
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        to: toUserId,
        fromName: user.name,
        fromId: user._id
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Cannot access camera/microphone. Please check permissions.');
    }
  };

  const acceptCall = async () => {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsCallActive(true);
      
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnections.current[incomingCall.from] = peerConnection;
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            candidate: event.candidate,
            to: incomingCall.from
          });
        }
      };
      
      peerConnection.ontrack = (event) => {
        console.log('Remote stream received');
        setRemoteStream(event.streams[0]);
      };
      
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed' ||
            peerConnection.connectionState === 'closed') {
          endCall();
        }
      };
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('accept-call', {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        },
        to: incomingCall.from
      });
      
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to accept call:', error);
      alert('Cannot access camera/microphone. Please check permissions.');
    }
  };

  const rejectCall = () => {
    socket.emit('reject-call', { to: callerInfo?.id });
    setIncomingCall(null);
    setCallerInfo(null);
  };

  const endCall = () => {
    Object.keys(peerConnections.current).forEach(key => {
      if (peerConnections.current[key]) {
        peerConnections.current[key].close();
        delete peerConnections.current[key];
      }
    });
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIncomingCall(null);
    setCallerInfo(null);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
  };

  const toggleAudio = () => {
    if (localStream) {
      const newState = !isAudioEnabled;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
      setIsAudioEnabled(newState);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const newState = !isVideoEnabled;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
      setIsVideoEnabled(newState);
    }
  };

  return (
    <ChatContext.Provider value={{
      workspaces,
      currentWorkspace,
      currentChannel,
      messages,
      typingUsers,
      uploadingFile,
      socket,
      loadWorkspaces,
      createWorkspace,
      sendMessage,
      sendTyping,
      switchChannel,
      setCurrentWorkspace,
      testSocket,
      deleteMessage,
      clearChat,
      uploadFile,
      addReaction,
      deleteWorkspace,
      deleteChannel,
      createMeeting,
      joinMeeting,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      isCallActive,
      incomingCall,
      callerInfo,
      localStream,
      remoteStream,
      toggleAudio,
      toggleVideo,
      isAudioEnabled,
      isVideoEnabled
    }}>
      {children}
    </ChatContext.Provider>
  );
};