import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, User, AuthError } from 'firebase/auth';
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';

import { auth, db } from '../../config/firebase'; // Assuming you have firebase config initialized
import { AppDispatch } from '../store';

// --- Interfaces ---
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// --- Initial State ---
const initialState: AuthState = {
  user: null,
  isLoading: true, // Start as true to show initial loading state
  error: null,
};

// --- Async Thunks ---
export const bootstrapAuth = createAsyncThunk<
  User | null,
  void,
  { dispatch: AppDispatch } // Type for extra argument 'dispatch'
>(
  'auth/bootstrapAuth',
  async (_, { dispatch }) => {
    return new Promise((resolve) => {
      // `onAuthStateChanged` is a listener that returns the current user or null.
      // It's crucial for handling session persistence and real-time auth state changes.
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // Optionally, fetch additional user data from Firestore if needed for the app's state.
          // For now, we'll just resolve with the Firebase User object.
          // Example: Fetching user profile data
          // try {
          //   const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          //   if (userDoc.exists()) {
          //     const userData = userDoc.data();
          //     // You might want to store this userData along with the user object
          //     // or in a separate slice if it's complex.
          //   }
          // } catch (error) { console.error('Error fetching user data:', error); }
          
          resolve(firebaseUser);
        } else {
          resolve(null);
        }
        // Important: Unsubscribe the listener once we have the initial state.
        // Otherwise, it keeps listening and can cause memory leaks or unexpected behavior.
        unsubscribe(); 
      });
    });
  }
);

export const registerUser = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string } // Specify rejectValue type for error handling
>(
  'auth/registerUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // 1. Create user with email and password using Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Optionally, save additional user data to Firestore upon successful registration
      // We use the user's UID from Firebase Auth as the document ID in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
        // Add any other profile fields here, e.g., displayName, preferences, etc.
      });

      // Return the Firebase User object upon success
      return user;
    } catch (error: any) {
      // Firebase Auth errors often have a 'code' and 'message' property
      console.error("Firebase Auth Error during registration:", error);
      // Return a specific error message to be caught by the rejected case in extraReducers
      return rejectWithValue(error.message || 'An error occurred during registration.');
    }
  }
);

export const loginUser = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string } 
>(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Sign in the user using Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Return the Firebase User object upon successful login
      return userCredential.user;
    } catch (error: any) {
      // Handle known Firebase Auth error codes for better feedback
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
         errorMessage = 'Too many login attempts. Please try again later.';
      }
      console.error(`Firebase Auth Error during login (${error.code}):`, error);
      // Return the processed error message
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string } 
>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Sign the user out using Firebase Authentication
      await signOut(auth);
      // No data to return on successful logout, just resolve.
    } catch (error: any) {
      console.error("Firebase Auth Error during logout:", error);
      return rejectWithValue(error.message || 'An error occurred during logout.');
    }
  }
);

export const sendPasswordResetEmail = createAsyncThunk<
  void,
  string,
  { rejectValue: string } 
>(
  'auth/sendPasswordResetEmail',
  async (email, { rejectWithValue }) => {
    try {
      // Send password reset email using Firebase Authentication
      await sendPasswordResetEmail(auth, email);
      // No data to return on success, just resolve.
    } catch (error: any) {
      console.error("Firebase Auth Error sending reset email:", error);
      return rejectWithValue(error.message || 'An error occurred while sending the reset email.');
    }
  }
);

// --- Slice Definition ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer to clear the authentication error message.
    // Useful for clearing errors when the user navigates away or dismisses an alert.
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Bootstrap Auth --- 
      // Handles the initial check when the app loads
      .addCase(bootstrapAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload; // Payload is User | null
        state.error = null;
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        state.isLoading = false;
        // Use action.error.message if available, otherwise fallback
        state.error = action.error.message || 'Failed to load authentication status.';
      })

      // --- Register User ---
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear previous errors on new attempt
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        // action.payload contains the rejectValue (error message)
        state.error = action.payload || 'Registration failed.'; 
      })

      // --- Login User ---
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null; // Clear error on new login attempt
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        // action.payload contains the rejectValue (error message)
        state.error = action.payload || 'Login failed.';
      })

      // --- Logout User ---
      .addCase(logoutUser.pending, (state) => {
        // Optional: set loading true if you want to show a spinner during logout
        // state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Logout failed.';
      });
  },
});

// Export the clearAuthError reducer action
export const { clearAuthError } = authSlice.actions;
// Export the reducer itself
export default authSlice.reducer;
