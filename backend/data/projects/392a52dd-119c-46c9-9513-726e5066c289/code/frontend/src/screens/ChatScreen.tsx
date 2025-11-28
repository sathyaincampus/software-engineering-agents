import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Avatar, Title, Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../state/store';
import { fetchMessages, sendMessage, fetchConversations, setCurrentConversation } from '../state/messagesSlice';
import { Message, ConversationWithMessages } from '../types/messages';
import { User } from '../types/users';
import MessageForm from '../components/forms/MessageForm';


const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
  },
};

interface ChatScreenProps {
  route: any; // Type navigation route params
  navigation: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { conversationId, receiver } = route.params as { conversationId: UUID; receiver: User };

  const messages = useSelector((state: RootState) => state.messages.currentConversation?.messages || []);
  const currentConversation = useSelector((state: RootState) => state.messages.currentConversation);
  const loadingMessages = useSelector((state: RootState) => state.messages.loadingMessages);
  const error = useSelector((state: RootState) => state.messages.error);
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (conversationId) {
      // Fetch messages for the selected conversation
      dispatch(fetchMessages({ conversationId }));
      // Set the current conversation in the state
      // We need to fetch the full conversation data (including participant info) if not already available
      // For simplicity, we pass receiver info via route params. Ideally, conversation data is fetched and stored.
      const initialConversation: ConversationWithMessages = {
        conversation_id: conversationId,
        parent_id: currentUser?.role === 'parent' ? currentUser.user_id : receiver.user_id,
        child_id: currentUser?.role === 'child' ? currentUser.user_id : receiver.user_id,
        family_id: currentUser?.family_id || receiver.family_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [], // Will be populated by fetchMessages
      };
      dispatch(setCurrentConversation(initialConversation));
    }
  }, [conversationId, dispatch, receiver, currentUser]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isSentByCurrentUser = item.sender_id === currentUser?.user_id;
    const messageTimestamp = new Date(item.sent_at);

    return (
      <View style={[styles.messageBubble, isSentByCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
        <Text style={isSentByCurrentUser ? styles.sentText : styles.receivedText}>{item.content}</Text>
        <Text style={isSentByCurrentUser ? styles.sentTimestamp : styles.receivedTimestamp}>{messageTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    );
  }, [currentUser, messages]); // Ensure messages dependency is correct

  const getChatHeaderTitle = () => {
    if (receiver) {
      return receiver.display_name;
    }
    // Fallback if receiver info is not readily available, e.g., show conversation ID or a generic title
    return 'Chat';
  };

  // Update header title dynamically
  useEffect(() => {
    navigation.setOptions({ headerTitle: getChatHeaderTitle() });
  }, [receiver, navigation]);

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <View style={styles.messagesContainer}>
          {loadingMessages === 'pending' && <Text>Loading messages...</Text>}
          {error && <Text style={styles.errorText}>Error: {error}</Text>}
          {!error && messages.length === 0 && loadingMessages !== 'pending' && (
            <Text style={styles.noMessagesText}>No messages yet. Start the conversation!</Text>
          )}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.message_id}
            style={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        <MessageForm
          conversationId={conversationId}
          receiverId={receiver.user_id}
        />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 15,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  sentMessage: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  receivedMessage: {
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  sentText: {
    color: 'white',
    fontSize: 16,
  },
  receivedText: {
    color: '#212529',
    fontSize: 16,
  },
  sentTimestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  receivedTimestamp: {
    fontSize: 10,
    color: '#6c757d',
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  noMessagesText: {
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ChatScreen;
