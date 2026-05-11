import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import sequenceService from './services/sequenceService';

import authRoutes from './routes/authRoutes';
import contactRoutes from './routes/contactRoutes';
import contactListRoutes from './routes/contactListRoutes';
import templateRoutes from './routes/templateRoutes';
import campaignRoutes from './routes/campaignRoutes';
import sequenceRoutes from './routes/sequenceRoutes';
import trackingRoutes from './routes/trackingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();

// Trust proxy for Railway/production environments
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Support multiple origins (comma-separated)
const allowedOrigins = config.app.frontendUrl.split(',').map(origin => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.nodeEnv === 'development' ? 2000 : config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// More permissive rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Permissive limiter for tracking — allows high volume of opens/clicks but blocks outright abuse
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contacts', apiLimiter, contactRoutes);
app.use('/api/contact-lists', apiLimiter, contactListRoutes);
app.use('/api/templates', apiLimiter, templateRoutes);
app.use('/api/campaigns', apiLimiter, campaignRoutes);
app.use('/api/sequences', apiLimiter, sequenceRoutes);
app.use('/api/track', trackingLimiter, trackingRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);

app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT} [${config.nodeEnv}] — tracking: ${config.app.url}`);

  // Start sequence automation worker
  sequenceService.startWorker(60000);
});

export default app;
