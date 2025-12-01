import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { format, startOfDay } from 'date-fns';
import * as FirebaseService from '../firebase/firebaseService';

// Assuming Habit interface is defined elsewhere or here
interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: { type: string; days?: number[] };
  reminderTime?: string;
  createdAt: any; // Timestamp or Date object
  userId: string;
  streak: number;
  isCompletedToday: boolean;
  color?: string; // Optional color for UI
}

interface HabitCompletionPayload {
  habitId: string;
  isCompleted: boolean;
}

interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
}

const initialState: HabitsState = {
  habits: [],
  isLoading: false,
  error: null,
};

export const fetchHabits = createAsyncThunk<Habit[], void, { rejectValue: string }>(
  'habits/fetchHabits',
  async (_, { rejectWithValue }) => {
    try {
      const habitsData = await FirebaseService.getUserHabitsWithCompletionStatus();
      return habitsData as Habit[];
    } catch (error: any) {
      console.error('Error fetching habits:', error);
      return rejectWithValue(error.message || 'Failed to fetch habits.');
    }
  }
);

export const toggleHabitCompletion = createAsyncThunk(
  'habits/toggleHabitCompletion',
  async ({ habitId, isCompleted }: HabitCompletionPayload, { getState, rejectWithValue }) => {
    try {
      if (isCompleted) {
        // User wants to unmark the habit
        await FirebaseService.unmarkHabitCompletion(habitId);
        return { habitId, isCompleted: false };
      } else {
        // User wants to mark the habit as complete
        await FirebaseService.logHabitCompletion(habitId);
        return { habitId, isCompleted: true };
      }
    } catch (error: any) {
      console.error('Error toggling habit completion:', error);
      return rejectWithValue(error.message || 'Failed to update habit completion.');
    }
  }
);

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    // Action to manually update streak and completion status based on fetched data
    // This can be useful for optimistic updates or if server-side updates are delayed
    updateHabitStatus: (state, action: PayloadAction<{ habitId: string; isCompleted: boolean; streak: number }>)=> {
        const { habitId, isCompleted, streak } = action.payload;
        const habitIndex = state.habits.findIndex(h => h.id === habitId);
        if (habitIndex !== -1) {
            state.habits[habitIndex].isCompletedToday = isCompleted;
            state.habits[habitIndex].streak = streak;
        }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHabits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHabits.fulfilled, (state, action: PayloadAction<Habit[]>) => {
        state.isLoading = false;
        state.habits = action.payload;
      })
      .addCase(fetchHabits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Unknown error';
      })
      .addCase(toggleHabitCompletion.pending, (state) => {
        // Indicate loading state or optimistic update in progress if desired
      })
      .addCase(toggleHabitCompletion.fulfilled, (state, action: PayloadAction<{ habitId: string; isCompleted: boolean }>) => {
        const { habitId, isCompleted } = action.payload;
        const habitIndex = state.habits.findIndex(h => h.id === habitId);
        if (habitIndex !== -1) {
          // Update UI state optimistically based on the action payload
          state.habits[habitIndex].isCompletedToday = isCompleted;
          // Streak update will be handled by a subsequent fetch or handled directly here if logic is simple
          // For simplicity, we'll rely on the next fetchHabits to get the correct streak from Firestore
          // Or, if toggleHabitCompletion returned the new streak, update it here:
          // state.habits[habitIndex].streak = newStreak;
        }
      })
      .addCase(toggleHabitCompletion.rejected, (state, action) => {
        // Handle error state, e.g., show a toast message
        state.error = action.payload || 'Failed to toggle completion.';
        console.error('Failed to toggle habit completion:', action.payload);
        // Optionally revert optimistic updates if they were applied
      });
  },
});

export const { updateHabitStatus } = habitsSlice.actions;
export default habitsSlice.reducer;
