import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Event, EventCategory } from '../../types/calendar';

interface CalendarState {
    events: Event[];
    categories: EventCategory[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: CalendarState = {
    events: [],
    categories: [],
    loading: 'idle',
    error: null,
};

// Async thunks for Calendar operations
export const fetchEvents = createAsyncThunk<Event[], void, { rejectValue: string }>
('calendar/fetchEvents', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get<Event[]>('/users/me/events'); 
        return response.data.map(event => ({
            ...event,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
            assignedTo: event.assignedTo,
            createdBy: event.createdBy,
            category: event.category,
        }));
    } catch (error: any) {
        console.error("API Error fetching events:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
    }
});

export const fetchCategories = createAsyncThunk<EventCategory[], void, { rejectValue: string }>
('calendar/fetchCategories', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get<EventCategory[]>('/calendar/categories'); 
        return response.data;
    } catch (error: any) {
         console.error("API Error fetching categories:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
});

interface CalendarEventInput {
    eventId?: string;
    title: string;
    description?: string;
    startTime: string; 
    endTime: string;
    location?: string;
    assignedToId?: string | null;
    eventCategoryId?: string | null;
    isRecurring?: boolean;
    recurrenceRule?: string | null;
    recurringEndDate?: string | null;
}

export const createEvent = createAsyncThunk<Event, CalendarEventInput, { rejectValue: string }>
('calendar/createEvent', async (eventData, { rejectWithValue }) => {
    try {
        const response = await api.post<Event>('/calendar/events', eventData);
         return {
            ...response.data,
            startTime: new Date(response.data.startTime),
            endTime: new Date(response.data.endTime),
        };
    } catch (error: any) {
        console.error("API Error creating event:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to create event');
    }
});

export const updateEvent = createAsyncThunk<Event, CalendarEventInput, { rejectValue: string }>
('calendar/updateEvent', async (eventData, { rejectWithValue }) => {
    if (!eventData.eventId) {
        return rejectWithValue('Event ID is required for update');
    }
    try {
        const response = await api.put<Event>(`/calendar/events/${eventData.eventId}`, eventData);
         return {
            ...response.data,
            startTime: new Date(response.data.startTime),
            endTime: new Date(response.data.endTime),
        };
    } catch (error: any) {
         console.error("API Error updating event:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to update event');
    }
});

export const deleteEvent = createAsyncThunk<string, string, { rejectValue: string }>
('calendar/deleteEvent', async (eventId, { rejectWithValue }) => {
    try {
        await api.delete(`/calendar/events/${eventId}`);
        return eventId;
    } catch (error: any) {
         console.error("API Error deleting event:", error);
        return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
    }
});


const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
       
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchEvents.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
                state.loading = 'succeeded';
                state.events = action.payload;
            })
            .addCase(fetchEvents.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || 'Failed to load events';
            })
            .addCase(fetchCategories.pending, (state) => {
                 state.loading = 'pending'; 
                 state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<EventCategory[]>) => {
                 state.loading = 'succeeded';
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload || 'Failed to load categories';
            })
            .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
                state.events.push(action.payload);
            })
            .addCase(createEvent.rejected, (state, action) => {
                state.error = action.payload || 'Failed to create event';
            })
            .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
                const index = state.events.findIndex(e => e.eventId === action.payload.eventId);
                if (index !== -1) {
                    state.events[index] = action.payload;
                }
            })
            .addCase(updateEvent.rejected, (state, action) => {
                state.error = action.payload || 'Failed to update event';
            })
            .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
                state.events = state.events.filter(e => e.eventId !== action.payload);
            })
            .addCase(deleteEvent.rejected, (state, action) => {
                state.error = action.payload || 'Failed to delete event';
            });
    },
});

export default calendarSlice.reducer;
