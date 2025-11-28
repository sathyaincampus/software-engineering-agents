import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearUser, setUser, setToken } from './userSlice';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const signup = createAsyncThunk(
  'auth/signup',
  async ({ email, password, displayName }: {
    email: string;
    password: string;
    displayName: string;
  },
  { rejectWithValue, dispatch }) => {
    try {
      const response = await apiService.post('/auth/signup', {
        email,
        password,
        displayName,
      });
      // Store token and user info
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      dispatch(setToken(response.data.token));
      dispatch(setUser(response.data.user));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: {
    email: string;
    password: string;
  },
  { rejectWithValue, dispatch }) => {
    try {
      const response = await apiService.post('/auth/login', {
        email,
        password,
      });
      // Store token and user info
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      dispatch(setToken(response.data.token));
      dispatch(setUser(response.data.user));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const googleSignIn = createAsyncThunk(
  'auth/googleSignIn',
  async ({ token }: { token: string }, {
    rejectWithValue,
    dispatch
  }) => {
    try {
      const response = await apiService.post('/auth/google', {
        token: token, // Send the Google ID token to the backend
      });
      // Store token and user info
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      dispatch(setToken(response.data.token));
      dispatch(setUser(response.data.user));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, {
    dispatch
  }) => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    dispatch(clearUser());
    // Optionally clear other state slices like cart, etc.
  }
);

// Check initial authentication status on app load
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, {
    dispatch
  }) => {
    const token = await AsyncStorage.getItem('authToken');
    const userData = await AsyncStorage.getItem('user');

    if (token && userData) {
      dispatch(setToken(token));
      dispatch(setUser(JSON.parse(userData)));
      return true; // Authenticated
    } else {
      // Clear potentially stale data if token is missing
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      dispatch(clearUser());
      return false; // Not authenticated
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducers can be added here if needed for synchronous actions
  },
  extraReducers: (builder) => {
    builder
      // Signup Reducers
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Login Reducers
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
       // Google SignIn Reducers
      .addCase(googleSignIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleSignIn.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(googleSignIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout Reducers
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      // CheckAuthStatus Reducers
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = 'Failed to check authentication status';
      });
  },
});

export default authSlice.reducer;
