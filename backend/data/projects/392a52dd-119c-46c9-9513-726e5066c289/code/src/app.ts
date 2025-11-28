import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import rewardRoutes from './routes/rewardRoutes';
import calendarRoutes from './routes/calendarRoutes'; 

// Import database initialization
import { initializeDatabase } from './config/database';

dotenva.config();

const app: Express = express();

// Middlewares
app.use(cors()); // Enable CORS for all origins - configure appropriately for production
app.use(helmet()); // Basic security headers
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/rewards', rewardRoutes);
app.use('/api/v1/calendar', calendarRoutes);

// Basic error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
