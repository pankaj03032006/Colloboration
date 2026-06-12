import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  currentChannel: null,
  typingUsers: {},
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter(msg => msg._id !== action.payload);
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(msg => msg._id === action.payload._id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    setCurrentChannel: (state, action) => {
      state.currentChannel = action.payload;
    },
    setTypingUser: (state, action) => {
      const { userId, isTyping } = action.payload;
      if (isTyping) {
        state.typingUsers[userId] = true;
      } else {
        delete state.typingUsers[userId];
      }
    },
    clearChat: (state) => {
      state.messages = [];
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setMessages,
  addMessage,
  removeMessage,
  updateMessage,
  setCurrentChannel,
  setTypingUser,
  clearChat,
  setLoading,
} = chatSlice.actions;

export default chatSlice.reducer;