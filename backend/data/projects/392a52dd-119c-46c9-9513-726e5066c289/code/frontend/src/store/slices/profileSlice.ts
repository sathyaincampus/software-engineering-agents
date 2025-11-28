import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { UserProfile } from '../../types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDispatch } from '../store'; // Import AppDispatch type

interface ProfileState {
    user: UserProfile | null;
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
    uploadingAvatar: boolean;
    uploadError: string | null;
}

const initialState: ProfileState = {
    user: null,
    loading: 'idle',
    error: null,
    uploadingAvatar: false,
    uploadError: null,
};

// Fetch user profile (can be the same as the one from auth slice or a dedicated one)
export const fetchUserProfile = createAsyncThunk<UserProfile, void, { rejectValue: string }>
('profile/fetchUserProfile', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get<UserProfile>('/users/me');
        return response.data;
    } catch (error: any) {
        console.error("API Error fetching profile:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
});

// Update user profile (e.g., display name)
export const updateProfile = createAsyncThunk<UserProfile, Partial<UserProfile>, { rejectValue: string, dispatch: AppDispatch }>
('profile/updateProfile', async (userData, { rejectWithValue, dispatch, getState }) => {
    try {
        const response = await api.put<UserProfile>('/users/me', userData);
        // Update the user object in the auth slice as well
        dispatch(setAuthState({ user: response.data }));
        return response.data;
    } catch (error: any) {
        console.error("API Error updating profile:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
});

// Upload avatar
export const uploadAvatar = createAsyncThunk<
    { avatarUrl: string }, // Expected response structure
    FormData, 
    { rejectValue: string, dispatch: AppDispatch } 
>
('profile/uploadAvatar', async (formData, { rejectWithValue, dispatch, getState }) => {
    try {
        const response = await api.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        // Update the user's avatar URL in the auth slice state
        dispatch(setAuthState({ user: { ...(getState() as any).auth.user, avatarUrl: response.data.avatarUrl } }));
        return response.data;
    } catch (error: any) {
        console.error("API Error uploading avatar:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to upload avatar');
    }
});

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        resetProfileState: () => initialState,
        setAuthState(state, action: PayloadAction<{ user: UserProfile | null }>) {
             state.user = action.payload.user;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch User Profile
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                state.loading = 'succeeded';
                state.user = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || 'Failed to fetch profile';
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                state.loading = 'succeeded';
                state.user = action.payload;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || 'Failed to update profile';
            })
            // Upload Avatar
            .addCase(uploadAvatar.pending, (state) => {
                state.uploadingAvatar = true;
                state.uploadError = null;
            })
            .addCase(uploadAvatar.fulfilled, (state, action) => {
                state.uploadingAvatar = false;
                // Avatar URL is updated directly via setAuthState in the thunk
            })
            .addCase(uploadAvatar.rejected, (state, action) => {
                state.uploadingAvatar = false;
                state.uploadError = action.payload || 'Failed to upload avatar';
            });
    },
});

export const { resetProfileState, setAuthState } = profileSlice.actions;
export default profileSlice.reducer;
