import { setCredentials, setLoading, setError, logout } from '../slices/authSlice';
import { login as loginApi, register as registerApi } from '../../../api/authApi';

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const data = await loginApi({ email, password });
    dispatch(setCredentials({ user: data, token: data.token }));
    return { success: true };
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Login failed'));
    return { success: false, error: error.response?.data?.message };
  } finally {
    dispatch(setLoading(false));
  }
};

export const register = (name, email, password) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const data = await registerApi({ name, email, password });
    dispatch(setCredentials({ user: data, token: data.token }));
    return { success: true };
  } catch (error) {
    dispatch(setError(error.response?.data?.message || 'Registration failed'));
    return { success: false, error: error.response?.data?.message };
  } finally {
    dispatch(setLoading(false));
  }
};

export const logoutUser = () => (dispatch) => {
  dispatch(logout());
};