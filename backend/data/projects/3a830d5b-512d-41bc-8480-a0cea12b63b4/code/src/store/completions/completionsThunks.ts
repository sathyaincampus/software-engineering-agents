/*
  This file re-exports the async thunks defined in completionsSlice.ts.
  This centralizes the asynchronous operations related to habit completion records.
*/

export {
  createCompletionRecord,
  deleteCompletionRecord,
  fetchCompletionRecordsForHabits,
  clearCompletionsError, // Re-export clear error action
} from './completionsSlice';
