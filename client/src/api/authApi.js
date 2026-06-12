import axiosInstance from './axios';

export const register = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const login = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const updateUserStatus = async (status) => {
  const response = await axiosInstance.put('/auth/status', { status });
  const user = getCurrentUser();
  if (user) {
    user.status = status;
    localStorage.setItem('user', JSON.stringify(user));
  }
  return response.data;
};