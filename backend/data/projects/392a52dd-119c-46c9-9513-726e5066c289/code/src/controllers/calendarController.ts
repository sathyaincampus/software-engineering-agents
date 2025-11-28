import { Request, Response, NextFunction } from 'express';
import Event from '../models/Event';
import User from '../models/User';
import { Op, literal } from 'sequelize';
import { sequelize } from '../config/database';
import { google, calendar_v3 } from 'googleapis'; // Google Calendar API types
import UserAuth from '../models/UserAuth'; // Assuming a model to store external tokens

// Mock OAuth Client setup - replace with actual Google Cloud project credentials
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/calendar/google/callback' // Ensure this matches your registered redirect URI
);

// Helper to get family_id from JWT token
const getFamilyIdFromToken = (req: Request): string | null => {
  return (req as any).user?.familyId || null;
};

// @desc    Initiate Google Calendar OAuth flow
// @route   GET /api/v1/calendar/google/connect
// @access  Private (Parent)
export const connectGoogleCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = (req as any).user?.userId;
  const familyId = getFamilyIdFromToken(req);

  if (!userId || !familyId) {
    return res.status(400).json({ message: 'User or Family ID not found. Ensure authentication.' });
  }

  try {
    // Define the scopes needed for calendar access
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({ userId, familyId }), // Pass necessary state data
      prompt: 'consent', // Force consent screen for new connections
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google Calendar connection:', error);
    res.status(500).json({ message: 'Server Error initiating Google Calendar connection.' });
  }
};

// @desc    Handle Google Calendar OAuth callback
// @route   GET /api/v1/calendar/google/callback
// @access  Public (Callback from Google)
export const googleCalendarCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('Google OAuth Error:', error);
    // Redirect to an error page or show a message
    return res.status(400).send('Google Calendar connection failed.');
  }

  if (!code || !state) {
    return res.status(400).send('Invalid callback parameters.');
  }

  try {
    const { userId, familyId } = JSON.parse(state as string);

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens); // Set credentials for subsequent API calls

    // Store the access token and refresh token associated with the user and family
    // This requires a UserAuth model or similar to store external credentials.
    // Example: Find or create user auth record
    await UserAuth.upsert({
      user_id: userId,
      provider: 'google_calendar',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: JSON.stringify(oauth2Client. பெறScope())
    });
    
    // Optionally, fetch events immediately after successful connection
    // This needs the access token, which is already set on oauth2Client if token exchange was successful
    await syncGoogleCalendarEvents(userId, familyId, tokens.access_token);

    // Redirect user to a success page or the main app screen
    // IMPORTANT: For React Native, you'll typically handle this redirect via deep linking or by returning success data
    // and letting the app navigate. Directly redirecting the mobile app's WebView might be tricky.
    // For now, sending a success response.
    res.status(200).send(
      '<html><body><h1>Google Calendar Connected!</h1><p>You can close this window.</p></body></html>'
    );

  } catch (error) {
    console.error('Error processing Google Calendar callback:', error);
    res.status(500).send('Server Error processing Google Calendar callback.');
  }
};

