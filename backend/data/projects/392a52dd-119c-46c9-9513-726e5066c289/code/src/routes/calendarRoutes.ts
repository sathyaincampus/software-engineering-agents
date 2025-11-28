import express from 'express';
import {
  connectGoogleCalendar,
  googleCalendarCallback,
  syncToGoogleCalendar,
  getCalendarEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/calendarController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Google Calendar OAuth Flow
router.get('/google/connect', protect, connectGoogleCalendar);
router.get('/google/callback', googleCalendarCallback);

// Syncing logic
router.post('/sync-to-google', protect, syncToGoogleCalendar); // Parent triggers sync from FF to Google
// Consider an endpoint to trigger sync FROM Google to FF if needed, or handle via webhooks/background jobs.

// CRUD operations for FamilyFlow events
router.route('/events')
  .get(protect, getCalendarEvents) // Get events for the family
  .post(protect, authorize('parent'), createEvent); // Parents create events

router.route('/events/:id')
  .put(protect, authorize('parent'), updateEvent) // Parents update events (or assigned child might update status/details)
  .delete(protect, authorize('parent'), deleteEvent); // Parents delete events (or assigned child if it's their task/event)

// Fetching a single event might be handled by the getCalendarEvents route with filtering, 
// or a dedicated getEventById route could be added if needed.

export default router;
