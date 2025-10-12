
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { ensureJsonResponse } from './middleware/jsonResponse';

// Import routes
import onboardRouter from './routes/onboard';
import generateRouter from './routes/generate';
import reviewRouter from './routes/review';
import enhanceRouter from './routes/enhance';
import statusRouter from './routes/status';
import projectsRouter from './routes/projects';
import historyRouter from './routes/history';
import settingsRouter from './routes/settings';
import previewRouter from './routes/preview';
import chatRouter from './routes/chat';
import chatHistoryRouter from './routes/chatHistory';
import downloadRouter from './routes/download';
import deployRouter from './routes/deploy';
import fixPreviewErrorsRouter from '../routes/fix-preview-errors';
import cacheRouter from './cache';
import codebaseRouter from './routes/codebase';

const app = express();

// Trust proxy - MUST be set before any middleware
// This is required when running behind a reverse proxy (Heroku, nginx, etc.)
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://codeforge-adk.vercel.app',
  'https://codeforge-ai-c67006992634.herokuapp.com',
];

// Add environment variable origin if specified
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
}));

// Middleware
app.use(express.json());
app.use(ensureJsonResponse); // Ensure all responses are JSON
app.use('/api', apiRateLimiter);

// Routes
app.use('/api', onboardRouter);
app.use('/api', generateRouter);
app.use('/api', reviewRouter);
app.use('/api', enhanceRouter);
app.use('/api', statusRouter);
app.use('/api', projectsRouter);
app.use('/api', historyRouter);
app.use('/api', settingsRouter);
app.use('/api', previewRouter);
app.use('/api', chatRouter);
app.use('/api', chatHistoryRouter);
app.use('/api', downloadRouter);
app.use('/api', deployRouter);
app.use('/api/fix-preview-errors', fixPreviewErrorsRouter);
app.use('/api/cache', cacheRouter);
app.use('/api', codebaseRouter);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Error Handler Middleware
app.use(errorHandler);

export { server, app };