// Helper function to fetch events from Google Calendar
const syncGoogleCalendarEvents = async (userId: string, familyId: string, accessToken: string | null): Promise<void> => {
  if (!accessToken) {
    console.warn('No access token available for Google Calendar sync.');
    return;
  }

  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // Fetch events (e.g., for the next 7 days)
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(now.getDate() + 7);

    const response = await calendar.events.list({
      calendarId: 'primary', // 'primary' refers to the user's primary calendar
      timeMin: now.toISOString(),
      timeMax: sevenDaysLater.toISOString(),
      maxResults: 50, // Adjust as needed
      singleEvents: true, // Expand recurring events into instances
      orderBy: 'startTime',
    });

    const googleEvents = response.data.items;

    if (!googleEvents || googleEvents.length === 0) {
      console.log('No upcoming Google Calendar events found.');
      return;
    }

    // Process and sync events with FamilyFlow's database
    // This involves mapping Google Event structure to FamilyFlow Event structure
    // and handling potential duplicates or updates.

    // Example: Process each event
    for (const event of googleEvents) {
      if (!event.summary || !event.start?.dateTime || !event.end?.dateTime) {
        console.warn('Skipping incomplete Google event:', event.summary);
        continue;
      }

      const newEventData = {
        family_id: familyId,
        title: event.summary,
        description: event.description || null,
        start_time: new Date(event.start.dateTime),
        end_time: new Date(event.end.dateTime),
        assigned_to: null, // Need to map Google event attendees to FamilyFlow users if possible
        created_by: userId, // Link to the user who connected the calendar
        event_category_id: null, // Map to existing categories or create new ones
        location: event.location || null,
        // Handle recurrence: Google API provides recurrence rules
        is_recurring: event.recurrence ? true : false,
        recurrence_rule: event.recurrence ? event.recurrence.join(',') : null,
        // Add other relevant fields like original_event_id for tracking changes
      };
      
      // Check if event already exists (e.g., by Google Event ID or time/title combination)
      // If exists, update. If not, create.
      // This requires storing Google Event ID in FamilyFlow events table.
      
      // For simplicity, let's just create if not found, without complex duplicate checking for now.
      const existingEvent = await Event.findOne({
          where: { google_event_id: event.id } // Assuming 'google_event_id' column exists
      });
      
      if (!existingEvent) {
          await Event.create({ ...newEventData, google_event_id: event.id }); // Add google_event_id column to Event model
      } else {
          // Logic to update existing event if necessary
      }
    }

    console.log(`Synced ${googleEvents.length} events from Google Calendar.`);

  } catch (error) {
    console.error('Error fetching/syncing Google Calendar events:', error);
    // Handle potential token expiration issues here
    // Example: Check if error is due to invalid credentials / expired token
    if (error.response?.status === 401 || error.message.includes('invalid_grant')) {
        console.log('Google Calendar API returned 401 or invalid_grant - Token might be expired or invalid. Attempting refresh...');
        // Implement token refresh logic here if refresh token is available
        // Need to get the refresh token from UserAuth table based on userId
        const userAuth = await UserAuth.findOne({ where: { user_id: userId, provider: 'google_calendar' }});
        if (userAuth && userAuth.refresh_token) {
            try {
                const refreshResponse = await oauth2Client.refreshToken(userAuth.refresh_token);
                const newTokens = refreshResponse.credentials;
                oauth2Client.setCredentials(newTokens);
                // Update stored tokens
                await UserAuth.update({
                    access_token: newTokens.access_token,
                    refresh_token: newTokens.refresh_token || userAuth.refresh_token, // Keep old refresh token if new one not provided
                    expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
                }, {
                    where: { user_id: userId, provider: 'google_calendar' },
                });
                // Retry the original API call with the new access token
                await syncGoogleCalendarEvents(userId, familyId, newTokens.access_token);
            } catch (refreshError) {
                console.error('Failed to refresh Google token:', refreshError);
                // Handle cases where refresh token is also invalid/revoked
            }
        } else {
            console.error('No refresh token found for user, cannot refresh Google token.');
            // Prompt user to reconnect their Google Calendar
        }
    } else {
        console.error('Unexpected error during Google Calendar sync:', error);
    }
  }
};

