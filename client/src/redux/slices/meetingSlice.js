import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentMeeting: null,
  participants: [],
  isCallActive: false,
  localStream: null,
  remoteStream: null,
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setCurrentMeeting: (state, action) => {
      state.currentMeeting = action.payload;
    },
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
    addParticipant: (state, action) => {
      state.participants.push(action.payload);
    },
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(p => p.id !== action.payload);
    },
    setIsCallActive: (state, action) => {
      state.isCallActive = action.payload;
    },
    setLocalStream: (state, action) => {
      state.localStream = action.payload;
    },
    setRemoteStream: (state, action) => {
      state.remoteStream = action.payload;
    },
    toggleAudio: (state) => {
      state.isAudioEnabled = !state.isAudioEnabled;
    },
    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled;
    },
    setScreenSharing: (state, action) => {
      state.isScreenSharing = action.payload;
    },
    resetMeeting: (state) => {
      return initialState;
    },
  },
});

export const {
  setCurrentMeeting,
  setParticipants,
  addParticipant,
  removeParticipant,
  setIsCallActive,
  setLocalStream,
  setRemoteStream,
  toggleAudio,
  toggleVideo,
  setScreenSharing,
  resetMeeting,
} = meetingSlice.actions;

export default meetingSlice.reducer;