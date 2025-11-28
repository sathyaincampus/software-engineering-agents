import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Text, Dimensions, ScrollView } from 'react-native';
import { Calendar as RNCalendar, DateData, MarkedDates } from 'react-native-calendars'; 
import { Appbar, FAB, Modal, Portal, Provider as PaperProvider, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AppDispatch, RootState } from '../../store/store';
import { fetchEvents, fetchCategories, createEvent, deleteEvent, updateEvent } from '../../store/slices/calendarSlice'; 
import { Event, EventCategory } from '../../types/calendar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AddEditEventModal from '../../components/Calendar/AddEditEventModal'; 
import { RootStackParamList } from '../../navigation/AppNavigator';

const SCREEN_WIDTH = Dimensions.get('window').width;


type CalendarScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>; 

const CalendarScreen: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<CalendarScreenNavigationProp>();
    
    const events = useSelector((state: RootState) => state.calendar.events);
    const categories = useSelector((state: RootState) => state.calendar.categories);
    const loading = useSelector((state: RootState) => state.calendar.loading);
    const error = useSelector((state: RootState) => state.calendar.error);
    const user = useSelector((state: RootState) => state.auth.user);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null); 
    const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month'); 

    useEffect(() => {
        dispatch(fetchEvents());
        if (categories.length === 0) { 
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    const onDayPress = useCallback((day: { dateString: string }) => {
        setSelectedDate(day.dateString);
    }, []);

    const openAddEventModal = () => {
        setCurrentEvent(null);
        setIsModalVisible(true);
    };

    const openEditEventModal = (event: Event) => {
        setCurrentEvent(event);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setCurrentEvent(null);
    };

    const handleSaveEvent = async (eventData: Omit<Event, 'eventId' | 'createdBy' | 'familyId' | 'assignedTo' | 'category'>) => {
        const userId = user?.userId;
        const familyId = user?.familyMembers?.[0]?.familyId;

        if (!userId || !familyId) {
            Alert.alert('Error', 'User or family information missing. Please log in again.');
            return;
        }

        const eventToSave = {
            ...eventData,
            eventId: currentEvent ? currentEvent.eventId : undefined,
            createdById: userId,
            familyId: familyId,
            startTime: eventData.startTime.toISOString(),
            endTime: eventData.endTime.toISOString(),
        } as any;

        try {
            if (currentEvent) {
                await dispatch(updateEvent(eventToSave)).unwrap();
                Alert.alert('Success', 'Event updated successfully!');
            } else {
                await dispatch(createEvent(eventToSave)).unwrap();
                Alert.alert('Success', 'Event created successfully!');
            }
            closeModal();
            dispatch(fetchEvents()); 
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save event.');
        }
    };

    const handleDeleteEvent = (eventId: string) => {
         Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this event?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(deleteEvent(eventId)).unwrap();
                            Alert.alert('Success', 'Event deleted successfully!');
                            dispatch(fetchEvents()); 
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete event.');
                        }
                    }
                }
            ]
        );
    };

    const getMarkedDates = () => {
        const marked: { [date: string]: { marked: boolean; dotColor?: string; selected?: boolean; selectedColor?: string } } = {};
        events.forEach(event => {
            const date = event.startTime.toISOString().split('T')[0];
            const color = event.category?.color || '#007bff';
            if (!marked[date]) {
                marked[date] = { marked: true, dotColor: color };
            } else {
                 marked[date].dotColor = color; 
            }
        });
        if (selectedDate && !marked[selectedDate]) {
            marked[selectedDate] = { selected: true, selectedColor: '#007bff' };
        } else if (selectedDate && marked[selectedDate]) {
             marked[selectedDate].selected = true;
             marked[selectedDate].selectedColor = '#007bff';
        }
        return marked;
    };

    const eventsForSelectedDay = events
        .filter(event => event.startTime.toISOString().startsWith(selectedDate))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()); 

    const renderEventItem = ({ item }: { item: Event }) => (
        <Card style={[styles.eventCard, { borderColor: item.category?.color || '#ccc' }]} 
            onPress={() => openEditEventModal(item)}>
            <Card.Content>
                <View style={styles.eventCardContent}>
                    <Icon name="calendar-today" size={20} color={item.category?.color || '#555'} style={styles.eventIcon} />
                    <View style={styles.eventTextContainer}>
                        <Title style={styles.eventCardTitle}>{item.title}</Title>
                        <Paragraph>
                            {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {item.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Paragraph>
                        {item.assignedTo && <Text>Assigned to: {item.assignedTo.displayName}</Text>}
                    </View>
                    <Icon name="pencil" size={20} color="#007bff" onPress={() => openEditEventModal(item)} style={styles.editIcon} />
                    <Icon name="delete" size={20} color="red" onPress={() => handleDeleteEvent(item.eventId)} style={styles.deleteIcon} />
                </View>
            </Card.Content>
        </Card>
    );

    const renderViewComponent = () => {
        switch (currentView) {
            case 'day':
                return (
                    <View style={styles.dayViewContainer}>
                        {loading === 'pending' && <ActivityIndicator style={styles.activityIndicator} />}
                        {error && <Text style={styles.errorText}>{error}</Text>}
                        {!eventsForSelectedDay.length && !loading && !error && (
                            <Text style={styles.noEventsText}>No events for this day.</Text>
                        )}
                        <FlatList
                            data={eventsForSelectedDay}
                            renderItem={renderEventItem}
                            keyExtractor={(item) => item.eventId}
                            nestedScrollEnabled
                        />
                    </View>
                );
            case 'week':
                return <Text style={styles.placeholderText}>Week View Coming Soon!</Text>;
            case 'month':
            default:
                return (
                    <View style={styles.monthViewContainer}>
                         {loading === 'pending' && <ActivityIndicator style={styles.activityIndicator} />}
                         {error && <Text style={styles.errorText}>{error}</Text>}
                         {!eventsForSelectedDay.length && !loading && !error && (
                             <Text style={styles.noEventsText}>No events on {new Date(selectedDate).toLocaleDateString()}.</Text>
                         )}
                         <FlatList
                            data={eventsForSelectedDay}
                            renderItem={renderEventItem}
                            keyExtractor={(item) => item.eventId}
                            nestedScrollEnabled
                        />
                    </View>
                );
        }
    };

    return (
        <PaperProvider>
            <Appbar.Header>
                 <Appbar.Content title="Calendar" />
                 <Appbar.Action icon={calendarView === 'month' ? 'calendar-week' : calendarView === 'week' ? 'calendar-today' : 'calendar-month'} onPress={() => setCalendarView(prev => prev === 'month' ? 'week' : prev === 'week' ? 'day' : 'month')} />
            </Appbar.Header>
            <View style={styles.container}>
                <RNCalendar
                    onDayPress={onDayPress}
                    markedDates={getMarkedDates()}
                    theme={{ 
                        todayTextColor: '#fff',
                        todayDotStyle: { backgroundColor: '#007bff', width: 10, height: 10, borderRadius: 5 },
                        selectedDayBackgroundColor: '#007bff',
                        selectedDayTextColor: '#fff',
                        textSectionTitleColor: '#666',
                        arrowColor: '#007bff',
                        'stylesheet.calendar.header': {
                            week: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 10 },
                            dayTextAtIndex0: { color: 'red' }, 
                            dayTextAtIndex6: { color: 'blue' }, 
                        },
                    }}
                    current={selectedDate} 
                />
                {renderViewComponent()}
            </View>
            <FAB
                style={styles.fab}
                icon="plus"
                onPress={openAddEventModal}
            />

            <Portal>
                <Modal visible={isModalVisible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
                    <AddEditEventModal
                        event={currentEvent} 
                        categories={categories} 
                        onSave={handleSaveEvent}
                        onClose={closeModal}
                    />
                </Modal>
            </Portal>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    activityIndicator: {
        marginVertical: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 20,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 15,
        marginLeft: 15, 
    },
    eventListContainer: {
        flex: 1, 
        marginTop: 10,
    },
    eventCard: {
        marginHorizontal: 15,
        marginVertical: 8,
        borderLeftWidth: 5, 
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        elevation: 2,
    },
    eventCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10, 
    },
    eventIcon: {
        marginRight: 15,
    },
    eventTextContainer: {
        flex: 1,
    },
    eventCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    editIcon: {
        marginLeft: 'auto', 
        padding: 8,
    },
    deleteIcon: {
        padding: 8,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: '#007bff',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '85%',
        width: SCREEN_WIDTH - 40,
        alignSelf: 'center',
    },
    dayViewContainer: {
         flex: 1,
         paddingTop: 10,
         paddingBottom: 100, 
     },
     monthViewContainer: {
         flex: 1,
         paddingTop: 10,
         paddingBottom: 100, 
     },
     placeholderText: {
         textAlign: 'center',
         marginTop: 50,
         fontSize: 16,
         color: '#888',
     },
     noEventsText: {
         textAlign: 'center',
         color: '#888',
         paddingVertical: 20,
     },
});

export default CalendarScreen;
