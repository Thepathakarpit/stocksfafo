import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    console.log('🔐 Auth Middleware: Processing authentication request');
    console.log('🔍 Auth Middleware: Request headers:', {
      authorization: req.headers.authorization ? 'present' : 'missing',
      'content-type': req.headers['content-type'],
      origin: req.headers.origin
    });
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.error('❌ Auth Middleware: No authorization header found');
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    console.log('🔑 Auth Middleware: Authorization header format:', authHeader.substring(0, 20) + '...');

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      console.error('❌ Auth Middleware: No token found in authorization header');
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    console.log('🔍 Auth Middleware: Token extracted, verifying...');
    console.log('🔑 Auth Middleware: Token preview:', token.substring(0, 30) + '...');

    // Verify the token
    const decoded = verifyToken(token);
    console.log('✅ Auth Middleware: Token verified successfully');
    console.log('👤 Auth Middleware: Decoded user info:', { userId: decoded.userId, email: decoded.email });
    
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('❌ Auth Middleware: Authentication error:', error);
    
    if (error instanceof Error) {
      console.error('❌ Auth Middleware: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n')[0] // First line of stack trace
      });
      
      if (error.name === 'TokenExpiredError') {
        console.error('❌ Auth Middleware: Token has expired');
        res.status(401).json({
          success: false,
          message: 'Access token has expired'
        });
        return;
      }
      
      if (error.name === 'JsonWebTokenError') {
        console.error('❌ Auth Middleware: Invalid token format');
        res.status(401).json({
          success: false,
          message: 'Invalid access token'
        });
        return;
      }
    }

    console.error('❌ Auth Middleware: Unknown authentication error');
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7)
      : authHeader;

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}; 