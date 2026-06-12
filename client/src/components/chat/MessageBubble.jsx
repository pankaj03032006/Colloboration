import React, { useState } from 'react';
import MessageReaction from './MessageReaction';

const MessageBubble = ({ 
  message, 
  isOwn, 
  currentUser, 
  onDelete, 
  onReact,
  onEdit,
  isEditing,
  editContent,
  onEditSave,
  onEditCancel
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderFileMessage = () => {
    const isImage = message.type === 'image';
    
    if (isImage) {
      return (
        <div className="mt-1">
          <img 
            src={message.fileUrl} 
            alt={message.fileName}
            className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer hover:opacity-90 transition"
            onClick={() => window.open(message.fileUrl, '_blank')}
          />
          <div className="text-xs mt-1 opacity-75 truncate max-w-[200px]">{message.fileName}</div>
        </div>
      );
    }
    
    if (message.type === 'file') {
      return (
        <a 
          href={message.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 mt-1 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          <span className="text-lg">📎</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{message.fileName}</div>
            <div className="text-xs text-gray-500">
              {message.fileSize ? formatFileSize(message.fileSize) : ''}
            </div>
          </div>
        </a>
      );
    }
    
    return null;
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  if (isEditing) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] ${isOwn ? 'order-2' : 'order-1'}`}>
          <div className="flex items-center gap-2 mb-1">
            {!isOwn && (
              <span className="font-medium text-xs text-gray-300">
                {message.sender?.name || 'Unknown'}
              </span>
            )}
          </div>
          <div className="rounded-lg p-2 bg-gray-700">
            <input
              type="text"
              value={editContent}
              onChange={(e) => onEditSave(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onEditSave(editContent)}
              className="w-full px-2 py-1 bg-gray-600 text-white rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onEditSave(editContent)}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded"
              >
                Save
              </button>
              <button
                onClick={onEditCancel}
                className="text-xs bg-gray-600 text-white px-2 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[85%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-xs text-gray-300">
              {message.sender?.name || 'Unknown'}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        
        <div className={`rounded-lg p-2 text-sm ${
          isOwn
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-700 text-gray-200'
        }`}>
          {message.type === 'text' ? (
            <p className="text-sm break-words">
              {message.content}
              {message.isEdited && (
                <span className="text-xs opacity-50 ml-1">(edited)</span>
              )}
            </p>
          ) : (
            renderFileMessage()
          )}
        </div>
        
        {/* Message Reactions */}
        <MessageReaction 
          message={message}
          currentUser={currentUser}
          onReact={onReact}
        />
      </div>
      
      {/* Message Actions (Delete, Edit) */}
      {showActions && isOwn && (
        <div className="flex flex-col items-end ml-2">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-yellow-400 text-xs mb-1"
            title="Edit message"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-400 text-xs"
            title="Delete message"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;