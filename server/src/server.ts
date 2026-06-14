import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import entriesRouter from './routes/entries';
import challengesRouter from './routes/challenges';
import leaderboardRouter from './routes/leaderboard';
import aiRouter from './routes/ai';
import reportsRouter from './routes/reports';
import adminRouter from './routes/admin';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(helmet());

// CORS Policy
app.use(
  cors({
    origin: '*', // Allow all origins for the hackathon API, or restrict to client URL in prod
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser
app.use(express.json());

// Request logging (Morgan + Winston integration)
const morganFormat = process.env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Rate Limiting to prevent brute-force abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EcoTrack AI server is running and healthy!',
    timestamp: new Date().toISOString(),
  });
});

// Route Handlers
app.use('/api/entries', entriesRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);

// Centralized error handling middleware (must be defined last)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info(`Server listening in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
