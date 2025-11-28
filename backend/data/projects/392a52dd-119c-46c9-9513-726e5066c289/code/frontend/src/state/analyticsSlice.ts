import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as analyticsService from '../api/analytics';
import { UUID } from '../types/common';

interface TimeAllocationAnalytics {
  total_duration_minutes: number;
  category_durations_minutes: { [categoryName: string]: number };
}

interface TaskCompletionTrends {
  daily_completion_counts: { [date: string]: number };
  total_completed_tasks: number;
}

interface RewardSpendingTrends {
  monthly_points_redeemed: { [month: string]: number }; // Month format like 'YYYY-MM'
  total_points_redeemed: number;
}

interface AnalyticsState {
  timeAllocation: TimeAllocationAnalytics | null;
  taskCompletion: TaskCompletionTrends | null;
  rewardSpending: RewardSpendingTrends | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AnalyticsState = {
  timeAllocation: null,
  taskCompletion: null,
  rewardSpending: null,
  loading: 'idle',
  error: null,
};

export const getTimeAllocationAnalytics = createAsyncThunk<TimeAllocationAnalytics, { familyId: UUID; startDate: string; endDate: string }>(
  'analytics/getTimeAllocation',
  async ({ familyId, startDate, endDate }, { rejectWithValue }) => {
    try {
      return await analyticsService.fetchTimeAllocationAnalytics(familyId, startDate, endDate);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch time allocation data');
    }
  }
);

export const getTaskCompletionTrends = createAsyncThunk<TaskCompletionTrends, { familyId: UUID; startDate: string; endDate: string }>(
  'analytics/getTaskCompletion',
  async ({ familyId, startDate, endDate }, { rejectWithValue }) => {
    try {
      return await analyticsService.fetchTaskCompletionTrends(familyId, startDate, endDate);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch task completion trends');
    }
  }
);

export const getRewardSpendingTrends = createAsyncThunk<RewardSpendingTrends, { familyId: UUID; startDate: string; endDate: string }>(
  'analytics/getRewardSpending',
  async ({ familyId, startDate, endDate }, { rejectWithValue }) => {
    try {
      return await analyticsService.fetchRewardSpendingTrends(familyId, startDate, endDate);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch reward spending trends');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    resetAnalytics: (state) => {
      state.timeAllocation = null;
      state.taskCompletion = null;
      state.rewardSpending = null;
      state.loading = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTimeAllocationAnalytics.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(getTimeAllocationAnalytics.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.timeAllocation = action.payload;
      })
      .addCase(getTimeAllocationAnalytics.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(getTaskCompletionTrends.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(getTaskCompletionTrends.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.taskCompletion = action.payload;
      })
      .addCase(getTaskCompletionTrends.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(getRewardSpendingTrends.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(getRewardSpendingTrends.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.rewardSpending = action.payload;
      })
      .addCase(getRewardSpendingTrends.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { resetAnalytics } = analyticsSlice.actions;

export default analyticsSlice.reducer;
