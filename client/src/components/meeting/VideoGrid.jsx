import React from 'react';
import VideoPlayer from './VideoPlayer';

const VideoGrid = ({ participants, localStream, localUser, isAudioEnabled, isVideoEnabled }) => {
  const allParticipants = [
    { id: localUser.id, name: localUser.name, stream: localStream, isLocal: true, isAudioEnabled, isVideoEnabled },
    ...Array.from(participants.values())
  ];

  const getGridClass = () => {
    const count = allParticipants.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`grid ${getGridClass()} gap-4 p-4 h-full`}>
      {allParticipants.map(participant => (
        <VideoPlayer
          key={participant.id}
          stream={participant.stream}
          userName={participant.name}
          isLocal={participant.isLocal}
          isAudioEnabled={participant.isAudioEnabled}
          isVideoEnabled={participant.isVideoEnabled}
        />
      ))}
    </div>
  );
};

export default VideoGrid;