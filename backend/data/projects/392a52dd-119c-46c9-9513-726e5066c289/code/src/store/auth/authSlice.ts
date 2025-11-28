import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-react-native-async-storage/async-storage';
import api from '../../services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'parent' | 'child';
  familyId?: string;
  // Add any other profile fields needed
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks (login, logout, googleSignIn, etc. are likely defined elsewhere or in this file)

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      // Endpoint to get user profile by ID
      const response = await api.get(`/users/${userId}`); // Assuming /users/:id endpoint exists and returns user profile
      return response.data.data; // Expecting user object
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async ({ userId, updates }: { userId: string; updates: Partial<Omit<User, 'id' | 'role' | 'familyId' | 'email'>> }, {
    rejectWithValue,
  }) => {
    try {
      // Assuming an endpoint like /users/:id to update profile
      const response = await api.put(`/users/${userId}`, updates);
      return response.data.data; // Expecting updated user object
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user profile');
    }
  }
);

// Mock loginUser, logoutUser, googleSignIn, checkAuthStatus if not present
export const loginUser = createAsyncThunk(/* ... */);
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout'); // Optional: backend invalidation
      await AsyncStorage.removeItem('jwtToken');
      return null;
    } catch (error: any) {
      await AsyncStorage.removeItem('jwtToken');
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);
export const googleSignIn = createAsyncThunk(/* ... */);
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        return rejectWithValue('No token found');
      }
      // Assuming /auth/me endpoint returns the logged-in user's info based on JWT
      const response = await api.get('/auth/me');
      return response.data.user; // Expecting { id, email, displayName, role, familyId, ... }
    } catch (error: any) {
      // If /auth/me fails (e.g., invalid token), clear local token and reject
      await AsyncStorage.removeItem('jwtToken');
      // Dispatch logoutUser to reset state properly
      dispatch(logoutUser());
      return rejectWithValue('Authentication failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    // setUser action might be redundant if fetchUser/checkAuthStatus populates it correctly
  },
  extraReducers: (builder) => {
    builder
      // Handle loginUser, logoutUser, googleSignIn cases similarly
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.loading = false;
        state.isAuthenticated = false;
      })
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // If fetching user fails, might indicate auth issues, reset state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.loading = false;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loading = false;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
