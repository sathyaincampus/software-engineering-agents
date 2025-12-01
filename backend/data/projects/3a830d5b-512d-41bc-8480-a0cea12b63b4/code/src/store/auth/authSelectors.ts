import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Select the entire auth slice state
const selectAuthState = (state: RootState) => state.auth;

// Selector for the currently logged-in user
export const selectCurrentUser = createSelector(
  selectAuthState,
  (auth) => auth.user // The user object from Firebase Auth or null
);

// Selector to check if the authentication state is currently being loaded (e.g., on app startup)
export const selectIsAuthLoading = createSelector(
  selectAuthState,
  (auth) => auth.isLoading
);

// Selector for any authentication-related errors
export const selectAuthError = createSelector(
  selectAuthState,
  (auth) => auth.error // The error message string or null
);

// Selector to determine if the user is currently authenticated
export const selectIsAuthenticated = createSelector(
  selectCurrentUser,
  (user) => !!user // Returns true if user is not null/undefined, false otherwise
);
