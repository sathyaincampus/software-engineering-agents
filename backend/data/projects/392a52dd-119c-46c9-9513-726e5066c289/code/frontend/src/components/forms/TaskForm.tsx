import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Menu, Divider, Provider as PaperProvider, DefaultTheme, Text } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../state/store';
import { addTask, updateTask, fetchTaskById } from '../../state/tasksSlice';
import { fetchCategories as fetchTaskCategories } from '../../state/taskCategoriesSlice'; // Assuming a separate slice for task categories
import { CustomCategory } from '../../types/categories';
import { Task } from '../../types/tasks';
import { User } from '../../types/users';
import { getFamilyMembers } from '../../state/familyMembersSlice';
import { User as UserType } from '../../types/users';

interface TaskFormProps {
  task?: Task | null;
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

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const familyMembers = useSelector((state: RootState) => state.familyMembers.members);
  // Assuming task categories are also custom and managed similarly to event categories
  const taskCategories = useSelector((state: RootState) => state.taskCategories.items);

  const [formData, setFormData] = useState<Omit<Task, 'task_id' | 'created_at' | 'updated_at' | 'family_id' | 'created_by' | 'status' | 'points'> & { task_category_id?: string | null, points?: number }>(
    {
      title: '',
      description: '',
      assigned_to: '',
      due_date: null,
      task_category_id: null,
      points: 0,
    }
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(!!task);
  const [selectedCategory, setSelectedCategory] = useState<CustomCategory | null>(null);
  const [selectedAssignedTo, setSelectedAssignedTo] = useState<UserType | null>(null);

  useEffect(() => {
    if (currentUser) {
      // Fetch task categories for the current user's family
      dispatch(fetchTaskCategories(currentUser.family_id));
      // Fetch family members to populate the 'assigned_to' dropdown
      dispatch(getFamilyMembers(currentUser.family_id));
    }
  }, [currentUser, dispatch]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? new Date(task.due_date) : null,
        task_category_id: task.task_category_id || null,
        points: task.points || 0,
      });
      setSelectedCategory(taskCategories.find(cat => cat.category_id === task.task_category_id) || null);
      setSelectedAssignedTo(familyMembers.find(member => member.user_id === task.assigned_to) || null);
    }
  }, [task, taskCategories, familyMembers]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('due_date', selectedDate);
    }
  };

  const handleSubmit = () => {
    if (!formData.title) {
      Alert.alert('Validation Error', 'Please fill in the task title.');
      return;
    }

    const processedFormData = {
      ...formData,
      family_id: currentUser?.family_id || '',
      created_by: currentUser?.user_id || '',
      task_category_id: selectedCategory?.category_id || null,
      assigned_to: selectedAssignedTo?.user_id || null,
      due_date: formData.due_date ? formData.due_date.toISOString().split('T')[0] : null, // Format as YYYY-MM-DD
      points: Number(formData.points) || 0, // Ensure points is a number
    };

    if (isEditing && task) {
      dispatch(updateTask({ taskId: task.task_id, taskData: processedFormData as any }));
    } else {
      dispatch(addTask(processedFormData as any));
    }

    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onClose) onClose();
  };

  const handleSelectCategory = (category: CustomCategory) => {
    setSelectedCategory(category);
    handleInputChange('task_category_id', category.category_id);
  };

  const handleSelectAssignedTo = (member: UserType) => {
    setSelectedAssignedTo(member);
    handleInputChange('assigned_to', member.user_id);
  };

  const taskCategoryOptions = useMemo(() => [
      { category_id: null, name: 'No Category' },
      ...taskCategories.map(cat => ({ category_id: cat.category_id, name: cat.name, color: cat.color }))
    ], [taskCategories]);

  const assignedToOptions = useMemo(() => [
      { user_id: '', name: 'Unassigned' },
      ...familyMembers.map(member => ({ user_id: member.user_id, name: member.display_name }))
    ], [familyMembers]);

  return (
    <PaperProvider theme={theme}>
      <ScrollView style={styles.container}>
        <TextInput
          label="Task Title*"
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
          <Button onPress={() => setShowDatePicker(true)} mode="outlined" style={styles.dateButton}>
            {formData.due_date ? formData.due_date.toLocaleDateString() : 'Set Due Date'}
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={formData.due_date || new Date()}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <TextInput
          label="Points"
          value={String(formData.points)}
          onChangeText={(text) => handleInputChange('points', text)}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />

        <Menu
          visible={!!taskCategories.length && !selectedAssignedTo} // Show category menu first
          onDismiss={() => {}}
          anchor={<Button onPress={() => { /* Logic to open category menu */ }} mode="outlined" style={styles.menuButton}>
            Category: {selectedCategory ? selectedCategory.name : 'Select Category'}
          </Button>}>
          {taskCategoryOptions.map(option => (
            <View key={option.category_id || 'null'}>
              <Menu.Item onPress={() => handleSelectCategory(option as CustomCategory)} title={option.name} />
              <Divider />
            </View>
          ))}
        </Menu>

        <Menu
          visible={!!selectedCategory} // Show assigned to menu after category is selected
          onDismiss={() => {}}
          anchor={<Button onPress={() => { /* Logic to open assigned to menu */ }} mode="outlined" style={styles.menuButton}>
            Assigned To: {selectedAssignedTo ? selectedAssignedTo.name : 'Unassigned'}
          </Button>}>
           {assignedToOptions.map(option => (
            <View key={option.user_id || 'null'}>
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
            {isEditing ? 'Update Task' : 'Add Task'}
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

export default TaskForm;
