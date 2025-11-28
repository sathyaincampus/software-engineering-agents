import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Text, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, FAB, Card, Title, Paragraph, RadioButton, Searchbar, Button, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AppDispatch, RootState } from '../../store/store';
import { fetchTasks, updateTaskStatus, deleteTask, createTask, updateTask, fetchTasksAssignedToMe } from '../../store/slices/tasksSlice'; 
import { Task, TaskStatus } from '../../types/tasks';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AddEditTaskModal from '../../components/Tasks/AddEditTaskModal'; 
import { RootStackParamList } from '../../navigation/AppNavigator';

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainApp'>;

const TasksScreen: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<TasksScreenNavigationProp>();

    const tasks = useSelector((state: RootState) => state.tasks.tasks);
    const loading = useSelector((state: RootState) => state.tasks.loading);
    const error = useSelector((state: RootState) => state.tasks.error);
    const user = useSelector((state: RootState) => state.auth.user);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING'); 
    const [searchQuery, setSearchQuery] = React.useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadTasks = useCallback(async () => {
        setRefreshing(true);
        try {
            if (user?.role === 'PARENT') {
                 await dispatch(fetchTasks({ filter: filter })).unwrap(); 
            } else { 
                await dispatch(fetchTasksAssignedToMe()).unwrap(); 
            }
        } catch (error) {
            console.error("Failed to load tasks:", error);
        } finally {
            setRefreshing(false);
        }
    }, [dispatch, filter, user]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const openAddTaskModal = () => {
        setCurrentTask(null);
        setIsModalVisible(true);
    };

    const openEditTaskModal = (task: Task) => {
        setCurrentTask(task);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setCurrentTask(null);
    };

    const handleSaveTask = async (taskData: Partial<Task> & { taskId?: string }) => {
        const userId = user?.userId;
        if (!userId) return Alert.alert('Error', 'User not logged in.');

        const taskToSave: any = { ...taskData }; 

        try {
            if (taskToSave.taskId) {
                await dispatch(updateTask({ ...taskToSave, taskId: taskToSave.taskId })).unwrap();
                 Alert.alert('Success', 'Task updated successfully!');
            } else {
                await dispatch(createTask({ 
                    title: taskToSave.title,
                    description: taskToSave.description,
                    dueDate: taskToSave.dueDate,
                    points: taskToSave.points,
                    assignedToId: taskToSave.assignedToId!,
                })).unwrap();
                 Alert.alert('Success', 'Task created successfully!');
            }
            closeModal();
            loadTasks(); 
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save task.');
        }
    };

    const handleDeleteTask = (taskId: string) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this task?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                    await dispatch(deleteTask(taskId)).unwrap();
                    Alert.alert('Success', 'Task deleted successfully!');
                    loadTasks(); 
                } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to delete task.');
                }
            }}
        ]);
    };
    
    const handleTaskCompletionToggle = async (task: Task) => {
         const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
         try {
            await dispatch(updateTaskStatus({ taskId: task.taskId, status: newStatus })).unwrap();
             loadTasks(); 
         } catch (error: any) {
              Alert.alert('Error', `Failed to update task status: ${error.message}`);
         }
    };

    const filteredTasks = tasks.filter(task => {
        if (searchQuery === '') return true;
        return task.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const renderTaskItem = ({ item }: { item: Task }) => (
        <Card style={[styles.taskCard, item.status === 'COMPLETED' && styles.completedTaskCard]}
              onPress={() => user?.role === 'PARENT' ? openEditTaskModal(item) : handleTaskCompletionToggle(item)}>
            <Card.Content>
                <View style={styles.taskCardContent}>
                    <TouchableOpacity onPress={() => user?.role !== 'PARENT' && handleTaskCompletionToggle(item)} style={styles.checkboxContainer}>
                        <Icon 
                            name={item.status === 'COMPLETED' ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                            size={24} 
                            color={item.status === 'COMPLETED' ? 'green' : '#888'}
                        />
                    </TouchableOpacity>
                    <View style={styles.taskTextContainer}>
                        <Title style={[styles.taskCardTitle, item.status === 'COMPLETED' && styles.completedTaskTitle]}>{item.title}</Title>
                        <Paragraph>{item.description}</Paragraph>
                        <Text style={styles.taskMeta}>Assigned to: {item.assignedTo?.displayName || 'N/A'}</Text>
                        {item.dueDate && <Text style={styles.taskMeta}>Due: {item.dueDate}</Text>}
                        <Text style={styles.taskMeta}>Points: {item.points}</Text>
                    </View>
                    {user?.role === 'PARENT' && (
                        <View style={styles.parentActions}>
                            <Icon name="pencil" size={20} color="#007bff" onPress={() => openEditTaskModal(item)} style={styles.actionIcon} />
                            <Icon name="delete" size={20} color="red" onPress={() => handleDeleteTask(item.taskId)} style={styles.actionIcon} />
                        </View>
                    )}
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Tasks" />
                 {user?.role === 'PARENT' && (
                     <Appbar.Action icon="filter" onPress={() => {/* Open filter modal/menu */}} />
                 )}
            </Appbar.Header>

            <Searchbar
                placeholder="Search tasks"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />
            
            {user?.role === 'PARENT' && (
                 <View style={styles.filterButtonsContainer}>
                     <Button mode={filter === 'ALL' ? 'contained' : 'outlined'} onPress={() => setFilter('ALL')} style={styles.filterButton}>All</Button>
                     <Button mode={filter === 'PENDING' ? 'contained' : 'outlined'} onPress={() => setFilter('PENDING')} style={styles.filterButton}>Pending</Button>
                     <Button mode={filter === 'COMPLETED' ? 'contained' : 'outlined'} onPress={() => setFilter('COMPLETED')} style={styles.filterButton}>Completed</Button>
                 </View>
            )}

            {loading === 'pending' && <ActivityIndicator animating={true} color="#007bff" style={styles.activityIndicator} />}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {!tasks.length && !loading && !error && (
                <View style={styles.centeredMessageContainer}>
                    <Text style={styles.noTasksText}>No tasks found. Add one to get started!</Text>
                </View>
            )}
            
            <FlatList
                data={filteredTasks.filter(task => {
                    if (filter === 'ALL') return true;
                    if (filter === 'PENDING') return task.status === 'PENDING' || task.status === 'IN_PROGRESS';
                    if (filter === 'COMPLETED') return task.status === 'COMPLETED';
                    return true;
                }))}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.taskId}
                contentContainerStyle={styles.listContentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadTasks} colors={['#007bff']}/>}
            />

            {user?.role === 'PARENT' && (
                <FAB
                    style={styles.fab}
                    icon="plus"
                    onPress={openAddTaskModal}
                />
            )}

            <Portal>
                <Modal visible={isModalVisible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
                    <AddEditTaskModal
                        task={currentTask}
                        onSubmit={handleSaveTask}
                        onClose={closeModal}
                        children={user?.children || []} 
                    />
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    searchBar: {
        margin: 10,
        borderRadius: 8,
    },
    filterButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 10,
        marginBottom: 15,
    },
    filterButton: {
        marginHorizontal: 5,
    },
    activityIndicator: {
        marginVertical: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginVertical: 20,
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noTasksText: {
        fontSize: 16,
        color: '#888',
    },
    listContentContainer: {
        paddingBottom: 100, 
    },
    taskCard: {
        marginHorizontal: 15,
        marginVertical: 8,
        borderRadius: 8,
        elevation: 2,
        borderLeftWidth: 5,
        borderLeftColor: '#007bff',
    },
    completedTaskCard: {
        backgroundColor: '#e8f5e9', 
        borderLeftColor: 'green',
    },
    taskCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
    },
    checkboxContainer: {
        padding: 10, 
        marginRight: 15,
    },
    taskTextContainer: {
        flex: 1,
    },
    taskCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    completedTaskTitle: {
        textDecorationLine: 'line-through',
        color: '#666',
    },
    taskMeta: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    parentActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        marginLeft: 10,
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
        maxHeight: '90%',
        width: '90%',
        alignSelf: 'center',
    },
});

export default TasksScreen;
