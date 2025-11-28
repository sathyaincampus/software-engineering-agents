import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CustomCategory, CustomCategoryCreate } from '../types/categories';
import { UUID } from '../types/common';
import * as categoryService from '../api/categories'; // Reusing the same API service

// Task categories are essentially the same structure as event categories
interface TaskCategoriesState {
  items: CustomCategory[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TaskCategoriesState = {
  items: [],
  loading: 'idle',
  error: null,
};

export const fetchTaskCategories = createAsyncThunk<CustomCategory[], UUID>(
  'taskCategories/fetchTaskCategories',
  async (familyId, { rejectWithValue }) => {
    try {
      const data = await categoryService.fetchCategories(familyId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch task categories');
    }
  }
);

export const addTaskCategory = createAsyncThunk<CustomCategory, CustomCategoryCreate>(
  'taskCategories/addTaskCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const data = await categoryService.createCategory(categoryData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add task category');
    }
  }
);

export const editTaskCategory = createAsyncThunk<CustomCategory, { categoryId: UUID; data: CustomCategoryCreate }>( 
  'taskCategories/editTaskCategory',
  async ({ categoryId, data }, { rejectWithValue }) => {
    try {
      const updatedCategory = await categoryService.updateCategory(categoryId, data);
      return updatedCategory;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update task category');
    }
  }
);

export const removeTaskCategory = createAsyncThunk<void, UUID>(
  'taskCategories/removeTaskCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      await categoryService.deleteCategory(categoryId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete task category');
    }
  }
);

const taskCategoriesSlice = createSlice({
  name: 'taskCategories',
  initialState,
  reducers: {
    resetTaskCategories: (state) => {
      state.items = [];
      state.loading = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaskCategories.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchTaskCategories.fulfilled, (state, action: PayloadAction<CustomCategory[]>) => {
        state.loading = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTaskCategories.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(addTaskCategory.fulfilled, (state, action: PayloadAction<CustomCategory>) => {
        state.items.push(action.payload);
      })
      .addCase(addTaskCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(editTaskCategory.fulfilled, (state, action: PayloadAction<CustomCategory>) => {
        const index = state.items.findIndex(cat => cat.category_id === action.payload.category_id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(editTaskCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(removeTaskCategory.fulfilled, (state, action: PayloadAction<void, string, { rejectedValue: string }>) => {
        state.items = state.items.filter(cat => cat.category_id !== action.meta.arg);
      })
      .addCase(removeTaskCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { resetTaskCategories } = taskCategoriesSlice.actions;

export default taskCategoriesSlice.reducer;
