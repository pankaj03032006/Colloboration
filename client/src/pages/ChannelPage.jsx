import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';

const ChannelPage = () => {
  const { workspaceId, channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { workspaces, currentWorkspace, setCurrentWorkspace, switchChannel, loadWorkspaces } = useContext(ChatContext);
  const [channel, setChannel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [channelName, setChannelName] = useState('');

  useEffect(() => {
    loadChannel();
  }, [channelId]);

  const loadChannel = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/channels/${channelId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (data.success) {
        setChannel(data.channel);
        setChannelName(data.channel.name);
      }
    } catch (error) {
      console.error('Error loading channel:', error);
    }
  };

  const handleUpdateChannel = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/channels/${channelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ name: channelName })
      });
      const data = await response.json();
      if (data.success) {
        setChannel(data.channel);
        setIsEditing(false);
        alert('Channel updated successfully');
      }
    } catch (error) {
      console.error('Error updating channel:', error);
    }
  };

  const handleDeleteChannel = async () => {
    if (window.confirm('Are you sure you want to delete this channel? All messages will be lost.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/channels/${channelId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (data.success) {
          navigate(`/workspace/${workspaceId}`);
        }
      } catch (error) {
        console.error('Error deleting channel:', error);
      }
    }
  };

  const workspace = workspaces.find(w => w._id === workspaceId);
  const isAdmin = workspace?.members?.some(
    m => (m.user?._id === user._id || m.user === user._id) && m.role === 'admin'
  ) || workspace?.owner === user._id;

  if (!channel) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/workspace/${workspaceId}`)} className="text-gray-400 hover:text-white">
              ← Back
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white"># {channel.name}</h1>
              <p className="text-gray-400 text-sm">Channel settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Channel Settings</h2>
          
          {!isEditing ? (
            <div>
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-1">Channel Name</p>
                <p className="text-white text-lg">{channel.name}</p>
              </div>
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-1">Channel ID</p>
                <p className="text-gray-400 font-mono text-sm">{channel._id}</p>
              </div>
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-1">Created</p>
                <p className="text-white">{new Date(channel.createdAt).toLocaleString()}</p>
              </div>
              {isAdmin && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Edit Channel
                  </button>
                  <button
                    onClick={handleDeleteChannel}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Channel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleUpdateChannel} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Channel Name</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  required
                />
                <p className="text-gray-400 text-xs mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelPage;