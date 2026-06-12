const Workspace = require('../models/Workspace');

const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      const workspace = await Workspace.findById(req.params.workspaceId || req.body.workspaceId);
      
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }
      
      const member = workspace.members.find(m => m.user.toString() === req.user.id);
      
      if (!member || !roles.includes(member.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

const isWorkspaceMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId || req.body.workspaceId);
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const isMember = workspace.members.some(m => m.user.toString() === req.user.id);
    
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }
    
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkRole, isWorkspaceMember };