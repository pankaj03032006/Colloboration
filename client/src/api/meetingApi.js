import axiosInstance from './axios';

export const createMeeting = async (workspaceId, channelId) => {
  const response = await axiosInstance.post('/meetings/create', { workspaceId, channelId });
  return response.data;
};

export const getMeeting = async (meetingId) => {
  const response = await axiosInstance.get(`/meetings/${meetingId}`);
  return response.data;
};

export const endMeeting = async (meetingId) => {
  const response = await axiosInstance.post(`/meetings/${meetingId}/end`);
  return response.data;
};