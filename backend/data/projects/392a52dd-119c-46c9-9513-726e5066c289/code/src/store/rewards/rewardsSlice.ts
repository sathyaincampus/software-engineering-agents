import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Reward {
  reward_id: string;
  family_id: string;
  name: string;
  description: string | null;
  point_cost: number;
  requires_approval: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface RewardsState {
  rewards: Reward[];
  loading: boolean;
  error: string | null;
}

const initialState: RewardsState = {
  rewards: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchRewards = createAsyncThunk(
  'rewards/fetchRewards',
  async (familyId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/rewards?familyId=${familyId}`);
      return response.data.data; // Assuming response structure { success: true, data: [...] }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rewards');
    }
  }
);

export const createReward = createAsyncThunk(
  'rewards/createReward',
  async (rewardData: Omit<Reward, 'reward_id' | 'created_at' | 'updated_at' | 'created_by'> & { created_by?: string }, {
    rejectWithValue,
  }) => {
    try {
      const response = await api.post('/rewards', rewardData);
      return response.data.data; // Assuming created reward is returned
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create reward');
    }
  }
);

export const updateReward = createAsyncThunk(
  'rewards/updateReward',
  async ({ rewardId, updates }: { rewardId: string; updates: Partial<Omit<Reward, 'reward_id' | 'family_id' | 'created_by' | 'created_at' | 'updated_at'>> }, {
    rejectWithValue,
  }) => {
    try {
      const response = await api.put(`/rewards/${rewardId}`, updates);
      return response.data.data; // Assuming updated reward is returned
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update reward');
    }
  }
);

export const deleteReward = createAsyncThunk(
  'rewards/deleteReward',
  async (rewardId: string, {
    rejectWithValue,
  }) => {
    try {
      await api.delete(`/rewards/${rewardId}`);
      return rewardId; // Return ID of deleted reward
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete reward');
    }
  }
);

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    resetRewards: (state) => {
      state.rewards = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRewards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRewards.fulfilled, (state, action: PayloadAction<Reward[]>) => {
        state.loading = false;
        state.rewards = action.payload;
      })
      .addCase(fetchRewards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createReward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReward.fulfilled, (state, action: PayloadAction<Reward>) => {
        state.loading = false;
        state.rewards.push(action.payload);
      })
      .addCase(createReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateReward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReward.fulfilled, (state, action: PayloadAction<Reward>) => {
        state.loading = false;
        const index = state.rewards.findIndex(r => r.reward_id === action.payload.reward_id);
        if (index !== -1) {
          state.rewards[index] = action.payload;
        }
      })
      .addCase(updateReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteReward.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReward.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.rewards = state.rewards.filter(r => r.reward_id !== action.payload);
      })
      .addCase(deleteReward.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetRewards } = rewardsSlice.actions;
export default rewardsSlice.reducer;
