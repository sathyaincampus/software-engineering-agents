import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Select the entire habits slice state from the root state
const selectHabitsState = (state: RootState) => state.habits;

// Selector to get the array of habits
export const selectHabits = createSelector(
  selectHabitsState,
  (habitsState) => habitsState.habits
);

// Selector to determine if habits data is currently being loaded (for initial fetch)
export const selectIsHabitsLoading = createSelector(
  selectHabitsState,
  (habitsState) => habitsState.isLoading
);

// Selector to retrieve any error messages related to habits operations
export const selectHabitsError = createSelector(
  selectHabitsState,
  (habitsState) => habitsState.error
);
