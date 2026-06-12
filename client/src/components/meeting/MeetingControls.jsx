import React from 'react';

const MeetingControls = ({
  isAudioEnabled,
  isVideoEnabled,
  isSharingScreen,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  participantsCount
}) => {
  return (
    <div className="bg-gray-800 px-6 py-4 flex justify-center gap-4">
      <button
        onClick={onToggleAudio}
        className={`p-3 rounded-full transition transform hover:scale-105 ${
          isAudioEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'
        } text-white`}
        title={isAudioEnabled ? 'Mute' : 'Unmute'}
      >
        {isAudioEnabled ? '🎤' : '🔇'}
      </button>
      
      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full transition transform hover:scale-105 ${
          isVideoEnabled ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'
        } text-white`}
        title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {isVideoEnabled ? '📹' : '🚫📹'}
      </button>
      
      <button
        onClick={onToggleScreenShare}
        className={`p-3 rounded-full transition transform hover:scale-105 ${
          isSharingScreen ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'
        } text-white`}
        title={isSharingScreen ? 'Stop sharing' : 'Share screen'}
      >
        🖥️
      </button>
      
      <button
        onClick={onEndCall}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition transform hover:scale-105"
        title="Leave meeting"
      >
        📞 Leave
      </button>
      
      <div className="ml-4 bg-gray-700 rounded-full px-3 py-1 text-white text-sm">
        {participantsCount} participant{participantsCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default MeetingControls;