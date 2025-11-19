import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import contactRoutes from './routes/contactRoutes';
import contactListRoutes from './routes/contactListRoutes';
import templateRoutes from './routes/templateRoutes';
import campaignRoutes from './routes/campaignRoutes';
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
  max: config.rateLimit.maxRequests,
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

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contacts', apiLimiter, contactRoutes);
app.use('/api/contact-lists', apiLimiter, contactListRoutes);
app.use('/api/templates', apiLimiter, templateRoutes);
app.use('/api/campaigns', apiLimiter, campaignRoutes);
app.use('/api/track', trackingRoutes); // No rate limit for tracking (email opens/clicks)
app.use('/api/analytics', apiLimiter, analyticsRoutes);

app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
🚀 Email Marketing Platform API is running!

📍 Server: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
📚 Environment: ${config.nodeEnv}

Available endpoints:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

  GET    /api/contacts
  POST   /api/contacts
  POST   /api/contacts/import
  GET    /api/contacts/export

  GET    /api/contact-lists
  POST   /api/contact-lists
  GET    /api/contact-lists/:id
  POST   /api/contact-lists/:id/contacts
  DELETE /api/contact-lists/:id/contacts/:contactId

  GET    /api/templates
  POST   /api/templates

  GET    /api/campaigns
  POST   /api/campaigns
  POST   /api/campaigns/:id/send

  GET    /api/track/open/:token
  GET    /api/track/click/:token

  GET    /api/analytics/dashboard
  GET    /api/analytics/campaigns/:id
  `);
});

export default app;
