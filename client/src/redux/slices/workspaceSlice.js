import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  channels: [],
  currentChannel: null,
  isLoading: false,
  error: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload;
    },
    addWorkspace: (state, action) => {
      state.workspaces.push(action.payload);
    },
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
      state.channels = action.payload?.channels || [];
    },
    setChannels: (state, action) => {
      state.channels = action.payload;
    },
    addChannel: (state, action) => {
      state.channels.push(action.payload);
    },
    setCurrentChannel: (state, action) => {
      state.currentChannel = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setWorkspaces,
  addWorkspace,
  setCurrentWorkspace,
  setChannels,
  addChannel,
  setCurrentChannel,
  setLoading,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;