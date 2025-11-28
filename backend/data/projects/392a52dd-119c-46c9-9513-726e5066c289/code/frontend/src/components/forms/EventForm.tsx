import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Menu, Divider, Provider as PaperProvider, DefaultTheme, RadioButton } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { addEvent, updateEvent, fetchEventById } from '../../state/eventsSlice';
import { fetchCategories } from '../../state/categoriesSlice';
import { CustomCategory } from '../../types/categories';
import { Event } from '../../types/events';
import { User } from '../../types/users';
import { getFamilyMembers } from '../../state/familyMembersSlice';
import { User as UserType } from '../../types/users';

interface EventFormProps {
  event?: Event | null;
  onClose?: () => void;
}

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
  },
};

const EventForm: React.FC<EventFormProps> = ({ event, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const familyMembers = useSelector((state: RootState) => state.familyMembers.members);
  const categories = useSelector((state: RootState) => state.categories.items);
  const [formData, setFormData] = useState<Omit<Event, 'event_id' | 'created_at' | 'updated_at' | 'family_id' | 'created_by' | 'original_event_id' | 'is_recurring' | 'recurrence_rule' | 'recurring_end_date'> & { family_id?: string }>(
    {
      title: '',
      description: '',
      start_time: new Date(),
      end_time: new Date(),
      assigned_to: '',
      event_category_id: '',
      location: '',
    }
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);
  const [isEditing, setIsEditing] = useState(!!event);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CustomCategory | null>(null);
  const [selectedAssignedTo, setSelectedAssignedTo] = useState<UserType | null>(null);

  useEffect(() => {
    if (currentUser) {
        dispatch(fetchCategories(currentUser.family_id));
        dispatch(getFamilyMembers(currentUser.family_id));
    }
  }, [currentUser, dispatch]);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_time: new Date(event.start_time),
        end_time: new Date(event.end_time),
        assigned_to: event.assigned_to || '',
        event_category_id: event.event_category_id || '',
        location: event.location || '',
      });
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      setIsAllDay(start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0);
      setSelectedCategory(categories.find(cat => cat.category_id === event.event_category_id) || null);
      setSelectedAssignedTo(familyMembers.find(member => member.user_id === event.assigned_to) || null);
    }
  }, [event, categories, familyMembers]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date, field?: 'start_time' | 'end_time') => {
    const currentDate = selectedDate || new Date();
    if (field === 'start_time') {
      setShowStartDatePicker(false);
      const newStartTime = new Date(currentDate);
      if (isAllDay) {
        newStartTime.setHours(0, 0, 0, 0);
      }
      setFormData(prev => ({ ...prev, start_time: newStartTime }));
      // If end_time is before new start_time, adjust end_time
      if (prev.end_time <= newStartTime) {
        const newEndTime = new Date(newStartTime);
        if (isAllDay) {
          newEndTime.setDate(newStartTime.getDate() + 1);
        } else {
          newEndTime.setHours(newStartTime.getHours() + 1); 
        }
        handleInputChange('end_time', newEndTime);
      }
    } else if (field === 'end_time') {
      setShowEndDatePicker(false);
      const newEndTime = new Date(currentDate);
      if (isAllDay) {
        newEndTime.setHours(0, 0, 0, 0);
      }
      setFormData(prev => ({ ...prev, end_time: newEndTime }));
    }
  };

  const toggleAllDay = () => {
    const newIsAllDay = !isAllDay;
    setIsAllDay(newIsAllDay);
    let { start_time, end_time } = formData;
    if (newIsAllDay) {
      start_time = new Date(start_time.getFullYear(), start_time.getMonth(), start_time.getDate(), 0, 0, 0, 0);
      end_time = new Date(end_time.getFullYear(), end_time.getMonth(), end_time.getDate(), 0, 0, 0, 0);
      // If it's all day, ensure end date is at least one day after start date
      if (end_time <= start_time) {
        end_time.setDate(start_time.getDate() + 1);
      }
    } else {
      // Default to business hours if switching from all-day
      start_time.setHours(9, 0, 0, 0);
      end_time.setHours(17, 0, 0, 0);
    }
    setFormData(prev => ({ ...prev, start_time, end_time }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.start_time || !formData.end_time) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Title, Start Time, End Time).');
      return;
    }

    if (formData.end_time <= formData.start_time) {
      Alert.alert('Validation Error', 'End time must be after start time.');
      return;
    }

    const processedFormData = {
      ...formData,
      family_id: currentUser?.family_id || '',
      created_by: currentUser?.user_id || '',
      event_category_id: selectedCategory?.category_id || null,
      assigned_to: selectedAssignedTo?.user_id || null,
      start_time: formData.start_time.toISOString(),
      end_time: formData.end_time.toISOString(),
    };

    if (isEditing && event) {
      dispatch(updateEvent({ eventId: event.event_id, eventData: processedFormData as any }));
    } else {
      dispatch(addEvent(processedFormData as any));
    }

    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onClose) onClose();
  };

  const handleSelectCategory = (category: CustomCategory) => {
    setSelectedCategory(category);
    handleInputChange('event_category_id', category.category_id);
    setMenuVisible(false);
  };

  const handleSelectAssignedTo = (member: UserType) => {
    setSelectedAssignedTo(member);
    handleInputChange('assigned_to', member.user_id);
  };

  const openCategoryMenu = () => setMenuVisible(true);
  const closeCategoryMenu = () => setMenuVisible(false);

  // Memoize options to prevent unnecessary re-renders
  const categoryOptions = useMemo(() => [
      { id: '', name: 'No Category' },
      ...categories.map(cat => ({ id: cat.category_id, name: cat.name, color: cat.color }))
    ], [categories]);

  const assignedToOptions = useMemo(() => [
      { user_id: '', name: 'Unassigned' },
      ...familyMembers.map(member => ({ user_id: member.user_id, name: member.display_name }))
    ], [familyMembers]);

  return (
    <PaperProvider theme={theme}>
      <ScrollView style={styles.container}>
        <TextInput
          label="Title*"
          value={formData.title}
          onChangeText={(text) => handleInputChange('title', text)}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Description"
          value={formData.description}
          onChangeText={(text) => handleInputChange('description', text)}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <View style={styles.dateTimePickerContainer}>
          <Button onPress={() => setShowStartDatePicker(true)} mode="outlined" style={styles.dateButton}>
            {formData.start_time.toLocaleDateString()} {isAllDay ? '' : formData.start_time.toLocaleTimeString()}
          </Button>
          {showStartDatePicker && (
            <DateTimePicker
              value={formData.start_time}
              mode={isAllDay ? "date" : "time"}
              is24Hour={true}
              display="default"
              onChange={(e, d) => handleDateChange(e, d, 'start_time')}
            />
          )}
        </View>

        <View style={styles.dateTimePickerContainer}>
          <Button onPress={() => setShowEndDatePicker(true)} mode="outlined" style={styles.dateButton}>
            {formData.end_time.toLocaleDateString()} {isAllDay ? '' : formData.end_time.toLocaleTimeString()}
          </Button>
          {showEndDatePicker && (
            <DateTimePicker
              value={formData.end_time}
              mode={isAllDay ? "date" : "time"}
              is24Hour={true}
              display="default"
              onChange={(e, d) => handleDateChange(e, d, 'end_time')}
            />
          )}
        </View>

        <View style={styles.allDayToggle}>
          <RadioButton.Group onValueChange={toggleAllDay} value={isAllDay.toString()}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton value="true" />
              <Text>All day</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton value="false" />
              <Text>Time specific</Text>
            </View>
          </RadioButton.Group>
        </View>

        <TextInput
          label="Location"
          value={formData.location}
          onChangeText={(text) => handleInputChange('location', text)}
          mode="outlined"
          style={styles.input}
        />

        <Menu
          visible={menuVisible}
          onDismiss={closeCategoryMenu}
          anchor={<Button onPress={openCategoryMenu} mode="outlined" style={styles.menuButton}>
            Category: {selectedCategory ? selectedCategory.name : 'Select Category'}
          </Button>}>
          {categoryOptions.map(option => (
            <View key={option.id}>
              <Menu.Item onPress={() => handleSelectCategory(option as CustomCategory)} title={option.name} />
              <Divider />
            </View>
          ))}
        </Menu>

        <Menu
          visible={!menuVisible && !!selectedCategory} // Simple way to manage visibility, could be improved
          onDismiss={() => {}} // This menu is controlled by assignedToSelection
          anchor={<Button onPress={() => {}} mode="outlined" style={styles.menuButton}>
            Assigned To: {selectedAssignedTo ? selectedAssignedTo.name : 'Unassigned'}
          </Button>}>
           {assignedToOptions.map(option => (
            <View key={option.user_id}>
              <Menu.Item onPress={() => handleSelectAssignedTo(option as UserType)} title={option.name} />
              <Divider />
            </View>
          ))}
        </Menu>

        <View style={styles.buttonContainer}>
          <Button mode="outlined" onPress={handleCancel} style={styles.button}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSubmit} style={styles.button}>
            {isEditing ? 'Update Event' : 'Add Event'}
          </Button>
        </View>
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  input: {
    marginBottom: 12,
  },
  dateTimePickerContainer: {
    marginBottom: 12,
  },
  dateButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  allDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  menuButton: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    textAlign: 'left',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default EventForm;
