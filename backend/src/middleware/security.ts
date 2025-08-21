import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory rate limit store
const rateLimitStore: RateLimitStore = {};

// Custom rate limiter for better control
export function createRateLimit(windowMs: number, max: number, message?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    if (rateLimitStore[key] && now > rateLimitStore[key].resetTime) {
      delete rateLimitStore[key];
    }
    
    // Initialize or update counter
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs
      };
    } else {
      rateLimitStore[key].count++;
    }
    
    // Check if limit exceeded
    if (rateLimitStore[key].count > max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later',
        retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000)
      });
    }
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - rateLimitStore[key].count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitStore[key].resetTime / 1000));
    
    next();
  };
}

// Rate limiters for different endpoints
export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again after 15 minutes'
);

export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 auth requests per 15 minutes
  'Too many authentication attempts, please try again after 15 minutes'
);

export const tradingRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // limit trading to 10 per minute
  'Too many trading requests, please wait before placing another order'
);

export const apiRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  30, // 30 API calls per minute
  'API rate limit exceeded, please slow down your requests'
);

// Input validation schemas
export const authValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be 1-50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be 1-50 characters'),
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required'),
  ]
};

export const tradingValidation = {
  trade: [
    body('symbol')
      .trim()
      .isLength({ min: 1, max: 20 })
      .isAlphanumeric()
      .withMessage('Valid stock symbol required'),
    body('quantity')
      .isInt({ min: 1, max: 10000 })
      .withMessage('Quantity must be between 1 and 10,000'),
    body('type')
      .isIn(['BUY', 'SELL'])
      .withMessage('Type must be BUY or SELL'),
    body('price')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Price must be a positive number'),
  ]
};

// Validation error handler
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: 'param' in error ? error.param : 'unknown',
        message: error.msg,
        value: 'value' in error ? error.value : undefined
      }))
    });
  }
  
  next();
}

// Request sanitization middleware
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Remove potentially harmful characters
  function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    
    return value;
  }
  
  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  
  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' ws: wss:; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  next();
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url } = req;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'Unknown';
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`);
    
    // Log suspicious activity
    if (statusCode === 429) {
      console.warn(`🚨 Rate limit exceeded: ${ip} - ${method} ${url}`);
    }
    
    if (statusCode >= 400) {
      console.warn(`⚠️ Error response: ${statusCode} - ${method} ${url} - ${ip}`);
    }
  });
  
  next();
}

// Block suspicious requests
export function blockSuspiciousRequests(req: Request, res: Response, next: NextFunction) {
  const { url, method, body } = req;
  const userAgent = req.get('user-agent') || '';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Block common attack patterns
  const suspiciousPatterns = [
    /\.(php|asp|jsp|cgi)$/i,
    /\/(admin|wp-admin|phpmyadmin)/i,
    /\.(sql|bak|backup|old)$/i,
    /(union|select|insert|delete|drop|create)/i,
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || 
    pattern.test(JSON.stringify(body)) ||
    pattern.test(userAgent)
  );
  
  if (isSuspicious) {
    console.warn(`🚨 Blocked suspicious request: ${ip} - ${method} ${url}`);
    return res.status(403).json({
      success: false,
      message: 'Request blocked for security reasons'
    });
  }
  
  next();
}

// Health check endpoint protection
export function healthCheckAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.get('Authorization');
  const expectedToken = process.env.HEALTH_CHECK_TOKEN || 'demo-health-token';
  
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized health check access'
    });
  }
  
  next();
}

// API key validation for external services
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.get('X-API-Key');
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || ['demo-api-key'];
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key'
    });
  }
  
  next();
}

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001',
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};

export default {
  generalRateLimit,
  authRateLimit,
  tradingRateLimit,
  apiRateLimit,
  authValidation,
  tradingValidation,
  handleValidationErrors,
  sanitizeRequest,
  securityHeaders,
  requestLogger,
  blockSuspiciousRequests,
  healthCheckAuth,
  validateApiKey,
  corsOptions
}; 