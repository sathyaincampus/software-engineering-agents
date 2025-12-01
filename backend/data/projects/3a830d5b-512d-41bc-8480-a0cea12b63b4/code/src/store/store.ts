import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
// Import other reducers here as needed
// import habitsReducer from './habits/habitsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // habits: habitsReducer, // Example: uncomment when habits slice is created
    // Add other reducers here
  },
  // Middleware configuration (optional)
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiMiddleware), // e.g., for RTK Query
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
