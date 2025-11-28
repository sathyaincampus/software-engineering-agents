import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CustomCategory, CustomCategoryCreate } from '../types/categories';
import { UUID } from '../types/common';
import * as categoryService from '../api/categories';

interface CategoriesState {
  items: CustomCategory[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: 'idle',
  error: null,
};

export const fetchCategories = createAsyncThunk<CustomCategory[], UUID>(
  'categories/fetchCategories',
  async (familyId, { rejectWithValue }) => {
    try {
      const data = await categoryService.fetchCategories(familyId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch categories');
    }
  }
);

export const addCategory = createAsyncThunk<CustomCategory, CustomCategoryCreate>(
  'categories/addCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const data = await categoryService.createCategory(categoryData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add category');
    }
  }
);

export const editCategory = createAsyncThunk<CustomCategory, { categoryId: UUID; data: CustomCategoryCreate }>( 
  'categories/editCategory',
  async ({ categoryId, data }, { rejectWithValue }) => {
    try {
      const updatedCategory = await categoryService.updateCategory(categoryId, data);
      return updatedCategory;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update category');
    }
  }
);

export const removeCategory = createAsyncThunk<void, UUID>(
  'categories/removeCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      await categoryService.deleteCategory(categoryId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete category');
    }
  }
);

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    resetCategories: (state) => {
      state.items = [];
      state.loading = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<CustomCategory[]>) => {
        state.loading = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(addCategory.fulfilled, (state, action: PayloadAction<CustomCategory>) => {
        state.items.push(action.payload);
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(editCategory.fulfilled, (state, action: PayloadAction<CustomCategory>) => {
        const index = state.items.findIndex(cat => cat.category_id === action.payload.category_id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(editCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(removeCategory.fulfilled, (state, action: PayloadAction<void, string, { rejectedValue: string }>) => {
        state.items = state.items.filter(cat => cat.category_id !== action.meta.arg);
      })
      .addCase(removeCategory.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { resetCategories } = categoriesSlice.actions;

export default categoriesSlice.reducer;
