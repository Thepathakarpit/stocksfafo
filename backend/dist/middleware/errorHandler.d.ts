import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: <T extends Request, U extends Response>(fn: (req: T, res: U, next: NextFunction) => Promise<void>) => (req: T, res: U, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
