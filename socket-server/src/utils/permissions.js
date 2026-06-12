/**
 * Check if user has admin role in workspace
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const isWorkspaceAdmin = (workspace, userId) => {
  if (!workspace || !workspace.members) return false;
  const member = workspace.members.find(m => m.user._id === userId || m.user === userId);
  return member && member.role === 'admin';
};

/**
 * Check if user is workspace member
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const isWorkspaceMember = (workspace, userId) => {
  if (!workspace || !workspace.members) return false;
  return workspace.members.some(m => m.user._id === userId || m.user === userId);
};

/**
 * Check if user is workspace owner
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const isWorkspaceOwner = (workspace, userId) => {
  if (!workspace) return false;
  return workspace.owner === userId || workspace.owner?._id === userId;
};

/**
 * Get user role in workspace
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {string|null} Role or null if not member
 */
export const getUserRole = (workspace, userId) => {
  if (!workspace || !workspace.members) return null;
  const member = workspace.members.find(m => m.user._id === userId || m.user === userId);
  return member ? member.role : null;
};

/**
 * Check if user can delete message
 * @param {Object} message - Message object
 * @param {string} userId - User ID
 * @param {Object} workspace - Workspace object
 * @returns {boolean}
 */
export const canDeleteMessage = (message, userId, workspace) => {
  if (!message) return false;
  
  // User can delete their own messages
  const isSender = message.sender?._id === userId || message.sender === userId;
  if (isSender) {
    return true;
  }
  
  // Admins can delete any message in their workspace
  return isWorkspaceAdmin(workspace, userId);
};

/**
 * Check if user can edit message
 * @param {Object} message - Message object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canEditMessage = (message, userId) => {
  if (!message) return false;
  // Only message sender can edit
  return message.sender?._id === userId || message.sender === userId;
};

/**
 * Check if user can clear chat
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canClearChat = (workspace, userId) => {
  // Only admins can clear chat
  return isWorkspaceAdmin(workspace, userId);
};

/**
 * Check if user can create channel
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canCreateChannel = (workspace, userId) => {
  // Admins and members can create channels
  return isWorkspaceMember(workspace, userId);
};

/**
 * Check if user can delete channel
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canDeleteChannel = (workspace, userId) => {
  // Only admins can delete channels
  return isWorkspaceAdmin(workspace, userId);
};

/**
 * Check if user can invite members
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canInviteMembers = (workspace, userId) => {
  // Admins and members can invite (configurable)
  return isWorkspaceMember(workspace, userId);
};

/**
 * Check if user can remove members
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canRemoveMember = (workspace, userId) => {
  // Only admins can remove members
  return isWorkspaceAdmin(workspace, userId);
};

/**
 * Check if user can update workspace settings
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canUpdateWorkspace = (workspace, userId) => {
  // Only admins and owner can update workspace settings
  return isWorkspaceAdmin(workspace, userId) || isWorkspaceOwner(workspace, userId);
};

/**
 * Check if user can delete workspace
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canDeleteWorkspace = (workspace, userId) => {
  // Only owner can delete workspace
  return isWorkspaceOwner(workspace, userId);
};

/**
 * Check if user can pin message
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canPinMessage = (workspace, userId) => {
  // Only admins can pin messages
  return isWorkspaceAdmin(workspace, userId);
};

/**
 * Check if user can start meeting
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export const canStartMeeting = (workspace, userId) => {
  // All members can start meetings
  return isWorkspaceMember(workspace, userId);
};

/**
 * Check if user can end meeting
 * @param {Object} meeting - Meeting object
 * @param {string} userId - User ID
 * @param {Object} workspace - Workspace object
 * @returns {boolean}
 */
export const canEndMeeting = (meeting, userId, workspace) => {
  if (!meeting) return false;
  
  // Meeting host can end meeting
  const isHost = meeting.host === userId || meeting.host?._id === userId;
  if (isHost) return true;
  
  // Workspace admins can end any meeting in their workspace
  return isWorkspaceAdmin(workspace, userId);
};

/**
 * Check permissions for multiple actions
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @param {Array} permissions - Array of permission strings to check
 * @returns {Object} Object with permission results
 */
export const checkPermissions = (workspace, userId, permissions) => {
  const results = {};
  
  permissions.forEach(permission => {
    switch (permission) {
      case 'admin':
        results.admin = isWorkspaceAdmin(workspace, userId);
        break;
      case 'member':
        results.member = isWorkspaceMember(workspace, userId);
        break;
      case 'owner':
        results.owner = isWorkspaceOwner(workspace, userId);
        break;
      case 'createChannel':
        results.createChannel = canCreateChannel(workspace, userId);
        break;
      case 'deleteChannel':
        results.deleteChannel = canDeleteChannel(workspace, userId);
        break;
      case 'inviteMembers':
        results.inviteMembers = canInviteMembers(workspace, userId);
        break;
      case 'removeMember':
        results.removeMember = canRemoveMember(workspace, userId);
        break;
      case 'updateWorkspace':
        results.updateWorkspace = canUpdateWorkspace(workspace, userId);
        break;
      case 'deleteWorkspace':
        results.deleteWorkspace = canDeleteWorkspace(workspace, userId);
        break;
      case 'clearChat':
        results.clearChat = canClearChat(workspace, userId);
        break;
      case 'pinMessage':
        results.pinMessage = canPinMessage(workspace, userId);
        break;
      case 'startMeeting':
        results.startMeeting = canStartMeeting(workspace, userId);
        break;
      default:
        results[permission] = false;
    }
  });
  
  return results;
};

/**
 * Get user permission level
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {string} 'owner', 'admin', 'member', or 'none'
 */
export const getPermissionLevel = (workspace, userId) => {
  if (!workspace) return 'none';
  if (isWorkspaceOwner(workspace, userId)) return 'owner';
  if (isWorkspaceAdmin(workspace, userId)) return 'admin';
  if (isWorkspaceMember(workspace, userId)) return 'member';
  return 'none';
};

/**
 * Get all user permissions as an object
 * @param {Object} workspace - Workspace object
 * @param {string} userId - User ID
 * @returns {Object} All permission flags
 */
export const getAllPermissions = (workspace, userId) => {
  return {
    isOwner: isWorkspaceOwner(workspace, userId),
    isAdmin: isWorkspaceAdmin(workspace, userId),
    isMember: isWorkspaceMember(workspace, userId),
    canCreateChannel: canCreateChannel(workspace, userId),
    canDeleteChannel: canDeleteChannel(workspace, userId),
    canInviteMembers: canInviteMembers(workspace, userId),
    canRemoveMember: canRemoveMember(workspace, userId),
    canUpdateWorkspace: canUpdateWorkspace(workspace, userId),
    canDeleteWorkspace: canDeleteWorkspace(workspace, userId),
    canClearChat: canClearChat(workspace, userId),
    canPinMessage: canPinMessage(workspace, userId),
    canStartMeeting: canStartMeeting(workspace, userId),
    permissionLevel: getPermissionLevel(workspace, userId)
  };
};

export default {
  isWorkspaceAdmin,
  isWorkspaceMember,
  isWorkspaceOwner,
  getUserRole,
  canDeleteMessage,
  canEditMessage,
  canClearChat,
  canCreateChannel,
  canDeleteChannel,
  canInviteMembers,
  canRemoveMember,
  canUpdateWorkspace,
  canDeleteWorkspace,
  canPinMessage,
  canStartMeeting,
  canEndMeeting,
  checkPermissions,
  getPermissionLevel,
  getAllPermissions
};