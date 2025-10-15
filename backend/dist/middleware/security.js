"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = exports.tradingValidation = exports.authValidation = exports.apiRateLimit = exports.tradingRateLimit = exports.authRateLimit = exports.generalRateLimit = void 0;
exports.createRateLimit = createRateLimit;
exports.handleValidationErrors = handleValidationErrors;
exports.sanitizeRequest = sanitizeRequest;
exports.securityHeaders = securityHeaders;
exports.requestLogger = requestLogger;
exports.blockSuspiciousRequests = blockSuspiciousRequests;
exports.healthCheckAuth = healthCheckAuth;
exports.validateApiKey = validateApiKey;
const express_validator_1 = require("express-validator");
const rateLimitStore = {};
function createRateLimit(windowMs, max, message) {
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        if (rateLimitStore[key] && now > rateLimitStore[key].resetTime) {
            delete rateLimitStore[key];
        }
        if (!rateLimitStore[key]) {
            rateLimitStore[key] = {
                count: 1,
                resetTime: now + windowMs
            };
        }
        else {
            rateLimitStore[key].count++;
        }
        if (rateLimitStore[key].count > max) {
            return res.status(429).json({
                success: false,
                message: message || 'Too many requests, please try again later',
                retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000)
            });
        }
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - rateLimitStore[key].count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitStore[key].resetTime / 1000));
        next();
    };
}
exports.generalRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again after 15 minutes');
exports.authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again after 15 minutes');
exports.tradingRateLimit = createRateLimit(60 * 1000, 10, 'Too many trading requests, please wait before placing another order');
exports.apiRateLimit = createRateLimit(60 * 1000, 30, 'API rate limit exceeded, please slow down your requests');
exports.authValidation = {
    register: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        (0, express_validator_1.body)('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
        (0, express_validator_1.body)('firstName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('First name must be 1-50 characters'),
        (0, express_validator_1.body)('lastName')
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Last name must be 1-50 characters'),
    ],
    login: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        (0, express_validator_1.body)('password')
            .isLength({ min: 1 })
            .withMessage('Password is required'),
    ]
};
exports.tradingValidation = {
    trade: [
        (0, express_validator_1.body)('symbol')
            .trim()
            .isLength({ min: 1, max: 20 })
            .isAlphanumeric()
            .withMessage('Valid stock symbol required'),
        (0, express_validator_1.body)('quantity')
            .isInt({ min: 1, max: 10000 })
            .withMessage('Quantity must be between 1 and 10,000'),
        (0, express_validator_1.body)('type')
            .isIn(['BUY', 'SELL'])
            .withMessage('Type must be BUY or SELL'),
        (0, express_validator_1.body)('price')
            .optional()
            .isFloat({ min: 0.01 })
            .withMessage('Price must be a positive number'),
    ]
};
function handleValidationErrors(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
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
function sanitizeRequest(req, res, next) {
    function sanitizeValue(value) {
        if (typeof value === 'string') {
            return value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        }
        if (typeof value === 'object' && value !== null) {
            const sanitized = Array.isArray(value) ? [] : {};
            for (const key in value) {
                sanitized[key] = sanitizeValue(value[key]);
            }
            return sanitized;
        }
        return value;
    }
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        req.query = sanitizeValue(req.query);
    }
    next();
}
function securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    res.setHeader('Content-Security-Policy', "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' ws: wss:; " +
        "font-src 'self'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';");
    next();
}
function requestLogger(req, res, next) {
    const start = Date.now();
    const { method, url } = req;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'Unknown';
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        console.log(`${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`);
        if (statusCode === 429) {
            console.warn(`🚨 Rate limit exceeded: ${ip} - ${method} ${url}`);
        }
        if (statusCode >= 400) {
            console.warn(`⚠️ Error response: ${statusCode} - ${method} ${url} - ${ip}`);
        }
    });
    next();
}
function blockSuspiciousRequests(req, res, next) {
    const { url, method, body } = req;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const suspiciousPatterns = [
        /\.(php|asp|jsp|cgi)$/i,
        /\/(admin|wp-admin|phpmyadmin)/i,
        /\.(sql|bak|backup|old)$/i,
        /(union|select|insert|delete|drop|create)/i,
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
    ];
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(url) ||
        pattern.test(JSON.stringify(body)) ||
        pattern.test(userAgent));
    if (isSuspicious) {
        console.warn(`🚨 Blocked suspicious request: ${ip} - ${method} ${url}`);
        return res.status(403).json({
            success: false,
            message: 'Request blocked for security reasons'
        });
    }
    next();
}
function healthCheckAuth(req, res, next) {
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
function validateApiKey(req, res, next) {
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
exports.corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://localhost:3000',
            'https://localhost:3001',
        ];
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
};
exports.default = {
    generalRateLimit: exports.generalRateLimit,
    authRateLimit: exports.authRateLimit,
    tradingRateLimit: exports.tradingRateLimit,
    apiRateLimit: exports.apiRateLimit,
    authValidation: exports.authValidation,
    tradingValidation: exports.tradingValidation,
    handleValidationErrors,
    sanitizeRequest,
    securityHeaders,
    requestLogger,
    blockSuspiciousRequests,
    healthCheckAuth,
    validateApiKey,
    corsOptions: exports.corsOptions
};
//# sourceMappingURL=security.js.map