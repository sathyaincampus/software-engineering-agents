import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Button, Title, Paragraph, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../state/store';
import { fetchEvents } from '../state/eventsSlice';
import { fetchTasks } from '../state/tasksSlice';
import { fetchFamilyMembers } from '../state/familyMembersSlice';
import { fetchConversations } from '../state/messagesSlice'; // Import for messaging feature
import { User } from '../types/users';

const HomeScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const upcomingEvents = useSelector((state: RootState) => state.events.items.slice(0, 3)); // Get first 3 upcoming events
  const pendingTasks = useSelector((state: RootState) => state.tasks.items.filter(task => task.status === 'pending').slice(0, 3)); // Get first 3 pending tasks
  const conversations = useSelector((state: RootState) => state.messages.conversations);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchEvents(currentUser.family_id));
      dispatch(fetchTasks(currentUser.family_id));
      dispatch(fetchFamilyMembers(currentUser.family_id));
      dispatch(fetchConversations(currentUser.user_id)); // Fetch conversations to show on home screen
    }
  }, [currentUser, dispatch]);

  const getUnreadMessageCount = (conversation: any) => {
    // Assume 'messages' array in conversation and a way to determine 'unread'
    // For simplicity, let's count messages where read_at is null and sender is not the current user
    if (!conversation.messages || conversation.messages.length === 0) return 0;
    
    let unreadCount = 0;
    conversation.messages.forEach((msg: any) => {
      // Count if message is not read and was sent by the other person
      if (!msg.read_at && msg.sender_id !== currentUser?.user_id) {
        unreadCount++;
      }
    });
    return unreadCount;
  };

  // Sort conversations by last message time (descending)
  const sortedConversations = [...conversations].sort((a, b) => {
    const lastMessageA = a.messages?.[0];
    const lastMessageB = b.messages?.[0];
    if (!lastMessageA && !lastMessageB) return 0;
    if (!lastMessageA) return 1;
    if (!lastMessageB) return -1;
    return new Date(lastMessageB.sent_at).getTime() - new Date(lastMessageA.sent_at).getTime();
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Welcome, {currentUser?.display_name}!</Text>

      {/* Upcoming Events Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Upcoming Events</Title>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <View key={event.event_id} style={styles.listItem}>
                <Text style={styles.itemTitle}>{event.title}</Text>
                <Text style={styles.itemTime}>
                  {new Date(event.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                  {' at '}
                  {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))
          ) : (
            <Paragraph>No upcoming events.</Paragraph>
          )}
          <Button mode="outlined" onPress={() => {}} style={styles.cardButton}>View All</Button>
        </Card.Content>
      </Card>

      {/* Pending Tasks Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Pending Tasks</Title>
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <View key={task.task_id} style={styles.listItem}>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <Text style={styles.itemDetails}>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</Text>
              </View>
            ))
          ) : (
            <Paragraph>No pending tasks.</Paragraph>
          )}
          <Button mode="outlined" onPress={() => {}} style={styles.cardButton}>View All</Button>
        </Card.Content>
      </Card>

      {/* Messaging Section */}
      {(currentUser?.role === 'parent') && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Messages</Title>
            {sortedConversations.length > 0 ? (
              sortedConversations.slice(0, 3).map((conversation) => {
                const otherParticipant = conversation.parent_id === currentUser?.user_id
                  ? familyMembers.find(m => m.user_id === conversation.child_id)
                  : familyMembers.find(m => m.user_id === conversation.parent_id);
                
                const unreadCount = getUnreadMessageCount(conversation);

                return (
                  <TouchableOpacity key={conversation.conversation_id} onPress={() => {}} style={styles.messageListItem}>
                    <View style={styles.messageInfo}>
                      <Text style={styles.messageName}>{otherParticipant?.display_name || 'Unknown User'}</Text>
                      <Text style={styles.messageContent} numberOfLines={1}>
                        {conversation.messages?.[0]?.content || 'No messages yet'}
                      </Text>
                    </View>
                    <View style={styles.messageDetails}>
                      <Text style={styles.messageTime}>{conversation.messages?.[0]?.sent_at ? new Date(conversation.messages[0].sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) : ''}</Text>
                      {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadCount}>{unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Paragraph>No messages yet.</Paragraph>
            )}
            <Button mode="outlined" onPress={() => {}} style={styles.cardButton}>View All Messages</Button>
          </Card.Content>
        </Card>
      )}

      {/* FAB for adding new tasks/events could go here or be managed by navigation */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f0f2f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 3,
  },
  listItem: {
    marginVertical: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  itemDetails: {
      fontSize: 13,
      color: '#666',
      marginTop: 2,
  },
  cardButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  messageListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  messageInfo: {
    flex: 1,
    marginRight: 10,
  },
  messageName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#555',
  },
  messageDetails: {
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#6200ee',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