// @desc    Fetch events from FamilyFlow and push to Google Calendar
// @route   POST /api/v1/calendar/sync-to-google
// @access  Private (Parent)
export const syncToGoogleCalendar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = (req as any).user?.userId;
  const familyId = getFamilyIdFromToken(req);

  if (!userId || !familyId) {
    return res.status(400).json({ message: 'User or Family ID not found.' });
  }

  try {
    // Get user's stored Google Calendar credentials
    const userAuth = await UserAuth.findOne({
      where: { user_id: userId, provider: 'google_calendar' },
    });

    if (!userAuth || !userAuth.access_token) {
      return res.status(400).json({ message: 'Google Calendar not connected or token missing. Please connect first.' });
    }
    
    // Refresh token if expired (requires implementing the refresh logic)
    // Check expiry and refresh if needed before setting credentials
    if (userAuth.expires_at && new Date(userAuth.expires_at) < new Date()) {
        console.log('Access token expired, attempting to refresh...');
        if (userAuth.refresh_token) {
            try {
                const refreshResponse = await oauth2Client.refreshToken(userAuth.refresh_token);
                const newTokens = refreshResponse.credentials;
                oauth2Client.setCredentials(newTokens);
                
                // Update stored tokens
                await UserAuth.update({
                    access_token: newTokens.access_token,
                    refresh_token: newTokens.refresh_token || userAuth.refresh_token, 
                    expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
                }, {
                    where: { user_id: userId, provider: 'google_calendar' },
                });
                console.log('Token refreshed successfully.');
            } catch (refreshError) {
                console.error('Failed to refresh Google token:', refreshError);
                // Handle cases where refresh token is also invalid/revoked
                return res.status(401).json({ message: 'Failed to refresh Google token. Please reconnect your calendar.' });
            }
        } else {
            console.error('No refresh token found for user, cannot refresh Google token.');
            return res.status(401).json({ message: 'Google token expired and no refresh token available. Please reconnect your calendar.' });
        }
    } else {
      // Set credentials if token is not expired
      oauth2Client.setCredentials({ 
        access_token: userAuth.access_token,
        refresh_token: userAuth.refresh_token,
        expiry: userAuth.expires_at ? new Date(userAuth.expires_at).getTime() : undefined
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch FamilyFlow events that need to be synced (e.g., new events created since last sync, or all events if first sync)
    // This logic requires tracking which events have been synced to Google.
    // For now, let's fetch recent events from FamilyFlow.
    const ffEvents = await Event.findAll({
      where: {
        family_id: familyId,
        google_event_id: null, // Fetch events not yet synced to Google
        // Optionally add date range filters if only syncing recent events
      },
      include: [
        { model: User, as: 'assignedUser', attributes: ['user_id', 'display_name', 'email'] }, // for assigned_to name and email
        { model: User, as: 'creatorUser', attributes: ['user_id', 'display_name'] }, // for created_by name
      ],
      limit: 50, // Limit for batch processing
      order: [['created_at', 'DESC']],
    });

    if (ffEvents.length === 0) {
      return res.status(200).json({ message: 'No new FamilyFlow events to sync to Google Calendar.' });
    }

    // Map FamilyFlow events to Google Calendar event format and insert them
    const syncPromises = ffEvents.map(async (event) => {
      const googleEventBody: calendar_v3.Schema$Event = {
        summary: event.title,
        description: event.description || `FamilyFlow Event: ${event.title}`, // Add more details if available
        start: {
          dateTime: event.start_time.toISOString(),
          // Timezone is crucial for Google Calendar. Get it from user profile or default.
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, 
        },
        end: {
          dateTime: event.end_time.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: event.location || undefined,
        recurrence: event.recurrence_rule ? [event.recurrence_rule] : undefined,
        // Attendees can potentially be mapped to Google Calendar attendees if email is available
        attendees: event.assigned_to && event.assignedUser?.email ?
                   [{ email: event.assignedUser.email, displayName: event.assignedUser.display_name || undefined }] :
                   undefined,
        extendedProperties: {
          private: {
            familyFlowEventId: event.event_id, // Store FF event ID for future updates/deletions
          }
        }
      };

      try {
        const createdEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: googleEventBody,
        });
        
        // Update FamilyFlow event with the Google Event ID after successful insertion
        await Event.update(
          { google_event_id: createdEvent.data.id },
          { where: { event_id: event.event_id } }
        );
        return { success: true, ffEventId: event.event_id, googleEventId: createdEvent.data.id };
      } catch (insertError) {
        console.error(`Error inserting event ${event.event_id} into Google Calendar:`, insertError);
        // Handle specific errors, e.g., invalid recurrence rule, bad request
        return { success: false, ffEventId: event.event_id, error: insertError.message };
      }
    });

    const results = await Promise.all(syncPromises);
    const successfulSyncs = results.filter(r => r.success).length;

    res.status(200).json({
      message: `Successfully synced ${successfulSyncs} out of ${ffEvents.length} events to Google Calendar.`,
      results,
    });

  } catch (error) {
    console.error('Error syncing to Google Calendar:', error);
    res.status(500).json({ message: 'Server Error during Google Calendar sync.' });
  }
};

// @desc    Get FamilyFlow events (potentially including synced Google events)
// @route   GET /api/v1/calendar/events
// @access  Private
export const getCalendarEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const familyId = getFamilyIdFromToken(req);
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    
    if (!familyId) {
      return res.status(400).json({ message: 'Family ID not found.' });
    }

    // Fetch FamilyFlow events for the family
    const ffEvents = await Event.findAll({
      where: {
        family_id: familyId,
        // Optionally filter events based on user role and assignment
        // If child, only show events assigned to them or all if that's the design
        // If parent, show all for the family
      },
      // Optionally include assigned user details
      include: [
        { model: User, as: 'assignedUser', attributes: ['user_id', 'display_name'] },
        { model: User, as: 'creatorUser', attributes: ['user_id', 'display_name'] },
      ],
      order: [['start_time', 'ASC']],
    });
    
    // NOTE: Fetching Google Calendar events and merging them would happen here.
    // This requires checking for connected calendars and fetching them using the stored tokens.
    // This part can be complex due to API limits, pagination, and handling merged data.
    // For simplicity, this endpoint currently only returns FamilyFlow events.
    // A more advanced implementation might fetch Google events based on a date range requested by the client.

    res.status(200).json({ success: true, count: ffEvents.length, data: ffEvents });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new FamilyFlow event
// @route   POST /api/v1/calendar/events
// @access  Private (Parent)
export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, start_time, end_time, assigned_to, event_category_id, location, is_recurring, recurrence_rule, recurring_end_date } = req.body;
    const createdBy = (req as any).user?.userId;
    const familyId = getFamilyIdFromToken(req);

    if (!familyId || !createdBy) {
      return res.status(400).json({ message: 'Family ID or User ID missing.' });
    }
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ message: 'Title, start time, and end time are required.' });
    }

    const newEvent = await Event.create({
      family_id: familyId,
      title,
      description: description || null,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      assigned_to: assigned_to || null,
      event_category_id: event_category_id || null,
      location: location || null,
      is_recurring: is_recurring || false,
      recurrence_rule: recurrence_rule || null,
      recurring_end_date: recurring_end_date ? new Date(recurring_end_date) : null,
      created_by: createdBy,
      google_event_id: null, // Initially null, will be set if synced to Google
    });

    res.status(201).json({ success: true, data: newEvent });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update an existing FamilyFlow event
