const Meeting = require('../models/Meeting');

// @desc    Create meeting
const createMeeting = async (req, res) => {
  try {
    const { workspaceId, channelId } = req.body;
    const meetingId = Math.random().toString(36).substring(2, 10);
    
    const meeting = await Meeting.create({
      meetingId,
      workspace: workspaceId,
      channel: channelId,
      host: req.user.id
    });
    
    res.json({
      success: true,
      meetingId: meeting.meetingId,
      meetingUrl: `/meeting/${meeting.meetingId}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get meeting
const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.id })
      .populate('host', 'name email avatar')
      .populate('participants.user', 'name email avatar');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.json({ success: true, meeting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    End meeting
const endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.id });
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    meeting.status = 'ended';
    meeting.endedAt = new Date();
    meeting.duration = Math.floor((meeting.endedAt - meeting.startedAt) / 1000);
    await meeting.save();
    
    res.json({ success: true, message: 'Meeting ended' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createMeeting, getMeeting, endMeeting };