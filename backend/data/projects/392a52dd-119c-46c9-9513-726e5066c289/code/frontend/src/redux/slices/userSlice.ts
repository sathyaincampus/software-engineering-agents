import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/apiService'; // Assume this handles API calls

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
  // Add other user properties as needed
}

interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
  token: null,
};

// Async thunks for API interactions
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Assuming apiService has a method like getUserProfile(userId)
      const response = await apiService.get(`/users/${userId}`); // Adjust API endpoint as needed
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData: { userId: string; displayName: string; /* other fields */ }, {
    rejectWithValue,
    getState
  }) => {
    try {
      const { auth } = getState() as any; // Access auth token from auth slice
      const response = await apiService.put(`/users/${userData.userId}`, {
        displayName: userData.displayName,
        // other fields to update
      }, {
        headers: {
          'x-auth-token': auth.token
        }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (formData: FormData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState() as any;
      // Assuming an endpoint like /users/:userId/avatar
      const userId = (getState() as any).user.user.id; // Get current user ID
      if (!userId) {
         throw new Error('User ID not found');
      }
      const response = await apiService.post(`/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': auth.token
        }
      });
      return response.data; // Expecting { avatarUrl: '...' }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        // Update the user state with the returned data
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(uploadAvatar.pending, (state) => {
         state.loading = true;
         state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action: PayloadAction<{ avatarUrl: string }>) => {
        state.loading = false;
        if (state.user) {
          state.user.avatarUrl = action.payload.avatarUrl;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setToken, setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