// @route   PUT /api/v1/calendar/events/:id
// @access  Private (Parent or Assigned User)
export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    // Fields that can be updated, including Google event ID for potential sync updates
    const { title, description, start_time, end_time, assigned_to, event_category_id, location, is_recurring, recurrence_rule, recurring_end_date, google_event_id } = req.body;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const familyId = getFamilyIdFromToken(req);

    if (!familyId || !userId) {
      return res.status(400).json({ message: 'Family ID or User ID missing.' });
    }

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Authorization check: Parent can update any event in family. User can update their own assigned events.
    if (event.family_id !== familyId) {
      return res.status(403).json({ message: 'Event does not belong to your family.' });
    }
    if (userRole === 'child' && event.assigned_to !== userId) {
      return res.status(403).json({ message: 'You are not authorized to update this event.' });
    }

    // Update fields
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (start_time !== undefined) event.start_time = new Date(start_time);
    if (end_time !== undefined) event.end_time = new Date(end_time);
    if (assigned_to !== undefined) event.assigned_to = assigned_to;
    if (event_category_id !== undefined) event.event_category_id = event_category_id;
    if (location !== undefined) event.location = location;
    if (is_recurring !== undefined) event.is_recurring = is_recurring;
    if (recurrence_rule !== undefined) event.recurrence_rule = recurrence_rule;
    if (recurring_end_date !== undefined) event.recurring_end_date = recurring_end_date ? new Date(recurring_end_date) : null;
    // Handle updating google_event_id if necessary (e.g., if event was synced later)
    if (google_event_id !== undefined) event.google_event_id = google_event_id;

    await event.save();

    // TODO: If synced to Google, update the event in Google Calendar as well.
    // This requires using the stored google_event_id and making a PUT request to Google API.

    res.status(200).json({ success: true, data: event });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a FamilyFlow event
// @route   DELETE /api/v1/calendar/events/:id
// @access  Private (Parent or Assigned User)
export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const familyId = getFamilyIdFromToken(req);

    if (!familyId || !userId) {
      return res.status(400).json({ message: 'Family ID or User ID missing.' });
    }

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Authorization check
    if (event.family_id !== familyId) {
      return res.status(403).json({ message: 'Event does not belong to your family.' });
    }
    if (userRole === 'child' && event.assigned_to !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this event.' });
    }

    // Store google_event_id before deletion if exists
    const googleEventId = event.google_event_id;

    await event.destroy();

    // TODO: If synced to Google, delete the event from Google Calendar as well.
    // This requires using the stored google_event_id and making a DELETE request to Google API.

    res.status(200).json({ success: true, message: 'Event deleted successfully.' });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
