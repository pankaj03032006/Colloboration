import axiosInstance from './axios';

export const getWorkspaces = async () => {
  const response = await axiosInstance.get('/workspaces');
  return response.data;
};

export const createWorkspace = async (name, description) => {
  const response = await axiosInstance.post('/workspaces', { name, description });
  return response.data;
};

export const getWorkspaceById = async (id) => {
  const response = await axiosInstance.get(`/workspaces/${id}`);
  return response.data;
};

export const inviteToWorkspace = async (workspaceId, email, role) => {
  const response = await axiosInstance.post(`/workspaces/${workspaceId}/invite`, { email, role });
  return response.data;
};

export const joinWorkspace = async (workspaceId) => {
  const response = await axiosInstance.post(`/workspaces/${workspaceId}/join`);
  return response.data;
};