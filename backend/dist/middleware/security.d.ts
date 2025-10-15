import { Request, Response, NextFunction } from 'express';
export declare function createRateLimit(windowMs: number, max: number, message?: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const generalRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const tradingRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const apiRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authValidation: {
    register: import("express-validator").ValidationChain[];
    login: import("express-validator").ValidationChain[];
};
export declare const tradingValidation: {
    trade: import("express-validator").ValidationChain[];
};
export declare function handleValidationErrors(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function sanitizeRequest(req: Request, res: Response, next: NextFunction): void;
export declare function securityHeaders(req: Request, res: Response, next: NextFunction): void;
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
export declare function blockSuspiciousRequests(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function healthCheckAuth(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function validateApiKey(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare const corsOptions: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    optionsSuccessStatus: number;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
};
declare const _default: {
    generalRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    authRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    tradingRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    apiRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    authValidation: {
        register: import("express-validator").ValidationChain[];
        login: import("express-validator").ValidationChain[];
    };
    tradingValidation: {
        trade: import("express-validator").ValidationChain[];
    };
    handleValidationErrors: typeof handleValidationErrors;
    sanitizeRequest: typeof sanitizeRequest;
    securityHeaders: typeof securityHeaders;
    requestLogger: typeof requestLogger;
    blockSuspiciousRequests: typeof blockSuspiciousRequests;
    healthCheckAuth: typeof healthCheckAuth;
    validateApiKey: typeof validateApiKey;
    corsOptions: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
        credentials: boolean;
        optionsSuccessStatus: number;
        methods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
    };
};
export default _default;
