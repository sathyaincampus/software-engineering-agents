import api from './api';
import { Task, TaskCreate, TaskUpdate } from '../types/tasks';
import { UUID } from '../types/common';

export const fetchTasks = async (familyId: UUID): Promise<Task[]> => {
  try {
    const response = await api.get(`/v1/tasks?family_id=${familyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const fetchTaskById = async (taskId: UUID): Promise<Task> => {
  try {
    const response = await api.get(`/v1/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task by ID:', error);
    throw error;
  }
};

export const createTask = async (taskData: TaskCreate): Promise<Task> => {
  try {
    const response = await api.post('/v1/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: UUID, taskData: TaskUpdate): Promise<Task> => {
  try {
    const response = await api.put(`/v1/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: UUID): Promise<void> => {
  try {
    await api.delete(`/v1/tasks/${taskId}`);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const completeTask = async (taskId: UUID): Promise<Task> => {
  try {
    // Assuming a specific endpoint or method for completion, e.g., POST /tasks/{taskId}/complete
    // If it's just an update, the backend logic needs to handle status change.
    // For now, let's assume an update to status='completed'
    const response = await api.patch(`/v1/tasks/${taskId}`, { status: 'completed' });
    return response.data;
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
};
