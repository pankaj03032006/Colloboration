import React from 'react';
import EmojiPicker from 'emoji-picker-react';

const ChatInput = ({
  value,
  onChange,
  onSend,
  onEmojiSelect,
  showEmojiPicker,
  setShowEmojiPicker,
  onFileSelect,
  isUploading,
  channelName,
  fileInputRef
}) => {
  return (
    <form onSubmit={onSend} className="bg-gray-700 p-2 flex-shrink-0">
      <div className="flex gap-1">
        {/* File Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          className="hidden"
          accept="image/*,application/pdf,application/msword,text/plain"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition disabled:opacity-50 text-sm"
          title="Upload file"
        >
          {isUploading ? '⏳' : '📎'}
        </button>
        
        {/* Emoji Picker Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition text-sm"
            title="Add emoji"
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-1 z-50">
              <EmojiPicker onEmojiClick={onEmojiSelect} style={{ width: '300px', height: '350px' }} />
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={`Message #${channelName}`}
          className="flex-1 px-2 py-1.5 bg-gray-600 text-white placeholder-gray-400 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        />
        
        {/* Send Button */}
        <button
          type="submit"
          className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm"
        >
          Send
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mt-1 text-center">
        💡 Click 📎 to upload files | 😊 to add emojis | 😊 on messages to react
      </div>
    </form>
  );
};

export default ChatInput;