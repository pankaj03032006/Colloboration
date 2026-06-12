// server/src/services/workspaceService.js
const Workspace = require('../models/Workspace');
const Channel = require('../models/Channel');
const Message = require('../models/Message');

class WorkspaceService {
  // Create workspace
  async createWorkspace(name, description, ownerId) {
    try {
      // Create default channel
      const generalChannel = await Channel.create({
        name: 'general',
        description: 'General discussion channel',
        workspace: null, // Will be set after workspace creation
        type: 'public',
        createdBy: ownerId
      });

      // Create workspace
      const workspace = await Workspace.create({
        name,
        description,
        owner: ownerId,
        members: [ownerId],
        channels: [generalChannel._id]
      });

      // Update channel with workspace ID
      generalChannel.workspace = workspace._id;
      await generalChannel.save();

      return workspace.populate('channels');
    } catch (error) {
      throw error;
    }
  }

  // Get user workspaces
  async getUserWorkspaces(userId) {
    try {
      const workspaces = await Workspace.find({
        $or: [
          { owner: userId },
          { members: userId }
        ]
      })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate('channels');
      
      return workspaces;
    } catch (error) {
      throw error;
    }
  }

  // Get workspace by ID
  async getWorkspaceById(workspaceId, userId) {
    try {
      const workspace = await Workspace.findOne({
        _id: workspaceId,
        $or: [
          { owner: userId },
          { members: userId }
        ]
      })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate('channels');
      
      if (!workspace) {
        throw new Error('Workspace not found or access denied');
      }
      
      return workspace;
    } catch (error) {
      throw error;
    }
  }

  // Join workspace
  async joinWorkspace(workspaceId, userId) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      if (workspace.members.includes(userId)) {
        throw new Error('Already a member of this workspace');
      }
      
      workspace.members.push(userId);
      await workspace.save();
      
      return workspace;
    } catch (error) {
      throw error;
    }
  }

  // Leave workspace
  async leaveWorkspace(workspaceId, userId) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      if (workspace.owner.toString() === userId) {
        throw new Error('Owner cannot leave workspace. Transfer ownership first or delete workspace.');
      }
      
      workspace.members = workspace.members.filter(m => m.toString() !== userId);
      await workspace.save();
      
      return workspace;
    } catch (error) {
      throw error;
    }
  }

  // Update workspace
  async updateWorkspace(workspaceId, userId, updateData) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      if (workspace.owner.toString() !== userId) {
        throw new Error('Only workspace owner can update workspace');
      }
      
      const updatedWorkspace = await Workspace.findByIdAndUpdate(
        workspaceId,
        updateData,
        { new: true, runValidators: true }
      );
      
      return updatedWorkspace;
    } catch (error) {
      throw error;
    }
  }

  // Delete workspace
  async deleteWorkspace(workspaceId, userId) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      if (workspace.owner.toString() !== userId) {
        throw new Error('Only workspace owner can delete workspace');
      }
      
      // Delete all channels and messages in workspace
      await Channel.deleteMany({ workspace: workspaceId });
      await Message.deleteMany({ workspace: workspaceId });
      await Workspace.findByIdAndDelete(workspaceId);
      
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Add channel to workspace
  async addChannelToWorkspace(workspaceId, userId, channelData) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      if (!workspace.members.includes(userId)) {
        throw new Error('Must be a workspace member to create channels');
      }
      
      const channel = await Channel.create({
        ...channelData,
        workspace: workspaceId,
        createdBy: userId
      });
      
      workspace.channels.push(channel._id);
      await workspace.save();
      
      return channel;
    } catch (error) {
      throw error;
    }
  }

  // Get workspace members
  async getWorkspaceMembers(workspaceId, userId) {
    try {
      const workspace = await Workspace.findById(workspaceId)
        .populate('members', 'name email avatar status lastSeen');
      
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      return workspace.members;
    } catch (error) {
      throw error;
    }
  }

  // Transfer ownership
  async transferOwnership(workspaceId, ownerId, newOwnerId) {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }
      
      if (workspace.owner.toString() !== ownerId) {
        throw new Error('Only workspace owner can transfer ownership');
      }
      
      if (!workspace.members.includes(newOwnerId)) {
        throw new Error('New owner must be a workspace member');
      }
      
      workspace.owner = newOwnerId;
      await workspace.save();
      
      return workspace;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WorkspaceService();