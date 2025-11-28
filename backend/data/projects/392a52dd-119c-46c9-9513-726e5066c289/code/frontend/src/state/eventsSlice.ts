import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as eventService from '../api/events';
import * as categoryService from '../api/categories'; // Import categories API
import { Event, EventCreate, EventUpdate } from '../types/events';
import { CustomCategory } from '../types/categories';
import { UUID } from '../types/common';

interface EventsState {
  items: Event[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  selectedEvent: Event | null;
  categories: CustomCategory[]; // Store categories here to avoid separate fetches
}

const initialState: EventsState = {
  items: [],
  loading: 'idle',
  error: null,
  selectedEvent: null,
  categories: [],
};

export const fetchEvents = createAsyncThunk<Event[], UUID>(
  'events/fetchEvents',
  async (familyId, { rejectWithValue }) => {
    try {
      const data = await eventService.fetchEvents(familyId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch events');
    }
  }
);

export const fetchEventById = createAsyncThunk<Event, UUID>(
  'events/fetchEventById',
  async (eventId, { rejectWithValue }) => {
    try {
      const data = await eventService.fetchEventById(eventId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch event');
    }
  }
);

export const addEvent = createAsyncThunk<Event, EventCreate>(
  'events/addEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const data = await eventService.createEvent(eventData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add event');
    }
  }
);

export const updateEvent = createAsyncThunk<Event, { eventId: UUID; eventData: EventUpdate }>(
  'events/updateEvent',
  async ({ eventId, eventData }, { rejectWithValue }) => {
    try {
      const data = await eventService.updateEvent(eventId, eventData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk<void, UUID>(
  'events/deleteEvent',
  async (eventId, { rejectWithValue }) => {
    try {
      await eventService.deleteEvent(eventId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete event');
    }
  }
);

// Async thunk to fetch categories specific for events
export const fetchEventCategories = createAsyncThunk<CustomCategory[], UUID>(
  'events/fetchEventCategories',
  async (familyId, { rejectWithValue }) => {
    try {
      const data = await categoryService.fetchCategories(familyId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch event categories');
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    resetEvents: (state) => {
      state.items = [];
      state.loading = 'idle';
      state.error = null;
      state.selectedEvent = null;
    },
    selectEvent: (state, action: PayloadAction<Event | null>) => {
      state.selectedEvent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.loading = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchEventById.fulfilled, (state, action: PayloadAction<Event>) => {
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(addEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.items.push(action.payload);
      })
      .addCase(addEvent.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        const index = state.items.findIndex(event => event.event_id === action.payload.event_id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // Also update selectedEvent if it's the one being updated
        if (state.selectedEvent?.event_id === action.payload.event_id) {
          state.selectedEvent = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<void, string, { rejectedValue: string }>) => {
        state.items = state.items.filter(event => event.event_id !== action.meta.arg);
        if (state.selectedEvent?.event_id === action.meta.arg) {
          state.selectedEvent = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Handling categories fetch within events slice
      .addCase(fetchEventCategories.pending, (state) => {
        state.loading = 'pending'; // Use general loading state if needed
      })
      .addCase(fetchEventCategories.fulfilled, (state, action: PayloadAction<CustomCategory[]>) => {
        state.categories = action.payload;
      })
      .addCase(fetchEventCategories.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { resetEvents, selectEvent } = eventsSlice.actions;

export default eventsSlice.reducer;
