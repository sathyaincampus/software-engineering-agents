import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, ScrollView } from 'react-native';
import { Modal, Portal, TextInput, Button, Title, Provider as PaperProvider, Chip, RadioButton } from 'react-native-paper';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Task } from '../../types/tasks';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserProfile } from '../../types/auth'; 

interface AddEditTaskModalProps {
    task: Task | null;
    onSubmit: (taskData: Partial<Task> & { taskId?: string }) => void;
    onClose: () => void;
    children: UserProfile[]; 
}

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({ task, onSubmit, onClose, children }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState<string | null>(null); 
    const [points, setPoints] = useState<string>('0');
    const [assignedToId, setAssignedToId] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setDueDate(task.dueDate || null);
            setPoints(task.points?.toString() || '0');
            setAssignedToId(task.assignedToId || null);
        } else {
            setTitle('');
            setDescription('');
            setDueDate(null);
            setPoints('0');
            setAssignedToId(null);
        }
    }, [task]);

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert('Validation Error', 'Task title cannot be empty.');
            return;
        }
        const numericPoints = parseInt(points, 10);
        if (isNaN(numericPoints) || numericPoints < 0) {
            Alert.alert('Validation Error', 'Points must be a non-negative number.');
            return;
        }
        if (!assignedToId) {
            Alert.alert('Validation Error', 'Please assign the task to a family member.');
            return;
        }

        onSubmit({
            taskId: task?.taskId, 
            title,
            description,
            dueDate,
            points: numericPoints,
            assignedToId,
        });
    };

    const showDatePickerHandler = () => setShowDatePicker(true);
    const hideDatePicker = () => setShowDatePicker(false);

    const handleDateConfirm = (date: Date) => {
        setDueDate(date.toISOString().split('T')[0]); 
        hideDatePicker();
    };

    const assignableMembers = React.useMemo(() => {
        const members = children.map(child => ({ userId: child.userId, displayName: child.displayName, avatarUrl: child.avatarUrl }));
        if (task?.assignedTo && task.assignedToId === task.assignedTo.userId && !members.some(m => m.userId === task.assignedTo?.userId)) {
            members.unshift({
                userId: task.assignedTo.userId,
                displayName: task.assignedTo.displayName,
                avatarUrl: task.assignedTo.avatarUrl
            });
        }
        return members;
    }, [children, task?.assignedTo, task?.assignedToId]);

    useEffect(() => {
        if (!task && children.length > 0 && !assignedToId) {
            setAssignedToId(children[0].userId); 
        }
    }, [task, children, assignedToId]);

    return (
        <PaperProvider>
            <Portal>
                <Modal visible={true} onDismiss={onClose} contentContainerStyle={styles.modalContainer}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Title style={styles.modalTitle}>{task ? 'Edit Task' : 'Create New Task'}</Title>

                        <TextInput label="Task Title*" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} />
                        <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={3} style={styles.input} />

                        <View style={styles.rowInput}>
                            <TextInput label="Points" value={points} onChangeText={setPoints} keyboardType="numeric" mode="outlined" style={styles.pointsInput} left={<Icon name="star-circle" size={20} color="gold" />} />
                            <Button 
                                icon="calendar-today"
                                onPress={showDatePickerHandler}
                                mode="outlined"
                                style={styles.dueDateButton}
                                labelStyle={styles.dueDateButtonLabel}
                            >{dueDate ? new Date(dueDate).toLocaleDateString() : 'Due Date'}</Button>
                        </View>
                        <DateTimePickerModal isVisible={showDatePicker} mode="date" onConfirm={handleDateConfirm} onCancel={hideDatePicker} minimumDate={new Date()} date={dueDate ? new Date(dueDate) : new Date()} />

                        <Title style={styles.sectionTitle}>Assign To</Title>
                        <View style={styles.assigneeContainer}>
                            <RadioButton.Group onValueChange={setAssignedToId} value={assignedToId || ''}>
                                {assignableMembers.map((member) => (
                                    <View key={member.userId} style={styles.radioRow}>
                                        <RadioButton value={member.userId} />
                                        <TouchableOpacity onPress={() => setAssignedToId(member.userId)} style={styles.memberInfo}>
                                            <Avatar.Image size={36} source={{ uri: member.avatarUrl || undefined }} style={styles.avatar} />
                                            <Text style={styles.memberName}>{member.displayName}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                { !assignableMembers.length && <Text style={styles.noAssigneesText}>No family members available.</Text> }
                            </RadioButton.Group>
                        </View>

                        <View style={styles.modalActions}>
                            <Button onPress={onClose} mode="text" style={styles.cancelButton}>Cancel</Button>
                            <Button onPress={handleSave} mode="contained" style={styles.saveButton}>Save Task</Button>
                        </View>
                    </ScrollView>
                </Modal>
            </Portal>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '90%',
        width: '90%',
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
    rowInput: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    pointsInput: {
        flex: 1,
        marginRight: 10,
        backgroundColor: '#fff',
    },
    dueDateButton: {
        flex: 1,
        minHeight: 56, 
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderColor: '#ccc',
    },
     dueDateButtonLabel: {
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 8,
        color: '#555',
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
});

export default AddEditTaskModal;
