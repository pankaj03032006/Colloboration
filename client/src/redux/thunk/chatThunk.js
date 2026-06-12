import { setMessages, addMessage, removeMessage, setLoading } from '../slices/chatSlice';
import { getMessages, sendMessage as sendMessageApi, deleteMessage as deleteMessageApi } from '../../../api/chatApi';

export const fetchMessages = (channelId) => async (dispatch) => {
  try {
    dispatch(setLoading(true));
    const data = await getMessages(channelId);
    if (data.success) {
      dispatch(setMessages(data.messages));
    }
  } catch (error) {
    console.error('Failed to fetch messages:', error);
  } finally {
    dispatch(setLoading(false));
  }
};

export const sendMessage = (content, channelId, workspaceId) => async (dispatch) => {
  try {
    const data = await sendMessageApi({ content, channelId, workspaceId });
    if (data.success) {
      dispatch(addMessage(data.message));
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

export const deleteMessageThunk = (messageId) => async (dispatch) => {
  try {
    const data = await deleteMessageApi(messageId);
    if (data.success) {
      dispatch(removeMessage(messageId));
    }
  } catch (error) {
    console.error('Failed to delete message:', error);
  }
};