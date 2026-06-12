import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { workspaces, setCurrentWorkspace, currentWorkspace, loadWorkspaces } = useContext(ChatContext);
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWorkspace(data.workspace);
        setMembers(data.workspace.members || []);
      }
    } catch (error) {
      console.error('Error loading workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await response.json();
      if (data.success) {
        alert('Invitation sent successfully!');
        setShowInviteModal(false);
        setInviteEmail('');
        loadWorkspace();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/members/${memberId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (data.success) {
          loadWorkspace();
        }
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const handleDeleteWorkspace = async () => {
    if (window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await response.json();
        if (data.success) {
          await loadWorkspaces();
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error deleting workspace:', error);
      }
    }
  };

  const isAdmin = workspace?.members?.some(
    m => (m.user?._id === user._id || m.user === user._id) && m.role === 'admin'
  ) || workspace?.owner === user._id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-white">{workspace?.name}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Workspace Info</h2>
          <p className="text-gray-300 mb-2">ID: {workspace?._id}</p>
          <p className="text-gray-300">Description: {workspace?.description || 'No description'}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Members ({members.length})</h2>
            {isAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                + Invite Member
              </button>
            )}
          </div>
          <div className="space-y-3">
            {members.map((member) => {
              const memberUser = member.user?._id ? member.user : { _id: member.user, name: 'User' };
              const isOwner = workspace?.owner === memberUser._id;
              return (
                <div key={memberUser._id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {memberUser.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{memberUser.name}</p>
                      <p className="text-gray-400 text-sm">{member.role} {isOwner && '(Owner)'}</p>
                    </div>
                  </div>
                  {isAdmin && !isOwner && memberUser._id !== user._id && (
                    <button
                      onClick={() => handleRemoveMember(memberUser._id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mt-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
            <button
              onClick={handleDeleteWorkspace}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Workspace
            </button>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96">
            <h2 className="text-xl font-bold text-white mb-4">Invite Member</h2>
            <form onSubmit={handleInvite}>
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3"
                required
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;