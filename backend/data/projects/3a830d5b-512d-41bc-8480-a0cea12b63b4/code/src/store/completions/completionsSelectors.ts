import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { CompletionRecord } from './completionsTypes'; // Import type definition

// Select the entire completions slice state
const selectCompletionsState = (state: RootState) => state.completions;

// Selector for the map of completion statuses
export const selectCompletionStatusMap = createSelector(
  selectCompletionsState,
  (completionsState) => completionsState.statusMap
);

// Selector to check if completion data is currently being loaded
export const selectIsCompletionLoading = createSelector(
  selectCompletionsState,
  (completionsState) => completionsState.isLoading
);

// Selector to get any errors related to completion operations
export const selectCompletionsError = createSelector(
  selectCompletionsState,
  (completionsState) => completionsState.error
);
