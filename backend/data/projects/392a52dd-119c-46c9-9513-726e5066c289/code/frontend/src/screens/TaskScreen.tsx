import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Button, Provider as PaperProvider, DefaultTheme, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../state/store';
import { fetchTasks, completeTask, deleteTask } from '../state/tasksSlice';
import { fetchCategories as fetchTaskCategories } from '../state/taskCategoriesSlice'; // Assuming task categories are managed separately
import TaskForm from '../components/forms/TaskForm';
import { Task } from '../types/tasks';
import { CustomCategory } from '../types/categories';
import { Ionicons } from '@expo/vector-icons';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
  },
};

const TaskScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => state.tasks.items);
  const taskCategories = useSelector((state: RootState) => state.taskCategories.items); // Get task categories
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchTasks(currentUser.family_id));
      // Fetch task categories for the current family
      dispatch(fetchTaskCategories(currentUser.family_id));
    }
  }, [currentUser, dispatch]);

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
    setIsEditing(false);
  };

  const openEditForm = (task: Task | null) => {
    setSelectedTask(task);
    setIsEditing(true);
    setModalVisible(false); // Close modal if it was open
  };

  const closeModal = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedTask(null);
    // Refresh tasks after closing modal
    if (currentUser) {
      dispatch(fetchTasks(currentUser.family_id));
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteTask(taskId)).then(() => {
              setSelectedTask(null);
            });
          },
        },
      ]
    );
  };

  const handleCompleteTask = (taskId: string) => {
    dispatch(completeTask(taskId)).then(() => {
        // Optionally show a success message or update UI immediately
    });
  };

  const getTaskCategoryColor = (categoryId?: string | null) => {
    if (!categoryId) return '#cccccc'; // Default for no category
    const category = taskCategories.find(cat => cat.category_id === categoryId);
    return category?.color || '#cccccc';
  };

  const renderTaskItem = useCallback(({ item }: { item: Task }) => (
    <TouchableOpacity onPress={() => handleTaskPress(item)} style={styles.taskItem}>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, item.status === 'completed' && styles.completedTask]}>{item.title}</Text>
        {item.description ? <Text style={styles.taskDescription}>{item.description}</Text> : null}
        <Text style={styles.taskDetails}>
          Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No due date'}
          {' | Points: '}{item.points}
        </Text>
        <View style={[styles.categoryDot, { backgroundColor: getTaskCategoryColor(item.task_category_id) }]} />
      </View>
      {item.status !== 'completed' && (
        <Button onPress={() => handleCompleteTask(item.task_id)} mode="text" style={styles.completeButton}>
          Complete
        </Button>
      )}
    </TouchableOpacity>
  ), [taskCategories, getTaskCategoryColor]); // Include dependencies

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <FlatList
          data={tasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.task_id}
          ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet. Add one!</Text>}
          contentContainerStyle={tasks.length === 0 ? styles.emptyListContent : {}}
        />

        {/* Task Details Modal (if you have one) - similar to EventDetailsModal */}
        {/* <TaskDetailsModal visible={modalVisible && selectedTask && !isEditing} task={selectedTask} onClose={closeModal} onEdit={() => selectedTask && openEditForm(selectedTask)} onDelete={() => selectedTask && handleDeleteTask(selectedTask.task_id)} /> */}

        {isEditing && (
          <TaskForm
            task={selectedTask || undefined}
            onClose={closeModal}
          />
        )}

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => openEditForm(null)}
        />
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  taskInfo: {
    flex: 1,
    marginRight: 10, // Space before complete button
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  taskDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  taskDetails: {
    fontSize: 12,
    color: '#777',
    marginTop: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  completeButton: {
    marginLeft: 'auto',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default TaskScreen;
