import { setWorkspaces, setCurrentWorkspace, setLoading } from '../slices/workspaceSlice';
import { getWorkspaces, createWorkspace as createWorkspaceApi, joinWorkspace as joinWorkspaceApi } from '../../../api/workspaceApi';

export const fetchWorkspaces = () => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const data = await getWorkspaces();
    if (data.success) {
      dispatch(setWorkspaces(data.workspaces));
    }
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
  } finally {
    dispatch(setLoading(false));
  }
};

export const createWorkspaceThunk = (name, description) => async (dispatch) => {
  try {
    const data = await createWorkspaceApi(name, description);
    if (data.success) {
      await dispatch(fetchWorkspaces());
      dispatch(setCurrentWorkspace(data.workspace));
      return { success: true, workspace: data.workspace };
    }
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return { success: false };
  }
};

export const joinWorkspaceThunk = (workspaceId) => async (dispatch) => {
  try {
    const data = await joinWorkspaceApi(workspaceId);
    if (data.success) {
      await dispatch(fetchWorkspaces());
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to join workspace:', error);
    return { success: false };
  }
};