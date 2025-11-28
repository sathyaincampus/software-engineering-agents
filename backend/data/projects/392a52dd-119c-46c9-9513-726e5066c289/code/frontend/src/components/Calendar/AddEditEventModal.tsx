import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, ScrollView } from 'react-native';
import { Modal, Portal, TextInput, Button, Title, Provider as PaperProvider, Chip, RadioButton, Switch, HelperText } from 'react-native-paper';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Event, EventCategory } from '../../types/calendar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { AppState } from '../../store/store';
import { UserProfile } from '../../types/auth';

interface AddEditEventModalProps {
    event: Event | null;
    categories: EventCategory[];
    onSave: (eventData: Omit<Event, 'eventId' | 'createdBy' | 'familyId' | 'assignedTo' | 'category'>) => void;
    onClose: () => void;
}

const AddEditEventModal: React.FC<AddEditEventModalProps> = ({ event, categories, onSave, onClose }) => {
    const user = useSelector((state: AppState) => state.auth.user);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [endTime, setEndTime] = useState<Date>(new Date());
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceRule, setRecurrenceRule] = useState(''); 
    const [recurringEndDate, setRecurringEndDate] = useState<string | null>(null); 

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [showRecurrenceDatePicker, setShowRecurrenceDatePicker] = useState(false);
    const [assignedToId, setAssignedToId] = useState<string | null>(null);

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setDescription(event.description || '');
            setLocation(event.location || '');
            setStartTime(event.startTime);
            setEndTime(event.endTime);
            setSelectedCategory(event.category || null);
            setAssignedToId(event.assignedToId || null);
            setIsRecurring(event.isRecurring || false);
            setRecurrenceRule(event.recurrenceRule || '');
            setRecurringEndDate(event.recurringEndDate || null);
        } else {
            setStartTime(new Date());
            setEndTime(new Date(Date.now() + 60 * 60 * 1000)); 
            setTitle('');
            setDescription('');
            setLocation('');
            setSelectedCategory(null);
            setAssignedToId(null);
            setIsRecurring(false);
            setRecurrenceRule('');
            setRecurringEndDate(null);
        }
    }, [event]);

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert('Validation Error', 'Event title cannot be empty.');
            return;
        }
        if (endTime <= startTime) {
            Alert.alert('Validation Error', 'End time must be after start time.');
            return;
        }
        if (isRecurring && !recurrenceRule) {
            Alert.alert('Validation Error', 'Please specify a recurrence rule (e.g., FREQ=WEEKLY;BYDAY=MO;INTERVAL=1).');
            return;
        }

        onSave({
            title,
            description,
            location,
            startTime,
            endTime,
            assignedToId,
            eventCategoryId: selectedCategory?.categoryId || null,
            isRecurring,
            recurrenceRule: isRecurring ? recurrenceRule : null,
            recurringEndDate: isRecurring ? recurringEndDate : null,
        });
    };

    const handleCategorySelect = (category: EventCategory) => {
        setSelectedCategory(category);
    };

    const hidePickers = () => {
        setShowDatePicker(false);
        setShowStartTimePicker(false);
        setShowEndTimePicker(false);
        setShowRecurrenceDatePicker(false);
    };

    const showDatePickerHandler = () => setShowDatePicker(true);
    const showStartTimePickerHandler = () => setShowStartTimePicker(true);
    const showEndTimePickerHandler = () => setShowEndTimePicker(true);
    const showRecurrenceDatePickerHandler = () => setShowRecurrenceDatePicker(true);

    const handleDateConfirm = (date: Date) => {
        const newStartTime = new Date(date);
        newStartTime.setHours(startTime.getHours(), startTime.getMinutes());
        setStartTime(newStartTime);

        const newEndTime = new Date(date);
        newEndTime.setHours(endTime.getHours(), endTime.getMinutes());
        setEndTime(newEndTime);

        hidePickers();
    };

    const handleStartTimeConfirm = (time: Date) => {
        const newStartTime = new Date(startTime);
        newStartTime.setHours(time.getHours(), time.getMinutes());
        setStartTime(newStartTime);
        hidePickers();
    };

    const handleEndTimeConfirm = (time: Date) => {
        const newEndTime = new Date(endTime);
        newEndTime.setHours(time.getHours(), time.getMinutes());
        setEndTime(newEndTime);
        hidePickers();
    };

    const handleRecurrenceDateConfirm = (date: Date) => {
        setRecurringEndDate(date.toISOString().split('T')[0]); 
        hidePickers();
    };

    const children = user?.children || [];

    return (
        <PaperProvider>
            <Portal>
                <Modal visible={true} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
                    <Title style={styles.modalTitle}>{event ? 'Edit Event' : 'Add Event'}</Title>
                    
                    <TextInput label="Title*" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} />
                    <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={3} style={styles.input} />
                    <TextInput label="Location" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} left={<Icon name="map-marker" />} />

                    <View style={styles.dateTimeRow}>
                        <Button icon="calendar" onPress={showDatePickerHandler} mode="outlined" style={styles.dateTimeButton}>{startTime.toLocaleDateString()}</Button>
                        <Button icon="clock-outline" onPress={showStartTimePickerHandler} mode="outlined" style={styles.dateTimeButton}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Button>
                        <Button icon="clock-outline" onPress={showEndTimePickerHandler} mode="outlined" style={styles.dateTimeButton}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Button>
                    </View>

                    <DateTimePickerModal isVisible={showDatePicker} mode="date" onConfirm={handleDateConfirm} onCancel={hidePickers} minimumDate={new Date()} date={startTime} />
                    <DateTimePickerModal isVisible={showStartTimePicker} mode="time" onConfirm={handleStartTimeConfirm} onCancel={hidePickers} date={startTime} is24Hour={true} />
                    <DateTimePickerModal isVisible={showEndTimePicker} mode="time" onConfirm={handleEndTimeConfirm} onCancel={hidePickers} date={endTime} is24Hour={true} />

                    <Title style={styles.sectionTitle}>Category</Title>
                    <View style={styles.categoryContainer}>
                        {categories.map((cat) => (
                            <Chip key={cat.categoryId} selected={selectedCategory?.categoryId === cat.categoryId} onPress={() => handleCategorySelect(cat)} style={[styles.categoryChip, { backgroundColor: cat.color || '#eee' }]} textStyle={styles.chipText}>{cat.name}</Chip>
                        ))}
                    </View>

                    {user?.role === 'PARENT' && (
                        <View>
                            <Title style={styles.sectionTitle}>Assign To</Title>
                            <View style={styles.assigneeContainer}>
                                <RadioButton.Group onValueChange={setAssignedToId} value={assignedToId || ''}>
                                    <View style={styles.radioRow}><RadioButton value={user.userId} /><Text onPress={() => setAssignedToId(user.userId)}>{user.displayName} (You)</Text></View>
                                    {children.map(child => (
                                        <View key={child.userId} style={styles.radioRow}><RadioButton value={child.userId} /><Text onPress={() => setAssignedToId(child.userId)}>{child.displayName}</Text></View>
                                    ))}
                                </RadioButton.Group>
                            </View>
                        </View>
                    )}
                    
                    {/* Recurrence Event Section */}
                    <View style={styles.recurringSection}>
                        <Title style={styles.sectionTitle}>Recurrence</Title>
                        <View style={styles.recurringRow}>
                            <Text style={styles.recurringLabel}>Repeat Event</Text>
                            <Switch 
                                value={isRecurring} 
                                onValueChange={(value) => {
                                    setIsRecurring(value);
                                    if (!value) { 
                                        setRecurrenceRule('');
                                        setRecurringEndDate(null);
                                    }
                                }}
                            />
                        </View>

                        {isRecurring && (
                            <View>
                                <TextInput
                                    label="Recurrence Rule"
                                    value={recurrenceRule}
                                    onChangeText={setRecurrenceRule}
                                    mode="outlined"
                                    style={styles.input}
                                    helperText="Use standard RRULE format. E.g., FREQ=WEEKLY;BYDAY=MO;INTERVAL=1"
                                />
                                <Button icon="calendar-today" onPress={showRecurrenceDatePickerHandler} mode="outlined" style={[styles.dueDateButton, styles.recurringEndDateInput]} labelStyle={styles.dueDateButtonLabel}>
                                    {recurringEndDate ? new Date(recurringEndDate).toLocaleDateString() : 'Repeat Until'}
                                </Button>
                                <DateTimePickerModal 
                                    isVisible={showRecurrenceDatePicker}
                                    mode="date"
                                    onConfirm={handleRecurrenceDateConfirm}
                                    onCancel={hidePickers}
                                    date={recurringEndDate ? new Date(recurringEndDate) : new Date()}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.modalActions}>
                        <Button onPress={onClose} mode="text" style={styles.cancelButton}>Cancel</Button>
                        <Button onPress={handleSave} mode="contained" style={styles.saveButton}>Save Event</Button>
                    </View>
                </Modal>
            </Portal>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '90%',
        width: Dimensions.get('window').width - 40,
        alignSelf: 'center',
    },
    scrollContent: {
        flexGrow: 1, 
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 22,
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        flexWrap: 'wrap',
    },
    dateTimeButton: {
        flex: 1,
        marginHorizontal: 4,
        minWidth: 100,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 8,
        color: '#555',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
    },
    categoryChip: {
        margin: 4,
        paddingVertical: 2,
        elevation: 1,
    },
     chipText: {
        color: 'white', 
    },
    assigneeContainer: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 5,
        marginBottom: 15,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    avatar: {
        marginRight: 10,
        backgroundColor: '#ccc', 
    },
    memberName: {
        fontSize: 16,
    },
     noAssigneesText: {
        textAlign: 'center',
        color: '#888',
        padding: 10,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 25,
    },
    cancelButton: {
        marginRight: 10,
    },
    saveButton: {
        paddingHorizontal: 20,
    },
    recurringSection: {
        marginTop: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
    },
    recurringRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    recurringLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    recurringEndDateInput: {
        marginTop: 10,
    }
});

export default AddEditEventModal;
