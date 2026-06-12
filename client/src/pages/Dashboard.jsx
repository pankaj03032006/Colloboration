// client/src/pages/Dashboard.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import ChatWindow from '../components/chat/ChatWindow';
import MeetingCenter from '../components/meeting/MeetingCenter';
import NotificationBell from '../components/notification/NotificationBell';

const Sidebar = () => {
  // Get user from AuthContext
  const { user } = useContext(AuthContext);
  const { 
    workspaces, 
    currentWorkspace, 
    currentChannel,  // ← IMPORTANT: Added this
    setCurrentWorkspace, 
    switchChannel, 
    createWorkspace, 
    loadWorkspaces,
    deleteWorkspace,
    deleteChannel
  } = useContext(ChatContext);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDesc, setWorkspaceDesc] = useState('');
  const [joinWorkspaceId, setJoinWorkspaceId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const navigate = useNavigate();

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    await createWorkspace(workspaceName, workspaceDesc);
    setShowCreateModal(false);
    setWorkspaceName('');
    setWorkspaceDesc('');
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${joinWorkspaceId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setJoinSuccess('Successfully joined workspace! Refreshing...');
        setTimeout(() => {
          loadWorkspaces();
          window.location.reload();
        }, 1500);
      } else {
        setJoinError(data.message);
      }
    } catch (error) {
      console.error('Error joining workspace:', error);
      setJoinError('Failed to join workspace. Please check the Workspace ID.');
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="font-bold">CollabHub</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {/* Active Workspace */}
        {currentWorkspace && (
          <div className="mb-4 p-2 bg-indigo-900/50 rounded-lg border border-indigo-700">
            <div className="text-indigo-300 text-xs mb-1">ACTIVE</div>
            <div className="font-semibold text-sm truncate">{currentWorkspace.name}</div>
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase">Workspaces</h2>
            <div className="flex gap-1">
              <button onClick={() => setShowJoinModal(true)} className="text-gray-400 hover:text-white">📎</button>
              <button onClick={() => setShowCreateModal(true)} className="text-gray-400 hover:text-white">+</button>
            </div>
          </div>
          
          {workspaces.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No workspaces yet.<br/>Click + to create</p>
          ) : (
            workspaces.map((workspace) => {
              const isOwner = workspace.members?.some(m => m.user === user?._id && m.role === 'admin');
              const isActive = currentWorkspace?._id === workspace._id;
              
              return (
                <div key={workspace._id} className="flex items-center justify-between group mb-1">
                  <button
                    onClick={() => setCurrentWorkspace(workspace)}
                    className={`flex-1 text-left px-2 py-1.5 rounded-md text-sm transition ${
                      isActive ? 'bg-indigo-600' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate">#{workspace.name}</span>
                      {!isOwner && <span className="text-xs text-yellow-400 ml-1">shared</span>}
                    </div>
                  </button>
                  {isOwner && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`⚠️ Delete workspace "${workspace.name}"?\n\nThis will delete ALL channels and messages. This action cannot be undone!`)) {
                          await deleteWorkspace(workspace._id);
                        }
                      }}
                      className="hidden group-hover:block text-red-400 hover:text-red-300 p-1 text-sm"
                      title="Delete workspace"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {currentWorkspace && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">Channels</h2>
            {currentWorkspace.channels?.length > 0 ? (
              currentWorkspace.channels.map((channel) => {
                const isGeneral = channel.name === 'general';
                return (
                  <div key={channel._id} className="flex items-center justify-between group">
                    <button
                      onClick={() => switchChannel(channel)}
                      className={`flex-1 text-left px-2 py-1.5 rounded-md text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2 ${
                        currentChannel?._id === channel._id ? 'bg-gray-700' : ''
                      }`}
                    >
                      <span className="text-indigo-400">#</span>
                      <span className="truncate">{channel.name}</span>
                    </button>
                    {!isGeneral && (
                      <button
                        onClick={async () => {
                          if (window.confirm(`⚠️ Delete channel #${channel.name}?\n\nAll messages in this channel will be permanently deleted.`)) {
                            await deleteChannel(channel._id);
                          }
                        }}
                        className="hidden group-hover:block text-red-400 hover:text-red-300 p-1 text-sm"
                        title="Delete channel"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-sm text-center py-2">No channels yet</p>
            )}
          </div>
        )}
      </div>
      
      {/* User Section with Dropdown */}
      <div className="p-3 border-t border-gray-800 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-2 hover:bg-gray-800 rounded-lg p-2 transition"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-400">{user?.email || 'No email'}</div>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </button>
        
        {/* User Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
            <div className="px-4 py-2 bg-gray-900 border-b border-gray-700">
              <div className="text-sm font-medium text-white">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-400">{user?.email || 'No email'}</div>
            </div>
            <button
              onClick={() => {
                navigate('/profile');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition"
            >
              👤 View Profile
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition"
            >
              ⚙️ Settings
            </button>
            <hr className="border-gray-700" />
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 transition"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
      
      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-96">
            <h2 className="text-xl font-bold mb-3">Create Workspace</h2>
            <form onSubmit={handleCreateWorkspace}>
              <input
                type="text"
                placeholder="Workspace name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={workspaceDesc}
                onChange={(e) => setWorkspaceDesc(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="2"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Join Workspace Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-96">
            <h2 className="text-xl font-bold mb-3">Join Workspace</h2>
            <form onSubmit={handleJoinWorkspace}>
              <input
                type="text"
                placeholder="Enter Workspace ID"
                value={joinWorkspaceId}
                onChange={(e) => setJoinWorkspaceId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {joinError && <p className="text-red-500 text-sm mb-2">{joinError}</p>}
              {joinSuccess && <p className="text-green-500 text-sm mb-2">{joinSuccess}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-3 py-1.5 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardContent = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { 
    loadWorkspaces, 
    workspaces, 
    setCurrentWorkspace, 
    switchChannel,
    currentWorkspace,
    currentChannel
  } = useContext(ChatContext);
  
  useEffect(() => {
    if (user) {
      loadWorkspaces();
    }
  }, [user]);
  
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      setCurrentWorkspace(workspaces[0]);
      if (workspaces[0].channels?.length > 0) {
        switchChannel(workspaces[0].channels[0]);
      }
    }
  }, [workspaces]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Center - Meeting Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-gray-800 px-6 py-3 flex justify-between items-center border-b border-gray-700">
          <div>
            <h1 className="text-white text-lg font-semibold">
              {currentWorkspace ? currentWorkspace.name : 'Dashboard'}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {currentChannel ? `#${currentChannel.name}` : 'Select a channel'}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <NotificationBell />
            
            <button
              onClick={() => {
                if (currentWorkspace) {
                  navigator.clipboard.writeText(currentWorkspace._id);
                  alert('✅ Workspace ID copied! Share it with others to join.');
                } else {
                  alert('No workspace selected');
                }
              }}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition flex items-center gap-1"
            >
              📋 Copy ID
            </button>
           
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition flex items-center gap-1"
            >
              🚪 Logout
            </button>
          </div>
        </header>
        
        {/* Meeting Center */}
        <div className="flex-1">
          <MeetingCenter />
        </div>
      </div>
      
      {/* Right Sidebar - Chat */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <span>💬</span> Chat
            {currentChannel && <span className="text-xs text-gray-400 ml-1">#{currentChannel.name}</span>}
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return <DashboardContent />;
};
export default Dashboard;
