import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api'; // Assuming you have an api service configured

export interface Task {
  task_id: string;
  family_id: string;
  title: string;
  description: string | null;
  assigned_to: string; // user_id of the child
  due_date: string; // ISO format date string
  points: number;
  status: 'pending' | 'completed' | 'in_progress';
  created_by: string; // user_id of the parent
  created_at: string;
  updated_at: string;
}

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
};

// Async thunks for API interactions
export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (familyId: string, { rejectWithValue }) => {
  try {
    // This endpoint should fetch tasks for the entire family or based on filters
    const response = await api.get(`/tasks?familyId=${familyId}`);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
  }
});

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Omit<Task, 'task_id' | 'status' | 'created_at' | 'updated_at'>, {
    rejectWithValue,
  }) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }, {
    rejectWithValue,
  }) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updates);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, {
    rejectWithValue,
  }) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      return taskId; // Return the ID of the deleted task
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Standard reducers can be added here if needed, e.g., for local state updates
    resetTasks: (state) => {
      state.tasks = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = false;
        // Assuming the backend returns all tasks for the family, we might need to filter later based on the user
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task.task_id === action.payload.task_id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.task_id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
