import React, { useState, useContext, useEffect, useRef } from 'react';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import MessageBubble from './MessageBubble';

const ChatWindow = () => {
  const { 
    currentChannel, 
    messages, 
    sendMessage, 
    sendTyping, 
    typingUsers, 
    deleteMessage, 
    clearChat, 
    uploadFile, 
    uploadingFile, 
    addReaction 
  } = useContext(ChatContext);
  const { user } = useContext(AuthContext);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  let typingTimeout;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
      sendTyping(false);
    }
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(true);
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false);
    }, 1000);
  };

  const handleEmojiClick = (emojiObject) => {
    setInputMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleReaction = async (messageId, emoji) => {
    await addReaction(messageId, emoji);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      await uploadFile(file);
    }
    fileInputRef.current.value = '';
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message._id);
    setEditContent(message.content);
  };

  const handleEditSave = async (messageId, newContent) => {
    if (newContent.trim() && newContent !== messages.find(m => m._id === messageId)?.content) {
      // Add edit message API call here
      console.log('Edit message:', messageId, newContent);
    }
    setEditingMessage(null);
    setEditContent('');
  };

  const handleEditCancel = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-800">
        <div className="text-center p-4">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-gray-400 text-sm">Select a channel to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-800">
      {/* Channel Header */}
      <div className="bg-gray-700 px-3 py-2 flex justify-between items-center flex-shrink-0 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400 text-sm">#</span>
          <span className="text-white text-sm font-medium">{currentChannel.name}</span>
          <span className="text-gray-400 text-xs">({messages.length})</span>
        </div>
        <button
          onClick={clearChat}
          className="text-gray-400 hover:text-red-400 transition text-sm"
          title="Clear chat"
        >
          🗑️
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender?._id === user?._id}
              currentUser={user}
              onDelete={() => deleteMessage(message._id)}
              onEdit={() => handleEditMessage(message)}
              onReact={(emoji) => handleReaction(message._id, emoji)}
              isEditing={editingMessage === message._id}
              editContent={editContent}
              onEditSave={(newContent) => handleEditSave(message._id, newContent)}
              onEditCancel={handleEditCancel}
            />
          ))
        )}
        
        {/* Typing Indicator */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="text-xs text-gray-400 italic">
            Someone is typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-gray-700 p-2 flex-shrink-0">
        <div className="flex gap-1">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,application/pdf,application/msword,text/plain"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={uploadingFile}
            className="px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition disabled:opacity-50 text-sm"
            title="Upload file"
          >
            {uploadingFile ? '⏳' : '📎'}
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
                <EmojiPicker onEmojiClick={handleEmojiClick} style={{ width: '300px', height: '350px' }} />
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            placeholder={`Message #${currentChannel.name}`}
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
          💡 Click 😊 to add emojis | 😊 on messages to react with emojis
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;