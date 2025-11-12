import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/authRoutes';
import contactRoutes from './routes/contactRoutes';
import templateRoutes from './routes/templateRoutes';
import campaignRoutes from './routes/campaignRoutes';
import trackingRoutes from './routes/trackingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

const app = express();

app.use(
  cors({
    origin: config.app.frontendUrl,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/analytics', analyticsRoutes);

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
