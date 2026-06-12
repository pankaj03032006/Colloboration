import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';

const MeetingRoom = () => {
  const { meetingId: urlMeetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { socket } = useContext(ChatContext);
  
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callInProgress = useRef(false);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        console.log('✅ Camera initialized');
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError(err.message);
      }
    };
    initCamera();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined-meeting', ({ userId, userName }) => {
      console.log('👤 User joined:', userName);
      if (userId !== user?._id && !callInProgress.current) {
        setParticipants(prev => {
          if (prev.some(p => p.id === userId)) return prev;
          return [...prev, { id: userId, name: userName }];
        });
      }
    });

    socket.on('user-left-meeting', ({ userId }) => {
      console.log('👋 User left:', userId);
      // Don't remove participant during call to prevent disconnection
      if (!callInProgress.current) {
        setParticipants(prev => prev.filter(p => p.id !== userId));
      }
      if (peerConnectionRef.current && userId !== user?._id) {
        endCall();
      }
    });

    socket.on('meeting-participants', ({ participants: existing }) => {
      console.log('📋 Existing participants:', existing);
      const mappedParticipants = existing.map(p => ({
        id: p.userId,
        name: p.userName
      }));
      setParticipants(mappedParticipants.filter(p => p.id !== user?._id));
    });

    socket.on('incoming-call', ({ offer, from, fromName }) => {
      console.log('📞 Incoming call from:', fromName);
      setIncomingCall({ offer, from, fromName });
    });

    socket.on('call-accepted', ({ answer }) => {
      console.log('✅ Call accepted');
      if (peerConnectionRef.current) {
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setIsConnecting(false);
      }
    });

    socket.on('call-rejected', () => {
      console.log('❌ Call rejected');
      alert('Call was rejected');
      endCall();
    });

    socket.on('call-ended', () => {
      console.log('🔴 Call ended');
      endCall();
    });

    socket.on('ice-candidate', ({ candidate }) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.emit('join-meeting', { 
      meetingId: urlMeetingId, 
      userId: user?._id, 
      userName: user?.name 
    });

    return () => {
      socket.off('user-joined-meeting');
      socket.off('user-left-meeting');
      socket.off('meeting-participants');
      socket.off('incoming-call');
      socket.off('call-accepted');
      socket.off('call-rejected');
      socket.off('call-ended');
      socket.off('ice-candidate');
      socket.emit('leave-meeting', { meetingId: urlMeetingId, userId: user?._id });
    };
  }, [socket, urlMeetingId, user]);

  const startCall = async (targetUserId, targetUserName) => {
    console.log('📞 Starting call to:', targetUserName);
    if (!localStream) {
      alert('Camera not ready');
      return;
    }
    
    callInProgress.current = true;
    setIsConnecting(true);
    
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;
      
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate');
          socket.emit('ice-candidate', { candidate: event.candidate, to: targetUserId });
        }
      };
      
      pc.ontrack = (event) => {
        console.log('📺 Remote stream received!');
        const [remoteStreamObj] = event.streams;
        setRemoteStream(remoteStreamObj);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamObj;
        }
        setIsCallActive(true);
        setIsConnecting(false);
      };
      
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('🎉 Call connected successfully!');
        }
        if (pc.connectionState === 'failed') {
          console.log('❌ Connection failed');
          setIsConnecting(false);
          alert('Connection failed. Please try again.');
        }
      };
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('call-user', {
        offer,
        to: targetUserId,
        fromName: user?.name,
        fromId: user?._id
      });
      
    } catch (error) {
      console.error('Call error:', error);
      setIsConnecting(false);
      callInProgress.current = false;
      alert('Failed to start call: ' + error.message);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    console.log('✅ Accepting call from:', incomingCall.fromName);
    callInProgress.current = true;
    setIsConnecting(true);
    
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      };

      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;
      
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { candidate: event.candidate, to: incomingCall.from });
        }
      };
      
      pc.ontrack = (event) => {
        console.log('📺 Remote stream received!');
        const [remoteStreamObj] = event.streams;
        setRemoteStream(remoteStreamObj);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamObj;
        }
        setIsCallActive(true);
        setIsConnecting(false);
      };
      
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('accept-call', { answer, to: incomingCall.from });
      setIncomingCall(null);
      
    } catch (error) {
      console.error('Accept error:', error);
      setIsConnecting(false);
      callInProgress.current = false;
      alert('Failed to accept call: ' + error.message);
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('reject-call', { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setIsCallActive(false);
    setIsConnecting(false);
    callInProgress.current = false;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const leaveMeeting = () => {
    endCall();
    navigate('/dashboard');
  };

  const toggleAudio = () => {
    if (localStream) {
      const newState = !isAudioEnabled;
      localStream.getAudioTracks().forEach(track => track.enabled = newState);
      setIsAudioEnabled(newState);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const newState = !isVideoEnabled;
      localStream.getVideoTracks().forEach(track => track.enabled = newState);
      setIsVideoEnabled(newState);
    }
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(urlMeetingId);
    alert('Meeting ID copied!');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center max-w-sm">
            <div className="text-5xl mb-4 animate-bounce">📞</div>
            <h3 className="text-xl font-semibold mb-2">Incoming Call</h3>
            <p className="text-gray-600 mb-4">{incomingCall.fromName} is calling you...</p>
            <div className="flex gap-4 justify-center">
              <button onClick={acceptCall} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Accept
              </button>
              <button onClick={rejectCall} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Error Modal */}
      {cameraError && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center max-w-sm">
            <div className="text-5xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold mb-2">Camera Error</h3>
            <p className="text-gray-600 mb-4">{cameraError}</p>
            <button onClick={leaveMeeting} className="px-6 py-2 bg-red-600 text-white rounded-lg">
              Leave
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-white text-lg font-semibold">Meeting Room</h1>
            <p className="text-gray-400 text-sm">ID: {urlMeetingId}</p>
            <p className="text-gray-400 text-xs">
              {participants.length} other(s) in meeting
              {isCallActive && ' 🔴 Call in progress'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyMeetingId} className="bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">
              📋 Copy ID
            </button>
            <button onClick={leaveMeeting} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
            You {!isVideoEnabled && '(Off)'}
          </div>
        </div>
        
        {/* Remote Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              {isConnecting && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-gray-400">Connecting to peer...</p>
                </div>
              )}
              {!isConnecting && !isCallActive && participants.length > 0 && (
                <div className="space-y-3 text-center">
                  <p className="text-white text-lg">📞 Ready to call</p>
                  {participants.map(p => (
                    <button
                      key={p.id}
                      onClick={() => startCall(p.id, p.name)}
                      className="px-8 py-3 bg-green-600 text-white rounded-xl text-lg font-semibold hover:bg-green-700"
                    >
                      📞 Call {p.name}
                    </button>
                  ))}
                </div>
              )}
              {!isConnecting && !isCallActive && participants.length === 0 && (
                <p className="text-gray-400">⏳ Waiting for others to join...</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4">
        <button 
          onClick={toggleAudio} 
          className={`p-3 rounded-full transition ${isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white`}
        >
          {isAudioEnabled ? '🎤' : '🔇'}
        </button>
        <button 
          onClick={toggleVideo} 
          className={`p-3 rounded-full transition ${isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'} text-white`}
        >
          {isVideoEnabled ? '📹' : '🚫📹'}
        </button>
        {isCallActive && (
          <button onClick={endCall} className="p-3 bg-red-600 rounded-full text-white hover:bg-red-700 transition">
            End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;