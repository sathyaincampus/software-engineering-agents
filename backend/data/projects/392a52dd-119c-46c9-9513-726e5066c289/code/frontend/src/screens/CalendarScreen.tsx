import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../state/store';
import { fetchEvents, selectEvent, deleteEvent } from '../state/eventsSlice';
import { fetchCategories } from '../state/categoriesSlice';
import EventDetailsModal from '../components/modals/EventDetailsModal';
import EventForm from '../components/forms/EventForm';
import { Event } from '../types/events';
import { CustomCategory } from '../types/categories';
import { Ionicons } from '@expo/vector-icons';

const CalendarScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const events = useSelector((state: RootState) => state.events.items);
  const categories = useSelector((state: RootState) => state.categories.items);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchEvents(currentUser.family_id));
      dispatch(fetchCategories(currentUser.family_id));
    }
  }, [currentUser, dispatch]);

  const markedDates = useCallback(() => {
    const marked: { [date: string]: { marked?: boolean; dotColor?: string } } = {};
    events.forEach(event => {
      const date = event.start_time.split('T')[0];
      const category = categories.find(cat => cat.category_id === event.event_category_id);
      marked[date] = {
        marked: true,
        dotColor: category?.color || '#007bff', // Default color if category not found
      };
    });
    // Highlight the selected date
    if (selectedDate && !marked[selectedDate]) {
      marked[selectedDate] = { selected: true };
    } else if (selectedDate) {
      marked[selectedDate].selected = true;
    }
    return marked;
  }, [events, categories, selectedDate]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    // Optionally clear selected event or fetch events for that specific day if performance is an issue
    setSelectedEvent(null);
    setModalVisible(false);
    setIsEditing(false);
  };

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
    setIsEditing(false);
  };

  const openEditForm = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setModalVisible(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteEvent(eventId)).then(() => {
              setSelectedEvent(null);
              setModalVisible(false);
            });
          },
        },
      ]
    );
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedEvent(null);
    // Refresh events after closing modal, in case of updates
    if (currentUser) {
      dispatch(fetchEvents(currentUser.family_id));
    }
  };

  const getEventDotColor = (categoryId?: string | null) => {
    if (!categoryId) return '#cccccc'; // Default for no category
    const category = categories.find(cat => cat.category_id === categoryId);
    return category?.color || '#cccccc';
  };

  const filteredEventsForDay = events
    .filter(event => event.start_time.startsWith(selectedDate))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markedDates={markedDates()}
        theme={{ todayTextColor: '#6200ee', selectedDayBackgroundColor: '#6200ee', arrowColor: '#6200ee' }}
      />

      <ScrollView style={styles.eventListContainer}>
        <Text style={styles.header}>Events for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        {filteredEventsForDay.length > 0 ? (
          filteredEventsForDay.map((event) => (
            <TouchableOpacity key={event.event_id} onPress={() => handleEventPress(event)} style={styles.eventItem}>
              <View style={styles.eventDotContainer}>
                <View style={[styles.eventDot, { backgroundColor: getEventDotColor(event.event_category_id) }]} />
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventTime}>
                  {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noEventsText}>No events for this day.</Text>
        )}
      </ScrollView>

      <EventDetailsModal
        visible={modalVisible && selectedEvent && !isEditing}
        event={selectedEvent}
        onClose={closeModal}
        onEdit={() => selectedEvent && openEditForm(selectedEvent)}
        onDelete={() => selectedEvent && handleDeleteEvent(selectedEvent.event_id)}
      />

      {isEditing && (
        <EventForm
          event={selectedEvent || undefined} 
          onClose={closeModal}
        />
      )}
      
      {/* Floating Action Button to add new event - this might need to be positioned absolutely */}
      <TouchableOpacity style={styles.fab} onPress={() => openEditForm(null as any)}>
         <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  eventListContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventDotContainer: {
    marginRight: 10,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  noEventsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    backgroundColor: '#6200ee',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
});

export default CalendarScreen;
