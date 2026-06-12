import axiosInstance from './axios';

export const sendMessage = async (messageData) => {
  const response = await axiosInstance.post('/messages', messageData);
  return response.data;
};

export const getMessages = async (channelId, limit = 50) => {
  const response = await axiosInstance.get(`/messages/channel/${channelId}?limit=${limit}`);
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await axiosInstance.delete(`/messages/${messageId}`);
  return response.data;
};

export const editMessage = async (messageId, content) => {
  const response = await axiosInstance.put(`/messages/${messageId}`, { content });
  return response.data;
};

export const addReaction = async (messageId, emoji) => {
  const response = await axiosInstance.post(`/messages/${messageId}/reactions`, { emoji });
  return response.data;
};

export const clearChannelMessages = async (channelId) => {
  const response = await axiosInstance.delete(`/messages/channel/${channelId}/clear`);
  return response.data;
};