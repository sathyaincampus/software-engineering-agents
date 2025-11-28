import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Task, TaskStatus } from '../../types/tasks';
import { UserProfile } from '../../types/auth';

interface TasksState {
    tasks: Task[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: TasksState = {
    tasks: [],
    loading: 'idle',
    error: null,
};

// Async thunks for Task operations
export const fetchTasks = createAsyncThunk<Task[], { filter: 'ALL' | 'PENDING' | 'COMPLETED' } | void, { rejectValue: string }>
('tasks/fetchTasks', async (params, { rejectWithValue }) => {
    try {
        let apiUrl = '/tasks';
        let queryParams = '';

        if (params && 'filter' in params) {
            if (params.filter === 'ALL') {
                queryParams = ''; 
            } else if (params.filter === 'PENDING') {
                queryParams = '?status=PENDING';
            } else if (params.filter === 'COMPLETED') {
                queryParams = '?status=COMPLETED';
            }
        }
        apiUrl += queryParams;

        const response = await api.get<Task[]>(apiUrl);
        return response.data.map(task => ({
            ...task,
            assignedTo: task.assignedTo as UserProfile | null | undefined,
            createdBy: task.createdBy as UserProfile,
        }));
    } catch (error: any) {
        console.error("API Error fetching tasks:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
});

export const fetchTasksAssignedToMe = createAsyncThunk<Task[], void, { rejectValue: string }>
('tasks/fetchTasksAssignedToMe', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get<Task[]>('/tasks?assignedToMe=true'); 
         return response.data.map(task => ({
            ...task,
            assignedTo: task.assignedTo as UserProfile | null | undefined,
            createdBy: task.createdBy as UserProfile,
        }));
    } catch (error: any) {
         console.error("API Error fetching tasks assigned to me:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
});

interface TaskInput {
    taskId?: string;
    title: string;
    description?: string;
    dueDate?: string | null;
    points?: number;
    assignedToId: string;
    status?: TaskStatus;
}

export const createTask = createAsyncThunk<Task, Omit<TaskInput, 'taskId' | 'status'>, { rejectValue: string }>
('tasks/createTask', async (taskData, { rejectWithValue }) => {
    try {
        const response = await api.post<Task>('/tasks', taskData);
        return response.data;
    } catch (error: any) {
        console.error("API Error creating task:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
});

export const updateTaskStatus = createAsyncThunk<Task, { taskId: string; status: TaskStatus }, { rejectValue: string }>
('tasks/updateTaskStatus', async ({ taskId, status }, { rejectWithValue }) => {
    try {
        const response = await api.put<Task>(`/tasks/${taskId}`, { status });
        return response.data;
    } catch (error: any) {
        console.error(`API Error updating task ${taskId} status:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to update task status');
    }
});

export const updateTask = createAsyncThunk<Task, TaskInput, { rejectValue: string }>
('tasks/updateTask', async (taskData, { rejectWithValue }) => {
    if (!taskData.taskId) return rejectWithValue('Task ID is required for update');
    try {
        const response = await api.put<Task>(`/tasks/${taskData.taskId}`, taskData);
        return response.data;
    } catch (error: any) {
        console.error(`API Error updating task ${taskData.taskId}:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
});

export const deleteTask = createAsyncThunk<string, string, { rejectValue: string }>
('tasks/deleteTask', async (taskId, { rejectWithValue }) => {
    try {
        await api.delete(`/tasks/${taskId}`);
        return taskId;
    } catch (error: any) {
        console.error(`API Error deleting task ${taskId}:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
});

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        resetTasksState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTasks.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
                state.loading = 'succeeded';
                state.tasks = action.payload;
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || 'Failed to fetch tasks';
            })
            .addCase(fetchTasksAssignedToMe.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchTasksAssignedToMe.fulfilled, (state, action: PayloadAction<Task[]>) => {
                state.loading = 'succeeded';
                state.tasks = action.payload;
            })
            .addCase(fetchTasksAssignedToMe.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || 'Failed to fetch tasks';
            })
            .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
                state.tasks.push(action.payload);
            })
            .addCase(createTask.rejected, (state, action) => {
                 state.error = action.payload || 'Failed to create task';
            })
            .addCase(updateTaskStatus.fulfilled, (state, action: PayloadAction<Task>) => {
                const index = state.tasks.findIndex(t => t.taskId === action.payload.taskId);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(updateTaskStatus.rejected, (state, action) => {
                 state.error = action.payload || 'Failed to update task status';
            })
             .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
                const index = state.tasks.findIndex(t => t.taskId === action.payload.taskId);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(updateTask.rejected, (state, action) => {
                 state.error = action.payload || 'Failed to update task';
            })
            .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
                state.tasks = state.tasks.filter(t => t.taskId !== action.payload);
            })
            .addCase(deleteTask.rejected, (state, action) => {
                state.error = action.payload || 'Failed to delete task';
            });
    },
});

export const { resetTasksState } = tasksSlice.actions;
export default tasksSlice.reducer;
