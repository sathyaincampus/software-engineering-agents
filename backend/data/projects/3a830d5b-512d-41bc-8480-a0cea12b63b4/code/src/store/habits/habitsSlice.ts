import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, Timestamp, FirestoreError, onSnapshot, Unsubscribe, QuerySnapshot } from 'firebase/firestore';

import { db } from '../../config/firebase';
import { auth } from '../../config/firebase';
import { AppDispatch, RootState } from '../store';
import { selectCurrentUser } from '../auth';
import { Habit } from './habitsTypes'; // Assuming Habit type is defined elsewhere or kept here

// --- Interfaces ---

// Define the structure of a Habit object (moved to types file or kept here)
// export interface Habit { ... }

// Define the structure for the Habits state
interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  error: string | null;
}

// --- Initial State ---
const initialState: HabitsState = {
  habits: [],
  isLoading: false,
  error: null,
};

// --- Async Thunks ---

// Thunk to create a new habit
export const createHabit = createAsyncThunk<
  Habit, // Return type upon success
  Omit<Habit, 'id' | 'userId' | 'createdAt' | 'archived'>, // Input type (data for new habit)
  { rejectValue: string; state: RootState } // Options: rejectValue for error type, state for accessing Redux state
>(
  'habits/createHabit',
  async (habitData, { rejectWithValue, getState }) => {
    const currentUser = selectCurrentUser(getState()); // Get current user from Redux state
    if (!currentUser) {
      // This should ideally not happen if navigation guards are in place, but good for safety
      return rejectWithValue('User not authenticated.');
    }

    try {
      const habitsCollectionRef = collection(db, 'habits');
      // Add a new document with a generated ID
      const docRef = await addDoc(habitsCollectionRef, {
        ...habitData,
        userId: currentUser.uid,
        createdAt: Timestamp.now(), // Use Firestore server timestamp for consistency
        archived: false, // Default to not archived
      });
      // Return the newly created habit object, including its generated ID and server timestamp
      return { ...habitData, id: docRef.id, userId: currentUser.uid, createdAt: Timestamp.now(), archived: false };
    } catch (error: any) {
      // Handle potential Firestore errors
      const firestoreError = error as FirestoreError;
      console.error(`Firebase Firestore Error (${firestoreError.code}) creating habit:`, firestoreError.message);
      // Provide a user-friendly error message
      return rejectWithValue(firestoreError.message || 'Failed to create habit. Please check your connection and try again.');
    }
  }
);

// Thunk to fetch habits for the current user
// This thunk fetches the data once. For real-time updates, we use onSnapshot.
export const fetchHabits = createAsyncThunk<
  Habit[], // Return type: Array of Habits
  void,    // No arguments needed
  { rejectValue: string; state: RootState } 
>(
  'habits/fetchHabits',
  async (_, { rejectWithValue, getState }) => {
    const currentUser = selectCurrentUser(getState());
    if (!currentUser) {
      return rejectWithValue('User not authenticated.');
    }

    try {
      const habitsCollectionRef = collection(db, 'habits');
      // Query for habits belonging to the current user and not archived
      const q = query(
        habitsCollectionRef,
        where('userId', '==', currentUser.uid),
        where('archived', '==', false)
      ); // Add other filters if needed (e.g., for sorting)

      const querySnapshot = await getDocs(q);
      const habits: Habit[] = [];
      querySnapshot.forEach((doc) => {
        // Map Firestore document data to our Habit interface
        // Ensure data fields match the interface, especially Timestamps
        habits.push({
          id: doc.id,
          userId: doc.data().userId,
          name: doc.data().name,
          description: doc.data().description,
          frequency: doc.data().frequency,
          reminderTime: doc.data().reminderTime,
          createdAt: doc.data().createdAt,
          archived: doc.data().archived ?? false, // Provide default value
        });
      });
      return habits;
    } catch (error: any) {
       const firestoreError = error as FirestoreError;
      console.error(`Firebase Firestore Error (${firestoreError.code}) fetching habits:`, firestoreError.message);
      return rejectWithValue(firestoreError.message || 'Failed to fetch habits.');
    }
  }
);

// Thunk to set up a real-time listener for habits
// This will dispatch updates to the Redux store whenever habits change in Firestore
export const subscribeToHabits = createAsyncThunk<
  void, // No specific return value needed, updates are dispatched directly
  void,
  { rejectValue: string; state: RootState } 
>(
  'habits/subscribeToHabits',
  (_, {
    rejectWithValue,
    getState,
    dispatch
  }) => {
    const currentUser = selectCurrentUser(getState());
    if (!currentUser) {
      return rejectWithValue('User not authenticated.');
    }

    const habitsCollectionRef = collection(db, 'habits');
    const q = query(
      habitsCollectionRef,
      where('userId', '==', currentUser.uid),
      where('archived', '==', false)
    );

    // onSnapshot returns an unsubscribe function
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot) => {
      const updatedHabits: Habit[] = [];
      querySnapshot.forEach((doc) => {
         updatedHabits.push({
          id: doc.id,
          userId: doc.data().userId,
          name: doc.data().name,
          description: doc.data().description,
          frequency: doc.data().frequency,
          reminderTime: doc.data().reminderTime,
          createdAt: doc.data().createdAt,
          archived: doc.data().archived ?? false,
        });
      });
      // Dispatch the update action to the slice
      dispatch(setHabits(updatedHabits));
    }, (error) => {
       const firestoreError = error as FirestoreError;
      console.error(`Firebase Firestore Error (${firestoreError.code}) subscribing to habits:`, firestoreError.message);
      dispatch(setError(firestoreError.message || 'Failed to get real-time habit updates.'));
    });

    // We need a way to manage this unsubscribe function. Storing it in Redux or using a context
    // might be a better approach for lifecycle management. For now, we'll log it.
    console.log('Real-time habits subscription set up. Unsubscribe function available:', unsubscribe);
    // Return void, the updates are handled by the dispatched setHabits action.
    return;
  }
);

// --- Slice Definition ---
const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    // Action to set the habits array, used by the real-time listener
    setHabits: (state, action: PayloadAction<Habit[]>) => {
      state.habits = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    // Action to clear the error message
    clearHabitsError: (state) => {
      state.error = null;
    },
    // Action to set loading state
    setHabitsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Action to set an error message
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Create Habit ---
      .addCase(createHabit.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear error before new request
      })
      .addCase(createHabit.fulfilled, (state, action: PayloadAction<Habit>) => {
        // Optimistic update: add the new habit immediately to the list
        state.habits.push(action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createHabit.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create habit.';
      })

      // --- Fetch Habits (initial load) ---
      .addCase(fetchHabits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHabits.fulfilled, (state, action: PayloadAction<Habit[]>) => {
        state.isLoading = false;
        state.habits = action.payload;
        state.error = null;
      })
      .addCase(fetchHabits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch habits.';
      });
      // --- Subscribe to Habits (real-time updates) ---
      // The subscribeToHabits thunk directly dispatches setHabits and setError, 
      // so we don't need specific pending/fulfilled/rejected cases here for it.
      // The listener handles state updates via the dispatched actions.
  },
});

// Export synchronous actions
export const { setHabits, clearHabitsError, setHabitsLoading, setError } = habitsSlice.actions;

// Export the reducer
export default habitsSlice.reducer;
