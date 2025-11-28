import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { Appbar, Card, Text, Checkbox, IconButton, Divider, FAB, Portal, Modal, Provider as PaperProvider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchTasks, Task, updateTask } from '../store/tasks/tasksSlice';
import api from '../services/api'; // Assuming api service is configured

const ChildTaskViewScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const loading = useSelector((state: RootState) => state.tasks.loading);
  const error = useSelector((state: RootState) => state.tasks.error);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailModalVisible, setTaskDetailModalVisible] = useState(false);

  const loadTasks = async () => {
    if (currentUser?.id && currentUser?.family_id) {
      setRefreshing(true);
      try {
        // Fetch tasks assigned specifically to the current user (child)
        const response = await api.get(`/tasks/my-tasks/${currentUser.id}`);
        // Dispatching fetched tasks directly, assuming the API returns tasks array
        dispatch({
          type: 'tasks/fetchTasks/fulfilled',
          payload: response.data
        });
      } catch (err: any) {
        console.error('Failed to fetch tasks:', err);
        // Dispatch error action if needed
        dispatch({
          type: 'tasks/fetchTasks/rejected',
          payload: err.response?.data?.message || 'Failed to fetch tasks'
        });
      } finally {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadTasks();
  }, [dispatch, currentUser?.id, currentUser?.family_id]);

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const updatedTaskData = { ...task, status: newStatus };

    try {
      // Update task status via API
      const response = await api.put(`/tasks/${task.task_id}`, { status: newStatus });
      dispatch(updateTask({ taskId: task.task_id, updates: { status: newStatus } }));
      Alert.alert('Success', `Task marked as ${newStatus}.`);
      // Optionally trigger a refresh or update local state immediately
      // loadTasks(); 
    } catch (err: any) {
      console.error('Failed to update task status:', err);
      Alert.alert('Error', `Failed to update task status. ${err.response?.data?.message || ''}`);
    }
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailModalVisible(true);
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <Card style={[styles.card, item.status === 'completed' && styles.completedCard]}>
      <Card.Content>
        <View style={styles.row}>
          <Checkbox
            status={item.status === 'completed' ? 'checked' : 'unchecked'}
            onPress={() => handleToggleTaskStatus(item)}
          />
          <Text style={[styles.taskTitle, item.status === 'completed' && styles.completedText]} onPress={() => handleTaskPress(item)}>
            {item.title}
          </Text>
          <IconButton 
            icon="information-outline" 
            size={20} 
            onPress={() => handleTaskPress(item)} 
            style={styles.infoButton}
            iconColor="grey"
          />
        </View>
        {item.description && item.status !== 'completed' && (
          <Text variant="bodySmall" style={styles.descriptionText} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        {item.status === 'completed' && (
          <Text variant="bodySmall" style={styles.completedInfo}>Completed!</Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderEmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No tasks assigned yet!</Text>
    </View>
  );

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.Content title="My Tasks" />
        {/* Add other actions if needed, e.g., filter, sort */}
      </Appbar.Header>
      <View style={styles.container}>
        {loading && !refreshing && <Text>Loading tasks...</Text>}
        {error && <Text style={styles.errorText}>Error: {error}</Text>}
        {!loading && !error && (
          <FlatList
            data={tasks.filter(task => task.assigned_to === currentUser?.id)}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.task_id}
            style={styles.list}
            ListEmptyComponent={renderEmptyListComponent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTasks} />}
          />
        )}
      </View>

      {/* Task Detail Modal */} 
      <Portal>
        <Modal visible={isTaskDetailModalVisible} onDismiss={() => setTaskDetailModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          {selectedTask && (
            <Card>
              <Card.Title title={selectedTask.title} subtitle={`Points: ${selectedTask.points}`} />
              <Card.Content>
                {selectedTask.description && (
                  <View style={styles.modalDescriptionContainer}>
                    <Text style={styles.modalLabel}>Description:</Text>
                    <Text>{selectedTask.description}</Text>
                  </View>
                )}
                <Divider style={styles.modalDivider}/>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <Text>{selectedTask.status}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Due Date:</Text>
                  <Text>{new Date(selectedTask.due_date).toLocaleDateString()}</Text>
                </View>
                <Divider style={styles.modalDivider}/>
                <Button 
                  mode={selectedTask.status === 'completed' ? 'outlined' : 'contained'} 
                  onPress={() => {
                    handleToggleTaskStatus(selectedTask);
                    setTaskDetailModalVisible(false); // Close modal after toggling
                  }}
                  icon={selectedTask.status === 'completed' ? 'close-circle-outline' : 'check-circle-outline'}
                  style={styles.modalActionButton}
                >
                  {selectedTask.status === 'completed' ? 'Mark as Pending' : 'Mark as Complete'}
                </Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  list: {
    flex: 1,
  },
  card: {
    marginVertical: 6,
    marginHorizontal: 4,
    elevation: 2,
    backgroundColor: '#fff',
  },
  completedCard: {
    backgroundColor: '#e0ffe0',
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 16,
    flexShrink: 1, // Allow text to shrink if needed
    marginHorizontal: 8,
    fontWeight: '500'
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: 'grey',
  },
  descriptionText: {
    marginTop: 5,
    marginLeft: 40, // Align with task title text padding
    color: 'grey',
  },
  completedInfo: {
    marginTop: 5,
    marginLeft: 40,
    color: 'green',
    fontWeight: 'bold',
  },
  infoButton: {
    marginLeft: 'auto', // Pushes button to the right
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: 'grey',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 10,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalDescriptionContainer: {
    marginVertical: 10,
  },
  modalLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#6200ee',
  },
  modalDivider: {
    marginVertical: 10,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  modalActionButton: {
    marginTop: 20,
    paddingVertical: 8,
  }
});

export default ChildTaskViewScreen;
