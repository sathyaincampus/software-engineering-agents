import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Avatar, Button, Divider, Title, Paragraph, Searchbar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../state/store';
import { fetchConversations, setCurrentConversation, fetchMessages } from '../../state/messagesSlice';
import { ConversationWithMessages } from '../../types/messages';
import { User } from '../../types/users';

interface ConversationListModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: ConversationWithMessages) => void;
  currentUser: User | null;
  familyMembers: User[];
}

const ConversationListModal: React.FC<ConversationListModalProps> = ({
  visible,
  onClose,
  onSelectConversation,
  currentUser,
  familyMembers,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const conversations = useSelector((state: RootState) => state.messages.conversations);
  const loadingConversations = useSelector((state: RootState) => state.messages.loadingConversations);
  const conversationsError = useSelector((state: RootState) => state.messages.error);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible && currentUser) {
      dispatch(fetchConversations(currentUser.user_id));
    }
  }, [visible, currentUser, dispatch]);

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery) {
      return conversations;
    }
    return conversations.filter(conversation => {
      const otherParticipant = conversation.parent_id === currentUser?.user_id
        ? familyMembers.find(m => m.user_id === conversation.child_id)
        : familyMembers.find(m => m.user_id === conversation.parent_id);
      const participantName = otherParticipant?.display_name.toLowerCase() || '';
      const lastMessageContent = conversation.messages?.[0]?.content.toLowerCase() || '';
      return participantName.includes(searchQuery.toLowerCase()) || lastMessageContent.includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery, currentUser, familyMembers]);

  const getUnreadCount = (conversation: ConversationWithMessages): number => {
    if (!conversation.messages || conversation.messages.length === 0) return 0;
    let unreadCount = 0;
    conversation.messages.forEach((msg) => {
      // Count if message is not read and was sent by someone else
      if (!msg.read_at && msg.sender_id !== currentUser?.user_id) {
        unreadCount++;
      }
    });
    return unreadCount;
  };

  const renderConversationItem = useCallback(({ item }: { item: ConversationWithMessages }) => {
    const otherParticipant = item.parent_id === currentUser?.user_id
      ? familyMembers.find(m => m.user_id === item.child_id)
      : familyMembers.find(m => m.user_id === item.parent_id);
    
    const unreadCount = getUnreadCount(item);
    const lastMessage = item.messages?.[0];

    return (
      <TouchableOpacity onPress={() => onSelectConversation(item)} style={styles.conversationItem}>
        <Avatar.Image size={50} source={{ uri: otherParticipant?.avatar_url || 'https://via.placeholder.com/150' }} style={styles.avatar} />
        <View style={styles.conversationInfo}>
          <View style={styles.nameAndTimeContainer}>
            <Text style={styles.participantName}>{otherParticipant?.display_name || 'Unknown'}</Text>
            {lastMessage && (
              <Text style={styles.lastMessageTime}>{new Date(lastMessage.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            )}
          </View>
          <View style={styles.contentAndBadgeContainer}>
            <Text style={styles.lastMessageContent} numberOfLines={1}>{lastMessage?.content || 'No messages yet'}</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [currentUser, familyMembers, onSelectConversation, getUnreadCount]);

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={styles.modalContainer}>
      <Title style={styles.modalTitle}>Messages</Title>
      <Searchbar
        placeholder="Search conversations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      {loadingConversations === 'pending' && <Paragraph>Loading conversations...</Paragraph>}
      {conversationsError && <Paragraph style={styles.errorText}>Error loading conversations: {conversationsError}</Paragraph>}
      {!conversationsError && filteredConversations.length === 0 && !loadingConversations === 'pending' && (
        <Paragraph>No conversations yet. Start one with your child!</Paragraph>
      )}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.conversation_id}
        style={styles.conversationList}
      />
      <Button mode="outlined" onPress={onClose} style={styles.closeButton}>
        Close
      </Button>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    flex: 1, // Take up available space to allow scrolling
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  conversationList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  avatar: {
    marginRight: 15,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameAndTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    maxWidth: '70%',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#888',
  },
  contentAndBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageContent: {
    fontSize: 14,
    color: '#555',
    flex: 1, // Take available space
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default ConversationListModal;
