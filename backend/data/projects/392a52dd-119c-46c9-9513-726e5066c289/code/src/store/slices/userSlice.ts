import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api'; // Assuming you have an API service setup

interface UserProfile {
  userId: string;
  name: string;
  age: number;
  avatarUrl: string | null;
  // Add other profile fields as needed
}

export interface UserProfileState {
  profile: UserProfile | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UserProfileState = {
  profile: null,
  loading: 'idle',
  error: null,
};

// Async thunks for user profile operations
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/profile'); // Adjust API endpoint as needed
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const createUserProfile = createAsyncThunk(
  'user/createProfile',
  async (profileData: Omit<UserProfile, 'userId'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/user/profile', profileData); // Adjust API endpoint
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<UserProfile> & { userId: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/user/profile/${profileData.userId}`, profileData); // Adjust API endpoint
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout'); // Adjust API endpoint
      return; // No data to return on successful logout
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to logout');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Add any synchronous reducers here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(createUserProfile.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(createUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(createUserProfile.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Reset state on logout
        state.profile = null;
        state.loading = 'idle';
        state.error = null;
      });
  },
});

export default userSlice.reducer;
