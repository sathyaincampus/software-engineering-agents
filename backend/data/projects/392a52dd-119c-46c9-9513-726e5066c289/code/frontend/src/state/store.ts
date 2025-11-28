import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import eventsReducer from './eventsSlice';
import tasksReducer from './tasksSlice';
import rewardsReducer from './rewardsSlice';
import categoriesReducer from './categoriesSlice';
import taskCategoriesReducer from './taskCategoriesSlice';
import familyMembersReducer from './familyMembersSlice';
import messagesReducer from './messagesSlice'; // Import messages reducer
import analyticsReducer from './analyticsSlice'; // Import analytics reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    events: eventsReducer,
    tasks: tasksReducer,
    rewards: rewardsReducer,
    categories: categoriesReducer,
    taskCategories: taskCategoriesReducer,
    familyMembers: familyMembersReducer,
    messages: messagesReducer, // Add messages reducer
    analytics: analyticsReducer, // Add analytics reducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
