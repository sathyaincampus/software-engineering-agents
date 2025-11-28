import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Button, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../state/store';
import { sendMessage } from '../../state/messagesSlice';
import { MessageCreate } from '../../types/messages';
import { User } from '../../types/users';

interface MessageFormProps {
  conversationId: string;
  receiverId: string; // The ID of the user to send the message to
}

const MessageForm: React.FC<MessageFormProps> = ({ conversationId, receiverId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [messageText, setMessageText] = useState('');
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const handleSendMessage = () => {
    if (messageText.trim() === '') {
      Alert.alert('Cannot send empty message');
      return;
    }
    if (!currentUser || !receiverId) {
      Alert.alert('Error', 'Sender or Receiver not identified.');
      return;
    }

    const messageData: MessageCreate = {
      receiver_id: receiverId,
      content: messageText,
    };

    dispatch(sendMessage({ conversationId, messageData }));
    setMessageText(''); // Clear input after sending
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <Button 
          mode="contained" 
          onPress={handleSendMessage} 
          disabled={messageText.trim() === '' || !currentUser}
          icon="send"
          style={styles.sendButton}>
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    borderRadius: 25, // Make button round
    paddingVertical: 8, // Adjust padding
  },
});

export default MessageForm;
