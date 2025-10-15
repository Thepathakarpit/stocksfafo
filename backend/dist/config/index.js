"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000').transform(Number),
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3000'),
    MONGODB_URI: zod_1.z.string().url().default('mongodb://localhost:27017/stocksfafo'),
    REDIS_URL: zod_1.z.string().url().default('redis://localhost:6379'),
    JWT_SECRET: zod_1.z.string().min(32).default('your-super-secret-jwt-key-change-in-production'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000').transform(Number),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('100').transform(Number),
    DEFAULT_STOCK_LIST: zod_1.z.enum(['nifty50', 'sensex30', 'nifty500']).default('nifty50'),
    DEFAULT_STOCK_COUNT: zod_1.z.string().transform(Number).optional(),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    HELMET_ENABLED: zod_1.z.string().default('true').transform((val) => val === 'true'),
    COMPRESSION_ENABLED: zod_1.z.string().default('true').transform((val) => val === 'true'),
    CACHE_TTL: zod_1.z.string().default('30000').transform(Number),
});
const env = envSchema.parse(process.env);
exports.config = {
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
};
//# sourceMappingURL=index.js.map