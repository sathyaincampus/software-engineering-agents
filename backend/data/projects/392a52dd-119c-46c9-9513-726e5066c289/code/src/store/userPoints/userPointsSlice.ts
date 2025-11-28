import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// Assuming UserPoints model from backend might look like this
export interface UserPoints {
  user_id: string;
  current_points: number;
}

interface UserPointsState {
  points: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserPointsState = {
  points: null,
  loading: false,
  error: null,
};

export const fetchUserPoints = createAsyncThunk(
  'userPoints/fetchUserPoints',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Assuming an endpoint like /users/:id/points or /users/me/points
      const response = await api.get(`/users/${userId}/points`); // Adjust endpoint as needed
      return response.data.data.current_points; // Expecting the number of points
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user points');
    }
  }
);

// Note: Post/Put for updating points might be handled by task completion or reward redemption logic.
// This slice mainly focuses on fetching the current points balance.

const userPointsSlice = createSlice({
  name: 'userPoints',
  initialState,
  reducers: {
    resetUserPoints: (state) => {
      state.points = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPoints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPoints.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.points = action.payload;
      })
      .addCase(fetchUserPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetUserPoints } = userPointsSlice.actions;
export default userPointsSlice.reducer;
