import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

if (nodeEnv === 'production' && jwtSecret === 'your-secret-key-change-in-production') {
  throw new Error('JWT_SECRET must be set to a secure value in production');
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL!,

  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY!,
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};
