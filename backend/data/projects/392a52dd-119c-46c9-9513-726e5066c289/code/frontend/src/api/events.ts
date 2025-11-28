import api from './api';
import { Event, EventCreate, EventUpdate } from '../types/events';
import { UUID } from '../types/common';

export const fetchEvents = async (familyId: UUID): Promise<Event[]> => {
  try {
    const response = await api.get(`/v1/events?family_id=${familyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const fetchEventById = async (eventId: UUID): Promise<Event> => {
  try {
    const response = await api.get(`/v1/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    throw error;
  }
};

export const createEvent = async (eventData: EventCreate): Promise<Event> => {
  try {
    const response = await api.post('/v1/events', eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId: UUID, eventData: EventUpdate): Promise<Event> => {
  try {
    const response = await api.put(`/v1/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: UUID): Promise<void> => {
  try {
    await api.delete(`/v1/events/${eventId}`);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};
