import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as taskService from '../api/tasks';
import * as categoryService from '../api/categories'; // Import categories API
import { Task, TaskCreate, TaskUpdate } from '../types/tasks';
import { CustomCategory } from '../types/categories';
import { UUID } from '../types/common';

interface TasksState {
  items: Task[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  selectedTask: Task | null;
  categories: CustomCategory[]; // Store task categories
}

const initialState: TasksState = {
  items: [],
  loading: 'idle',
  error: null,
  selectedTask: null,
  categories: [],
};

export const fetchTasks = createAsyncThunk<Task[], UUID>(
  'tasks/fetchTasks',
  async (familyId, { rejectWithValue }) => {
    try {
      const data = await taskService.fetchTasks(familyId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch tasks');
    }
  }
);

export const fetchTaskById = createAsyncThunk<Task, UUID>(
  'tasks/fetchTaskById',
  async (taskId, { rejectWithValue }) => {
    try {
      const data = await taskService.fetchTaskById(taskId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch task');
    }
  }
);

export const addTask = createAsyncThunk<Task, TaskCreate>(
  'tasks/addTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const data = await taskService.createTask(taskData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add task');
    }
  }
);

export const updateTask = createAsyncThunk<Task, { taskId: UUID; taskData: TaskUpdate }>(
  'tasks/updateTask',
  async ({ taskId, taskData }, { rejectWithValue }) => {
    try {
      const data = await taskService.updateTask(taskId, taskData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk<void, UUID>(
  'tasks/deleteTask',
  async (taskId, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(taskId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete task');
    }
  }
);

export const completeTask = createAsyncThunk<Task, UUID>(
  'tasks/completeTask',
  async (taskId, { rejectWithValue }) => {
    try {
      const data = await taskService.completeTask(taskId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to complete task');
    }
  }
);

// Async thunk to fetch task categories
export const fetchTaskCategories = createAsyncThunk<CustomCategory[], UUID>(
  'tasks/fetchTaskCategories',
  async (familyId, { rejectWithValue }) => {
    try {
      const data = await categoryService.fetchCategories(familyId); // Reusing fetchCategories from api/categories.ts
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch task categories');
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    resetTasks: (state) => {
      state.items = [];
      state.loading = 'idle';
      state.error = null;
      state.selectedTask = null;
    },
    selectTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchTaskById.fulfilled, (state, action: PayloadAction<Task>) => {
        state.selectedTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(addTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.items.push(action.payload);
      })
      .addCase(addTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.items.findIndex(task => task.task_id === action.payload.task_id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedTask?.task_id === action.payload.task_id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteTask.fulfilled, (state, action: PayloadAction<void, string, { rejectedValue: string }>) => {
        state.items = state.items.filter(task => task.task_id !== action.meta.arg);
        if (state.selectedTask?.task_id === action.meta.arg) {
          state.selectedTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(completeTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.items.findIndex(task => task.task_id === action.payload.task_id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedTask?.task_id === action.payload.task_id) {
          state.selectedTask = action.payload;
        }
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Handling task categories fetch
      .addCase(fetchTaskCategories.pending, (state) => {
        state.loading = 'pending'; // Use general loading state if needed
      })
      .addCase(fetchTaskCategories.fulfilled, (state, action: PayloadAction<CustomCategory[]>) => {
        state.categories = action.payload;
      })
      .addCase(fetchTaskCategories.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { resetTasks, selectTask } = tasksSlice.actions;

export default tasksSlice.reducer;
