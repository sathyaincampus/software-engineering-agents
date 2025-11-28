import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import familyReducer from './family/familySlice';
import tasksReducer from './tasks/tasksSlice';
import rewardsReducer from './rewards/rewardsSlice';
import userPointsReducer from './userPoints/userPointsSlice';
import calendarReducer from './calendar/calendarSlice'; // Assuming calendar slice exists

export const store = configureStore({
  reducer: {
    auth: authReducer,
    family: familyReducer,
    tasks: tasksReducer,
    rewards: rewardsReducer,
    userPoints: userPointsReducer,
    calendar: calendarReducer,
    // Add other reducers here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
