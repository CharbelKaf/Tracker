/**
 * Users routes
 */

import { Router, Request, Response } from 'express';
import { validateBody, validateQuery, validateUUID } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { hashPassword } from '../auth/password';
import {
  createUserSchema,
  updateUserSchema,
  userFilterSchema,
  User,
} from '../schemas/validation';

const router = Router();

// Mock database (shared with auth route)
const users: any[] = [];

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validateQuery(userFilterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, role, status, department, search, sortBy, sortOrder } = req.query as any;

    let filtered = [...users];

    // Apply filters
    if (role) {
      filtered = filtered.filter(u => u.role === role);
    }
    if (status) {
      filtered = filtered.filter(u => u.status === status);
    }
    if (department) {
      filtered = filtered.filter(u => u.department === department);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sortBy) {
      filtered.sort((a: any, b: any) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    // Remove passwords
    const sanitized = paginated.map(({ password, ...user }) => user);

    res.json({
      data: sanitized,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    });
  })
);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get(
  '/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    // Users can only view themselves unless admin
    if (req.user?.role !== 'admin' && req.user?.userId !== req.params.id) {
      throw new AppError(403, 'Accès interdit');
    }

    const user = users.find(u => u.id === req.params.id);

    if (!user) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }

    const { password, ...sanitized } = user;
    res.json(sanitized);
  })
);

/**
 * POST /api/users
 * Create new user (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
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

    const { password: _, ...sanitized } = newUser;
    res.status(201).json(sanitized);
  })
);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put(
  '/:id',
  authenticate,
  validateUUID('id'),
  validateBody(updateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Users can only update themselves unless admin
    if (req.user?.role !== 'admin' && req.user?.userId !== req.params.id) {
      throw new AppError(403, 'Accès interdit');
    }

    const index = users.findIndex(u => u.id === req.params.id);

    if (index === -1) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }

    // Non-admins can't change role or status
    if (req.user?.role !== 'admin') {
      delete req.body.role;
      delete req.body.status;
    }

    users[index] = {
      ...users[index],
      ...req.body,
      updatedAt: new Date(),
    };

    const { password, ...sanitized } = users[index];
    res.json(sanitized);
  })
);

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const index = users.findIndex(u => u.id === req.params.id);

    if (index === -1) {
      throw new AppError(404, 'Utilisateur non trouvé');
    }

    // Can't delete yourself
    if (users[index].id === req.user?.userId) {
      throw new AppError(400, 'Vous ne pouvez pas supprimer votre propre compte');
    }

    users.splice(index, 1);

    res.status(204).send();
  })
);

export default router;
