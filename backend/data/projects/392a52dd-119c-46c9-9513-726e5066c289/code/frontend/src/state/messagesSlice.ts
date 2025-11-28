import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as messageService from '../api/messages';
import { Message, MessageCreate, Conversation, ConversationCreate, ConversationWithMessages } from '../types/messages';
import { UUID } from '../types/common';
import { User } from '../types/users';

interface MessagesState {
  conversations: ConversationWithMessages[];
  currentConversation: ConversationWithMessages | null;
  loadingConversations: 'idle' | 'pending' | 'succeeded' | 'failed';
  loadingMessages: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  currentMessageText: string;
}

const initialState: MessagesState = {
  conversations: [],
  currentConversation: null,
  loadingConversations: 'idle',
  loadingMessages: 'idle',
  error: null,
  currentMessageText: '',
};

export const fetchConversations = createAsyncThunk<ConversationWithMessages[], UUID>(
  'messages/fetchConversations',
  async (userId, { rejectWithValue }) => {
    try {
      const data = await messageService.fetchConversations(userId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk<
  { conversationId: UUID; messages: Message[] },
  { conversationId: UUID; limit?: number; offset?: number } 
>(
  'messages/fetchMessages',
  async ({ conversationId, limit, offset }, { rejectWithValue }) => {
    try {
      const messages = await messageService.fetchMessages(conversationId, limit, offset);
      return { conversationId, messages };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk<
  Message, 
  { conversationId: UUID; messageData: MessageCreate } 
>(
  'messages/sendMessage',
  async ({ conversationId, messageData }, { rejectWithValue, dispatch, getState }) => {
    try {
      const newMessage = await messageService.sendMessage(conversationId, messageData);
      
      // Update the current conversation in the state immediately
      const state = getState() as RootState;
      const currentConversation = state.messages.currentConversation;
      if (currentConversation && currentConversation.conversation_id === conversationId) {
        const updatedConversation = {
          ...currentConversation,
          messages: [...currentConversation.messages, newMessage],
          updated_at: new Date().toISOString(), // Update conversation timestamp
        };
        dispatch(setMessagesForConversation(updatedConversation));
      }
      return newMessage;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to send message');
    }
  }
);

export const createConversation = createAsyncThunk<Conversation, ConversationCreate>(
  'messages/createConversation',
  async (conversationData, { rejectWithValue }) => {
    try {
      const data = await messageService.createConversation(conversationData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create conversation');
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    resetMessagesState: (state) => {
      state.conversations = [];
      state.currentConversation = null;
      state.loadingConversations = 'idle';
      state.loadingMessages = 'idle';
      state.error = null;
      state.currentMessageText = '';
    },
    setCurrentMessageText: (state, action: PayloadAction<string>) => {
      state.currentMessageText = action.payload;
    },
    setCurrentConversation: (state, action: PayloadAction<ConversationWithMessages | null>) => {
      state.currentConversation = action.payload;
    },
    setMessagesForConversation: (state, action: PayloadAction<ConversationWithMessages>) => {
      const updatedConversation = action.payload;
      // Update the conversation in the list
      const index = state.conversations.findIndex(
        (conv) => conv.conversation_id === updatedConversation.conversation_id
      );
      if (index !== -1) {
        state.conversations[index] = updatedConversation;
      } else {
        // If it's a new conversation (e.g., from creation), add it
        state.conversations.push(updatedConversation);
      }
      // Also update the currentConversation if it matches
      if (state.currentConversation?.conversation_id === updatedConversation.conversation_id) {
        state.currentConversation = updatedConversation;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = 'pending';
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<ConversationWithMessages[]>) => {
        state.loadingConversations = 'succeeded';
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = 'failed';
        state.error = action.payload as string;
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = 'pending';
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<{ conversationId: UUID; messages: Message[] }>) => {
        state.loadingMessages = 'succeeded';
        const { conversationId, messages } = action.payload;
        // Find the conversation and update its messages
        const conversationIndex = state.conversations.findIndex(conv => conv.conversation_id === conversationId);
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].messages = messages.reverse(); // Store messages in chronological order
        }
        // Update current conversation if it matches
        if (state.currentConversation?.conversation_id === conversationId) {
            state.currentConversation.messages = messages.reverse();
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = 'failed';
        state.error = action.payload as string;
      })
      // Send Message
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        // The message is added to currentConversation in the reducer logic above
        // We might need to ensure the conversation exists in the main `conversations` list too
        const newMessage = action.payload;
        const conversationExists = state.conversations.some(conv => conv.conversation_id === newMessage.conversation_id);
        if (!conversationExists && state.currentConversation?.conversation_id === newMessage.conversation_id) {
          // If currentConversation was just loaded and not in the list yet, add it
          state.conversations.push({...state.currentConversation, messages: [...state.currentConversation.messages, newMessage]});
        } else if (conversationExists) {
          // Ensure the conversation in the list is updated if the current one isn't showing it yet
          const convIndex = state.conversations.findIndex(conv => conv.conversation_id === newMessage.conversation_id);
          if(convIndex !== -1 && !state.conversations[convIndex].messages.some(msg => msg.message_id === newMessage.message_id)) {
            state.conversations[convIndex].messages.push(newMessage);
            // Update conversation's last message details for list preview
            state.conversations[convIndex].messages[0] = newMessage; // Assuming messages[0] is the latest
            state.conversations[convIndex].updated_at = newMessage.sent_at;
          }
        }
        state.currentMessageText = ''; // Clear input after sending
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Create Conversation
      .addCase(createConversation.fulfilled, (state, action: PayloadAction<Conversation>) => {
        // Add the new conversation to the list, possibly with an empty messages array initially
        // The API returns Conversation, not ConversationWithMessages, so we need to construct it
        const newConvo: ConversationWithMessages = {
          ...action.payload,
          messages: [],
        };
        state.conversations.unshift(newConvo); // Add to the beginning of the list
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { resetMessagesState, setCurrentMessageText, setCurrentConversation, setMessagesForConversation } = messagesSlice.actions;

export default messagesSlice.reducer;
