/**
 * JWT utilities
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<JWTPayload, 'type'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    if (payload.type !== 'access') {
      throw new AppError(401, 'Token invalide');
    }
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Token expiré');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Token invalide');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
    
    if (payload.type !== 'refresh') {
      throw new AppError(401, 'Refresh token invalide');
    }
    
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'Refresh token expiré');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Refresh token invalide');
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
};

/**
 * Generate token pair
 */
export const generateTokenPair = (payload: Omit<JWTPayload, 'type'>) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
