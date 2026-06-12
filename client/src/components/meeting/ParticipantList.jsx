import React from 'react';

const ParticipantList = ({ participants, localUser, isOpen, onClose }) => {
  if (!isOpen) return null;

  const allParticipants = [
    { id: localUser.id, name: localUser.name, isLocal: true },
    ...Array.from(participants.values())
  ];

  return (
    <div className="fixed right-4 top-20 w-64 bg-white rounded-lg shadow-xl border z-40">
      <div className="bg-gray-800 text-white p-3 rounded-t-lg flex justify-between items-center">
        <span className="font-semibold">Participants ({allParticipants.length})</span>
        <button onClick={onClose} className="hover:text-gray-300">✕</button>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {allParticipants.map(participant => (
          <div key={participant.id} className="p-3 border-b flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium">
                {participant.name} {participant.isLocal && '(You)'}
              </div>
              <div className="text-xs text-green-500">● Connected</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantList;