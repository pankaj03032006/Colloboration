// client/src/components/meeting/MeetingCenter.jsx
import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatContext } from '../../context/ChatContext';
import MeetingControls from './MeetingControls';

const MeetingCenter = () => {
  const navigate = useNavigate();
  const { meetingId: urlMeetingId } = useParams();
  const { 
    createMeeting, 
    joinMeeting,
    initiateCall, 
    acceptCall,
    rejectCall,
    endCall, 
    localStream, 
    remoteStream,
    isCallActive,
    incomingCall,
    socket,
    user
  } = useContext(ChatContext);
  
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingId, setMeetingId] = useState(null);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(1);
  
  const hasJoined = useRef(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Handle incoming call
  useEffect(() => {
    if (incomingCall && !isCallActive) {
      const accept = window.confirm(`${incomingCall.fromName || 'Someone'} is calling you. Accept?`);
      if (accept) {
        acceptCall();
      } else {
        rejectCall();
      }
    }
  }, [incomingCall]);

  // Check if joining from URL
  useEffect(() => {
    if (urlMeetingId && !hasJoined.current && !isInMeeting) {
      hasJoined.current = true;
      setMeetingId(urlMeetingId);
      setIsInMeeting(true);
      handleJoinMeetingById(urlMeetingId);
    }
  }, [urlMeetingId]);

  // Listen for participant count
  useEffect(() => {
    if (!socket) return;
    
    const handleParticipantsUpdate = ({ count }) => {
      setParticipantsCount(count);
    };
    
    socket.on('participants-update', handleParticipantsUpdate);
    
    return () => {
      socket.off('participants-update', handleParticipantsUpdate);
    };
  }, [socket]);

  const handleStartMeeting = async () => {
    const id = await createMeeting();
    if (id) {
      setMeetingId(id);
      setIsInMeeting(true);
      navigate(`/meeting/${id}`);
      alert(`Meeting created! Meeting ID: ${id}\n\nShare this ID with others to join.`);
    }
  };

  const handleJoinMeetingById = async (id) => {
    if (id && id.trim() && !hasJoined.current) {
      hasJoined.current = true;
      await joinMeeting(id);
      console.log('Joined meeting:', id);
    }
  };

  const handleJoinMeeting = () => {
    if (joinMeetingId.trim()) {
      hasJoined.current = false;
      handleJoinMeetingById(joinMeetingId);
      setShowJoinInput(false);
      setJoinMeetingId('');
      navigate(`/meeting/${joinMeetingId}`);
    }
  };

  const copyMeetingId = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId);
      alert('Meeting ID copied!');
    }
  };

  const copyUserId = () => {
    if (currentUserId) {
      navigator.clipboard.writeText(currentUserId);
      alert('Your User ID copied!');
    }
  };

  const startCall = () => {
    const otherUserId = prompt('Enter the other user\'s ID to call:');
    if (otherUserId && otherUserId.trim()) {
      const otherUserName = prompt('Enter the other user\'s name:', 'Participant');
      initiateCall(otherUserId, otherUserName || 'Participant');
    }
  };

  const handleToggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = localStream?.getVideoTracks()[0];
        if (sender) {
          // Replace track
        }
        setIsSharingScreen(true);
        videoTrack.onended = () => {
          setIsSharingScreen(false);
        };
      } else {
        // Stop screen share and switch back to camera
        setIsSharingScreen(false);
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const leaveMeeting = () => {
    endCall();
    setIsInMeeting(false);
    hasJoined.current = false;
    navigate('/dashboard');
  };

  // Get current user ID
  const currentUserId = user?._id || (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored)._id : '';
    } catch { return ''; }
  })();

  return (
    <div className="h-full flex flex-col">
      {!isInMeeting ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎥</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Video Meetings</h2>
              <p className="text-gray-400 text-sm mb-6">
                Start or join a secure video meeting with your team
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleStartMeeting}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  🎥 New Meeting
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-gray-800 text-gray-400">OR</span>
                  </div>
                </div>
                
                {!showJoinInput ? (
                  <button
                    onClick={() => setShowJoinInput(true)}
                    className="w-full py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition flex items-center justify-center gap-2 font-medium"
                  >
                    🔗 Join Meeting
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter Meeting ID"
                      value={joinMeetingId}
                      onChange={(e) => setJoinMeetingId(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinMeeting()}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleJoinMeeting}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Join
                      </button>
                      <button
                        onClick={() => setShowJoinInput(false)}
                        className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Meeting Header */}
          <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-sm">Meeting ID: {meetingId}</span>
              <button 
                onClick={copyMeetingId}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded"
              >
                📋 Copy
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={copyUserId}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-700 rounded"
              >
                Copy Your ID: {currentUserId?.slice(-8)}
              </button>
            </div>
          </div>
          
          {/* Video Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 p-4">
            {/* Local Video */}
            <div className="bg-gray-900 rounded-xl overflow-hidden relative">
              {localStream ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎥</div>
                    <div className="text-gray-500 text-sm">Camera off</div>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                          alert('Please refresh and enable camera permissions');
                        } catch (err) {
                          alert('Please allow camera access');
                        }
                      }}
                      className="mt-3 px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                    >
                      Enable Camera
                    </button>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                You {!isVideoEnabled && '(Camera Off)'}
              </div>
            </div>
            
            {/* Remote Video - WITH START CALL BUTTON */}
            <div className="bg-gray-900 rounded-xl overflow-hidden relative">
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📹</div>
                    <div className="text-gray-400 text-lg mb-6">
                      {isCallActive ? 'Connecting...' : 'No active call'}
                    </div>
                    
                    {/* START CALL BUTTON - GREEN AND PROMINENT */}
                    <button
                      onClick={startCall}
                      className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition text-lg font-semibold shadow-lg"
                    >
                      📞 Start Call
                    </button>
                    
                    <div className="mt-8 p-4 bg-gray-800 rounded-lg text-left">
                      <p className="text-sm text-gray-300 mb-2 font-semibold">How to start a video call:</p>
                      <p className="text-xs text-gray-400 mb-1">1. Share Meeting ID: <span className="text-green-400 font-mono">{meetingId}</span></p>
                      <p className="text-xs text-gray-400 mb-1">2. Share your User ID: <span className="text-green-400 font-mono">{currentUserId}</span></p>
                      <p className="text-xs text-gray-400 mb-1">3. Ask other person for their User ID</p>
                      <p className="text-xs text-gray-400">4. Click "Start Call" and enter their ID</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Meeting Controls */}
          <MeetingControls
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isSharingScreen={isSharingScreen}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onEndCall={leaveMeeting}
            participantsCount={participantsCount}
          />
        </>
      )}
    </div>
  );
};

export default MeetingCenter;