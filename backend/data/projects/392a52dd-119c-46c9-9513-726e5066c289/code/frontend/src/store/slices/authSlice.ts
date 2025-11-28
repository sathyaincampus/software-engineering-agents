import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api'; // Assume api service handles HTTP requests
import { LoginData, SignupData, AuthResponse, UserProfile } from '../../types/auth'; // Define your types

interface AuthState {
    token: string | null;
    user: UserProfile | null;
    isAuthenticated: boolean;
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: AuthState = {
    token: null,
    user: null,
    isAuthenticated: false,
    loading: 'idle',
    error: null,
};

// Async thunk for User Signup
export const signup = createAsyncThunk<
    AuthResponse, // Return type
    SignupData,   // Argument type
    { rejectValue: string } // Error type
>(
    'auth/signup',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post<AuthResponse>('/auth/signup', userData);
            await AsyncStorage.setItem('userToken', response.data.token);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Signup failed');
        }
    }
);

// Async thunk for User Login
export const login = createAsyncThunk<
    AuthResponse,
    LoginData,
    { rejectValue: string }
>(
    'auth/login',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post<AuthResponse>('/auth/login', userData);
            await AsyncStorage.setItem('userToken', response.data.token);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

// Async thunk for Google Login (handles callback)
export const googleLogin = createAsyncThunk<
    AuthResponse,
    { user: UserProfile, token: string }, // Mock response structure
    { rejectValue: string } 
>(
    'auth/googleLogin',
    async (authData, { rejectWithValue }) => {
        try {
            // In a real scenario, you'd send the token/user info to your backend's Google callback endpoint
            // For now, we'll simulate storing the token directly
            await AsyncStorage.setItem('userToken', authData.token);
            // Simulate API response structure
            return {
                token: authData.token,
                user: {
                    userId: 'mockUserIdGoogle',
                    email: authData.user.email,
                    displayName: authData.user.displayName,
                    avatarUrl: authData.user.avatarUrl || null, // Ensure avatarUrl is handled
                    role: 'CHILD', // Default role, backend should confirm/set
                }
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Google login failed');
        }
    }
);

// Async thunk to check authentication status (e.g., on app load)
export const checkAuthStatus = createAsyncThunk<
    { isAuthenticated: boolean, user: UserProfile | null }, // Return shape
    string | null // Token argument
>(
    'auth/checkAuthStatus',
    async (token, { rejectWithValue }) => {
        if (!token) {
            await AsyncStorage.removeItem('userToken'); // Clear token if none found
            return { isAuthenticated: false, user: null };
        }
        try {
            // You might want to call an API endpoint here to validate the token
            // For example: const response = await api.get('/auth/me'); 
            // For now, just assume token presence means logged in
            // If token is present, try to fetch user profile using the token
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await api.get<UserProfile>('/users/me'); // Fetch user profile
            return { isAuthenticated: true, user: response.data };
        } catch (error: any) {
            // If token validation fails or profile fetch fails, clear stored token
            console.error('Auth status check failed:', error.message);
            await AsyncStorage.removeItem('userToken');
            return { isAuthenticated: false, user: null };
        }
    }
);

// Async thunk for Logout
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { dispatch }) => {
        await AsyncStorage.removeItem('userToken');
        // Optionally clear other related state like user profile data
        dispatch(setAuthState({ token: null, user: null, isAuthenticated: false }));
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Manually set auth state (e.g., after successful login/signup)
        setAuthState(state, action: PayloadAction<Partial<AuthState>>) {
            state.token = action.payload.token ?? state.token;
            state.user = action.payload.user ?? state.user;
            state.isAuthenticated = action.payload.isAuthenticated ?? state.isAuthenticated;
            state.loading = 'succeeded'; // Set loading to succeeded after manual state update
        },
        clearError(state) {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Signup Reducers
            .addCase(signup.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(signup.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(signup.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || action.error.message || 'Signup failed';
            })
            // Login Reducers
            .addCase(login.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || action.error.message || 'Login failed';
            })
             // Google Login Reducers
            .addCase(googleLogin.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(googleLogin.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(googleLogin.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || action.error.message || 'Google login failed';
            })
            // Check Auth Status Reducers
            .addCase(checkAuthStatus.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.isAuthenticated = action.payload.isAuthenticated;
                state.user = action.payload.user;
                // Token is managed by AsyncStorage, so we don't set it here unless fetched
                if (state.isAuthenticated && !state.token) {
                    // Attempt to retrieve token from storage if not already set
                    AsyncStorage.getItem('userToken').then(storedToken => {
                        if (storedToken) {
                            state.token = storedToken;
                        }
                    });
                } else if (!state.isAuthenticated) {
                    state.token = null; // Ensure token is null if not authenticated
                }
            })
            .addCase(checkAuthStatus.rejected, (state) => {
                 state.loading = 'failed';
                 state.isAuthenticated = false;
                 state.token = null;
                 state.user = null;
            })
            // Logout Reducers
            .addCase(logout.fulfilled, (state) => {
                // State is reset in the reducer itself
            });
    },
});

export const { setAuthState, clearError } = authSlice.actions;

export default authSlice.reducer;
