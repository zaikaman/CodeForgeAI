
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
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
