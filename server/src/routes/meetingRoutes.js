const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// @desc    Create meeting
// @route   POST /api/meetings/create
router.post('/create', protect, async (req, res) => {
  try {
    const { workspaceId, channelId } = req.body;
    
    // Generate unique meeting ID
    const meetingId = Math.random().toString(36).substring(2, 10);
    
    res.json({ 
      success: true, 
      meetingId,
      meetingUrl: `/meeting/${meetingId}`,
      message: 'Meeting created successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Join meeting
// @route   GET /api/meetings/:meetingId
router.get('/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Validate meeting exists (you can store meetings in DB)
    res.json({ 
      success: true, 
      meetingId,
      message: 'Meeting joined successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;