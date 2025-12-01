import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, Timestamp, FirestoreError, getFirestore, orderBy } from 'firebase/firestore';

import { db } from '../../config/firebase';
import { auth } from '../../config/firebase';
import { AppDispatch, RootState } from '../store';
import { selectCurrentUser } from '../auth';

// --- Interfaces ---

// Represents a single completion record for a habit on a specific date
export interface CompletionRecord {
  completionId?: string; // Firestore document ID
  userId: string;
  habitId: string;
  completionDate: string; // Format: 'yyyy-MM-dd'
  recordedAt: Timestamp;
}

// Structure to hold completion status, keyed by habit ID and then date
interface CompletionStatusMap {
  [habitId: string]: {
    [date: string]: boolean;
  };
}

// State for managing completion records
interface CompletionsState {
  statusMap: CompletionStatusMap;
  isLoading: boolean;
  error: string | null;
}

// --- Initial State ---
const initialState: CompletionsState = {
  statusMap: {}, // Initialize as empty object
  isLoading: false,
  error: null,
};

// --- Async Thunks ---

// Thunk to create a new completion record
export const createCompletionRecord = createAsyncThunk<
  CompletionRecord, // Return type on success
  Omit<CompletionRecord, 'completionId' | 'userId' | 'recordedAt'>, // Input type (data for new record)
  { rejectValue: string; state: RootState } 
>(
  'completions/createCompletionRecord',
  async (completionData, { rejectWithValue, getState }) => {
    const currentUser = selectCurrentUser(getState());
    if (!currentUser) {
      return rejectWithValue('User not authenticated.');
    }

    try {
      const completionsCollectionRef = collection(db, 'habitCompletions');
      const docRef = await addDoc(completionsCollectionRef, {
        ...completionData,
        userId: currentUser.uid,
        recordedAt: Timestamp.now(),
      });
      // Return the created record with its ID
      return { ...completionData, completionId: docRef.id, userId: currentUser.uid, recordedAt: Timestamp.now() };
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      console.error(`Firebase Firestore Error (${firestoreError.code}) creating completion:`, firestoreError.message);
      return rejectWithValue(firestoreError.message || 'Failed to record completion.');
    }
  }
);

// Thunk to delete a completion record (e.g., when undoing a completion)
export const deleteCompletionRecord = createAsyncThunk<
  void, // Return type: void on success
  { habitId: string; date: string }, // Input: Identify the record to delete
  { rejectValue: string; state: RootState } 
>(
  'completions/deleteCompletionRecord',
  async ({ habitId, date }, { rejectWithValue, getState }) => {
    const currentUser = selectCurrentUser(getState());
    if (!currentUser) {
      return rejectWithValue('User not authenticated.');
    }

    try {
      // Construct the query to find the specific completion record
      const completionsCollectionRef = collection(db, 'habitCompletions');
      const q = query(
        completionsCollectionRef,
        where('userId', '==', currentUser.uid),
        where('habitId', '==', habitId),
        where('completionDate', '==', date)
        // Might need to add orderBy('recordedAt', 'desc').limit(1) if multiple entries per day are possible and we want the latest
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Assuming only one record per habit per day, get the first one
        const completionDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, 'habitCompletions', completionDoc.id));
      } else {
        // Record not found, maybe it was already deleted or never existed
        console.warn(`Completion record not found for habit ${habitId} on ${date}`);
      }
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      console.error(`Firebase Firestore Error (${firestoreError.code}) deleting completion:`, firestoreError.message);
      return rejectWithValue(firestoreError.message || 'Failed to delete completion record.');
    }
  }
);

// Thunk to fetch completion records for a list of habits on a specific date
export const fetchCompletionRecordsForHabits = createAsyncThunk<
  CompletionStatusMap, // Return type: Map of completion statuses
  { date: string }, // Input: Date for which to fetch records
  { rejectValue: string; state: RootState } 
>(
  'completions/fetchCompletionRecordsForHabits',
  async ({ date }, { rejectWithValue, getState }) => {
    const currentUser = selectCurrentUser(getState());
    const habits = selectHabits(getState()); // Get the current list of habits

    if (!currentUser) {
      return rejectWithValue('User not authenticated.');
    }
    if (habits.length === 0) {
      return {}; // No habits to fetch completions for
    }

    const habitIds = habits.map(habit => habit.id).filter(id => id != null) as string[];

    try {
      const completionsCollectionRef = collection(db, 'habitCompletions');
      // Query for completion records for the current user, for the specified date, and for the relevant habits
      const q = query(
        completionsCollectionRef,
        where('userId', '==', currentUser.uid),
        where('completionDate', '==', date),
        where('habitId', 'in', habitIds), // Filter by habit IDs
        orderBy('recordedAt', 'desc') // Get the most recent record if duplicates exist
      );

      const querySnapshot = await getDocs(q);
      const statusMap: CompletionStatusMap = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data() as CompletionRecord;
        const habitId = data.habitId;
        // Mark the habit as completed for this date
        if (habitId && !statusMap[habitId]) { // Ensure we only record one completion per habit per day
          statusMap[habitId] = { [date]: true };
        }
      });

      return statusMap;
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      console.error(`Firebase Firestore Error (${firestoreError.code}) fetching completions for ${date}:`, firestoreError.message);
      return rejectWithValue(firestoreError.message || `Failed to fetch completions for ${date}.`);
    }
  }
);

// --- Slice Definition ---
const completionsSlice = createSlice({
  name: 'completions',
  initialState,
  reducers: {
    // Action to update the status map, typically used by the real-time listener or fetch thunks
    setCompletionStatusMap: (state, action: PayloadAction<CompletionStatusMap>) => {
      state.statusMap = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    // Clear the error message
    clearCompletionsError: (state) => {
      state.error = null;
    },
    // Set loading state explicitly if needed
    setCompletionsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Set an error message
    setCompletionsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Create Completion Record ---
      .addCase(createCompletionRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCompletionRecord.fulfilled, (state, action: PayloadAction<CompletionRecord>) => {
        const { habitId, completionDate } = action.payload;
        // Update the status map optimistically
        if (!state.statusMap[habitId]) {
          state.statusMap[habitId] = {};
        }
        state.statusMap[habitId][completionDate] = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(createCompletionRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to mark habit as complete.';
      })

      // --- Delete Completion Record ---
      .addCase(deleteCompletionRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCompletionRecord.fulfilled, (state, action) => {
        // The payload is void, so we rely on the fact that the deletion was successful.
        // The real-time listener (if active for completions) would update the state. 
        // If not using listeners for completions, we might need to manually update state here.
        // For now, assume the listener or subsequent fetch will handle it.
        state.isLoading = false;
        state.error = null;
      })
      .addCase(deleteCompletionRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to mark habit as incomplete.';
      })

      // --- Fetch Completion Records ---
      .addCase(fetchCompletionRecordsForHabits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompletionRecordsForHabits.fulfilled, (state, action: PayloadAction<CompletionStatusMap>) => {
        // Replace the current status map with the fetched data
        state.statusMap = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCompletionRecordsForHabits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch completion records.';
      });
  },
});

// Export synchronous actions
export const { setCompletionStatusMap, clearCompletionsError, setCompletionsLoading, setError } = completionsSlice.actions;

// Export the reducer
export default completionsSlice.reducer;
