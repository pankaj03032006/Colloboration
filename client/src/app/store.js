import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/slices/authSlice';
import chatReducer from '../redux/slices/chatSlice';
import workspaceReducer from '../redux/slices/workspaceSlice';
import meetingReducer from '../redux/slices/meetingSlice';
import notificationReducer from '../redux/slices/notificationSlice';
import userReducer from '../redux/slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    workspace: workspaceReducer,
    meeting: meetingReducer,
    notification: notificationReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;