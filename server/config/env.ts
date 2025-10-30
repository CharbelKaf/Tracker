/**
 * Environment configuration
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_COOKIE_SECRET: z.string().min(32),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('900000'), // 15 min
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  
  // Database (optional for now)
  DATABASE_URL: z.string().optional(),
});

const processEnv = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '4000',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars-long-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-min-32-chars-long-change-in-production',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_COOKIE_SECRET: process.env.JWT_COOKIE_SECRET || 'your-super-secret-cookie-key-min-32-chars-long-change-in-production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '900000',
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
  DATABASE_URL: process.env.DATABASE_URL,
};

const env = envSchema.parse(processEnv);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    cookieSecret: env.JWT_COOKIE_SECRET,
  },
  
  cors: {
    origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW,
    max: env.RATE_LIMIT_MAX,
  },
  
  database: {
    url: env.DATABASE_URL,
  },
} as const;

// Validate on startup
if (config.env === 'production') {
  if (config.jwt.secret.includes('change-in-production')) {
    throw new Error('❌ JWT_SECRET must be changed in production!');
  }
  if (config.jwt.refreshSecret.includes('change-in-production')) {
    throw new Error('❌ JWT_REFRESH_SECRET must be changed in production!');
  }
  if (config.jwt.cookieSecret.includes('change-in-production')) {
    throw new Error('❌ JWT_COOKIE_SECRET must be changed in production!');
  }
}

console.log('✅ Environment configuration loaded');
