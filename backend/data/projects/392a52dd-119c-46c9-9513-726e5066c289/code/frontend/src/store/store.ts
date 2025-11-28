import { configureStore, combineReducers, Action } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';

import authReducer, { AuthState } from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice'; 
import calendarReducer from './slices/calendarSlice';
import profileReducer, { ProfileState } from './slices/profileSlice'; 
import tasksReducer, { TasksState } from './slices/tasksSlice'; 

export interface AppState {
    auth: AuthState;
    dashboard: DashboardState;
    calendar: CalendarState;
    profile: ProfileState; 
    tasks: TasksState; 
}

const authPersistConfig = {
    key: 'auth',
    storage: AsyncStorage,
    whitelist: ['token', 'user'], 
};

const rootReducer = combineReducers<AppState>({
    auth: persistReducer<AuthState>(authPersistConfig, authReducer),
    dashboard: dashboardReducer,
    calendar: calendarReducer,
    profile: profileReducer, 
    tasks: tasksReducer, 
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, 
        }),
});

export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ExtraArg = {}> = ThunkAction<void, RootState, ExtraArg, Action<string>>;

export default {
    store,
    persistor,
};
