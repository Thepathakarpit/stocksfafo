import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variable validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // Database
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017/stocksfafo'),
  
  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: z.string().min(32).default('your-super-secret-jwt-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // Stock Data
  DEFAULT_STOCK_LIST: z.enum(['nifty50', 'sensex30', 'nifty500']).default('nifty50'),
  DEFAULT_STOCK_COUNT: z.string().transform(Number).optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  HELMET_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  
  // Performance
  COMPRESSION_ENABLED: z.string().default('true').transform((val: string) => val === 'true'),
  CACHE_TTL: z.string().default('30000').transform(Number), // 30 seconds
});

// Validate environment variables
const env = envSchema.parse(process.env);

// Configuration object
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  frontendUrl: env.FRONTEND_URL,
  
  database: {
    uri: env.MONGODB_URI,
  },
  
  redis: {
    url: env.REDIS_URL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  stockData: {
    defaultList: env.DEFAULT_STOCK_LIST,
    defaultCount: env.DEFAULT_STOCK_COUNT,
  },
  
  logging: {
    level: env.LOG_LEVEL,
  },
  
  security: {
    corsOrigin: env.CORS_ORIGIN,
    helmetEnabled: env.HELMET_ENABLED,
  },
  
  performance: {
    compressionEnabled: env.COMPRESSION_ENABLED,
    cacheTtl: env.CACHE_TTL,
  },
  
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

export type Config = typeof config; 