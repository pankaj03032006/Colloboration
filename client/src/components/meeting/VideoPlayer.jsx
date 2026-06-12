import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ stream, userName, isLocal = false, isAudioEnabled = true, isVideoEnabled = true }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      
      {/* Video Off Indicator */}
      {!isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-center">
            <div className="text-4xl mb-2">📹</div>
            <div className="text-white text-sm">Camera off</div>
          </div>
        </div>
      )}
      
      {/* User Info */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 rounded px-2 py-1">
        <span className="text-white text-sm">
          {userName} {isLocal && '(You)'}
        </span>
        {!isAudioEnabled && !isLocal && (
          <span className="ml-2 text-red-400">🔇</span>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;