import api from './api';
import { Message, MessageCreate, Conversation, ConversationCreate, ConversationWithMessages } from '../types/messages';
import { UUID } from '../types/common';

// Conversations
export const createConversation = async (conversationData: ConversationCreate): Promise<Conversation> => {
  try {
    const response = await api.post('/v1/messages/conversations/', conversationData);
    return response.data;
  } catch (error: any) {
    console.error('Error creating conversation:', error.response?.data?.detail || error.message);
    throw error;
  }
};

export const fetchConversations = async (userId: UUID): Promise<ConversationWithMessages[]> => {
  try {
    // Note: The API endpoint is /conversations/me/ which doesn't need userId in the URL
    // as it's determined by the authenticated user.
    const response = await api.get('/v1/messages/conversations/me/');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching conversations:', error.response?.data?.detail || error.message);
    throw error;
  }
};

export const fetchConversationById = async (conversationId: UUID): Promise<ConversationWithMessages> => {
    try {
      const response = await api.get(`/v1/messages/conversations/${conversationId}/messages/`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching conversation by ID:', error.response?.data?.detail || error.message);
      throw error;
    }
  };

// Messages
export const sendMessage = async (conversationId: UUID, messageData: MessageCreate): Promise<Message> => {
  try {
    const response = await api.post(`/v1/messages/conversations/${conversationId}/messages/`, messageData);
    return response.data;
  } catch (error: any) {
    console.error('Error sending message:', error.response?.data?.detail || error.message);
    throw error;
  }
};

export const fetchMessages = async (conversationId: UUID, limit?: number, offset?: number): Promise<Message[]> => {
  try {
    const response = await api.get(`/v1/messages/conversations/${conversationId}/messages/`, {
      params: { limit, offset },
    });
    // The API call already marks messages as read upon fetching
    return response.data;
  } catch (error: any) {
    console.error('Error fetching messages:', error.response?.data?.detail || error.message);
    throw error;
  }
};

export const markConversationAsRead = async (conversationId: UUID, userId: UUID): Promise<number> => {
  try {
    // The backend handles marking as read when fetching messages, so this endpoint might not be needed separately.
    // If a dedicated endpoint is preferred: const response = await api.post(`/v1/messages/conversations/${conversationId}/read/`, { user_id: userId });
    // For now, assuming read status is updated on message fetch.
    return 0; // Placeholder
  } catch (error: any) {
    console.error('Error marking conversation as read:', error.response?.data?.detail || error.message);
    throw error;
  }
};
