import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from './config/passport'; 
import authRoutes from './routes/auth';
import userRoutes from './routes/user'; 
import calendarRoutes from './routes/calendar'; 
import taskRoutes from './routes/tasks'; 

import http from 'http'; 
import { Server } from 'socket.io'; 

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// CORS Middleware
app.use(cors({ 
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true, 
})); 

// Body parsing middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Initialize Passport for authentication
app.use(passport.initialize());

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', passport.authenticate('jwt', { session: false }), userRoutes);
app.use('/api/v1/calendar', passport.authenticate('jwt', { session: false }), calendarRoutes);
app.use('/api/v1/tasks', passport.authenticate('jwt', { session: false }), taskRoutes);

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});

// Catch-all for undefined routes (404)
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ message: `Resource not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Error:', err.stack);
    
    let statusCode = 500;
    let message = 'An unexpected error occurred.';

    if (err.name === 'UnauthorizedError') { 
        statusCode = 401;
        message = 'Authentication failed: Invalid token.';
    } else if (err.status) { 
        statusCode = err.status;
        message = err.message || message;
    } else if (err.message) { 
        message = err.message;
    }
    
    res.status(statusCode).json({
        message: message,
    });
});

// --- WebSocket Setup ---
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || '*', 
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware to attach io instance to request
app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).io = io;
    next();
});

// Handle WebSocket connections
io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', (room: string) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    socket.on('createEvent', (newEventData) => {
        if (newEventData.familyId) {
            socket.to(newEventData.familyId).emit('eventCreated', newEventData); 
        }
    });

    socket.on('updateEvent', (updatedEventData) => {
         if (updatedEventData.familyId) {
            socket.to(updatedEventData.familyId).emit('eventUpdated', updatedEventData);
        }
    });

    socket.on('deleteEvent', (eventData) => {
         if (eventData.familyId) {
             socket.to(eventData.familyId).emit('eventDeleted', { eventId: eventData.eventId });
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

export default app;
