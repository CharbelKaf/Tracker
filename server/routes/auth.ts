/**
 * Authentication routes
 */

import { Router, Request, Response } from 'express';
import { validateBody } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimit';
import { loginSchema, createUserSchema } from '../schemas/validation';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { generateTokenPair, verifyRefreshToken } from '../auth/jwt';
import { hashPassword, comparePassword } from '../auth/password';
import { authenticate } from '../middleware/auth';

const router = Router();

// Mock database (replace with real DB)
const users: any[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@neemba.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyEzN.V1w4/W', // password123
    name: 'Admin User',
    role: 'admin',
    status: 'active',
  },
];

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new AppError(401, 'Email ou mot de passe invalide');
    }

    // Check password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new AppError(401, 'Email ou mot de passe invalide');
    }

    // Check status
    if (user.status !== 'active') {
      throw new AppError(403, 'Compte désactivé');
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    });
  })
);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authRateLimiter,
  validateBody(createUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, role, department } = req.body;

    // Check if user exists
    const exists = users.find(u => u.email === email);
    if (exists) {
      throw new AppError(409, 'Un utilisateur avec cet email existe déjà');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      name,
      role: role || 'user',
      department,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUser);

    // Generate tokens
    const tokens = generateTokenPair({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Set refresh token
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      accessToken: tokens.accessToken,
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError(401, 'Refresh token manquant');
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find user
    const user = users.find(u => u.id === payload.userId);
    if (!user || user.status !== 'active') {
      throw new AppError(401, 'Utilisateur invalide');
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: tokens.accessToken,
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      message: 'Déconnexion réussie',
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = users.find(u => u.id === req.user?.userId);

    if (!user) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      status: user.status,
    });
  })
);

export default router;
