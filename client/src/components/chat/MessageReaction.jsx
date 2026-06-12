import React, { useState } from 'react';

const MessageReaction = ({ message, currentUser, onReact }) => {
  const [showPicker, setShowPicker] = useState(false);
  
  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];
  
  // Group reactions by emoji
  const getReactionGroups = () => {
    if (!message.reactions || message.reactions.length === 0) return [];
    
    const groups = {};
    message.reactions.forEach(reaction => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          hasCurrentUser: false
        };
      }
      groups[reaction.emoji].count++;
      groups[reaction.emoji].users.push(reaction.user?.name || 'User');
      if (reaction.user?._id === currentUser?._id || reaction.user === currentUser?._id) {
        groups[reaction.emoji].hasCurrentUser = true;
      }
    });
    return Object.values(groups);
  };
  
  const reactionGroups = getReactionGroups();
  
  const handleReactionClick = (emoji) => {
    onReact(emoji);
    setShowPicker(false);
  };
  
  return (
    <div className="relative inline-flex items-center gap-1 mt-1">
      {/* Existing reactions */}
      {reactionGroups.map((group, idx) => (
        <button
          key={idx}
          onClick={() => handleReactionClick(group.emoji)}
          className={`text-xs px-2 py-0.5 rounded-full transition ${
            group.hasCurrentUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          title={group.users.join(', ')}
        >
          {group.emoji} {group.count}
        </button>
      ))}
      
      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs px-2 py-0.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition"
          title="Add reaction"
        >
          + 😊
        </button>
        
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border p-2 z-50">
            <div className="flex gap-1">
              {commonReactions.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="text-xl hover:bg-gray-100 p-1 rounded transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReaction;