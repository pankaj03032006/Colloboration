// server/src/services/meetingService.js
const Meeting = require('../models/Meeting');

class MeetingService {
  // Create a new meeting
  async createMeeting(hostId, title, description = '') {
    try {
      const meetingId = this.generateMeetingId();
      
      const meeting = await Meeting.create({
        meetingId,
        host: hostId,
        title,
        description,
        participants: [hostId],
        status: 'waiting',
        startedAt: new Date()
      });
      
      return meeting;
    } catch (error) {
      throw error;
    }
  }

  // Generate unique meeting ID
  generateMeetingId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  // Join meeting
  async joinMeeting(meetingId, userId, userName) {
    try {
      let meeting = await Meeting.findOne({ meetingId });
      
      if (!meeting) {
        // Create new meeting if doesn't exist
        meeting = await this.createMeeting(userId, `Meeting ${meetingId}`);
      }
      
      // Add participant if not already in
      if (!meeting.participants.includes(userId)) {
        meeting.participants.push(userId);
        await meeting.save();
      }
      
      return meeting;
    } catch (error) {
      throw error;
    }
  }

  // Leave meeting
  async leaveMeeting(meetingId, userId) {
    try {
      const meeting = await Meeting.findOne({ meetingId });
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      meeting.participants = meeting.participants.filter(p => p.toString() !== userId);
      
      // If no participants left, end the meeting
      if (meeting.participants.length === 0) {
        meeting.status = 'ended';
        meeting.endedAt = new Date();
      }
      
      await meeting.save();
      return meeting;
    } catch (error) {
      throw error;
    }
  }

  // End meeting
  async endMeeting(meetingId, userId) {
    try {
      const meeting = await Meeting.findOne({ meetingId });
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      // Check if user is host
      if (meeting.host.toString() !== userId) {
        throw new Error('Only the host can end the meeting');
      }
      
      meeting.status = 'ended';
      meeting.endedAt = new Date();
      await meeting.save();
      
      return meeting;
    } catch (error) {
      throw error;
    }
  }

  // Get meeting details
  async getMeeting(meetingId) {
    try {
      const meeting = await Meeting.findOne({ meetingId })
        .populate('host', 'name email')
        .populate('participants', 'name email status');
      
      if (!meeting) {
        throw new Error('Meeting not found');
      }
      
      return meeting;
    } catch (error) {
      throw error;
    }
  }

  // Get user's meetings
  async getUserMeetings(userId) {
    try {
      const meetings = await Meeting.find({
        participants: userId,
        status: { $ne: 'ended' }
      }).sort('-createdAt');
      
      return meetings;
    } catch (error) {
      throw error;
    }
  }

  // Get meeting history
  async getMeetingHistory(userId, limit = 50) {
    try {
      const meetings = await Meeting.find({
        participants: userId,
        status: 'ended'
      }).sort('-endedAt').limit(limit);
      
      return meetings;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MeetingService();