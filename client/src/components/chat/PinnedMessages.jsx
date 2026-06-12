import React from 'react';

const PinnedMessages = ({ messages, onClose, onUnpin }) => {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400">📌</span>
          <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            Pinned Messages ({messages.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg._id} className="text-sm p-2 bg-white dark:bg-gray-800 rounded shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {msg.sender?.name}
              </span>
              <button
                onClick={() => onUnpin(msg._id)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Unpin
              </button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mt-1">{msg.content}</p>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(msg.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinnedMessages;