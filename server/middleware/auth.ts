/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyAccessToken, JWTPayload } from '../auth/jwt';
import { AppError } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authenticate request with JWT
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      throw new AppError(401, 'Authentication requise');
    }
    
    const payload = verifyAccessToken(token);
    req.user = payload;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize based on roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Authentication requise');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, 'Accès interdit');
    }
    
    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};
