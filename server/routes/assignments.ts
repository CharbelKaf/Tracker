/**
 * Assignments routes
 */

import { Router, Request, Response } from 'express';
import { validateBody, validateQuery, validateUUID } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentFilterSchema,
  Assignment,
} from '../schemas/validation';

const router = Router();

// Mock database
const assignments: Assignment[] = [];

/**
 * GET /api/assignments
 * Get all assignments with filters
 */
router.get(
  '/',
  authenticate,
  validateQuery(assignmentFilterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, status, userId, equipmentId, sortBy, sortOrder } = req.query as any;

    let filtered = [...assignments];

    // Apply filters
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }
    if (userId) {
      filtered = filtered.filter(a => a.userId === userId);
    }
    if (equipmentId) {
      filtered = filtered.filter(a => a.equipmentId === equipmentId);
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

    res.json({
      data: paginated,
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
 * GET /api/assignments/:id
 * Get assignment by ID
 */
router.get(
  '/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const assignment = assignments.find(a => a.id === req.params.id);

    if (!assignment) {
      throw new AppError(404, 'Assignation non trouvée');
    }

    res.json(assignment);
  })
);

/**
 * POST /api/assignments
 * Create new assignment
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'user'),
  validateBody(createAssignmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Check if equipment is already assigned
    const existingActive = assignments.find(
      a => a.equipmentId === req.body.equipmentId && a.status === 'active'
    );

    if (existingActive) {
      throw new AppError(400, 'Cet équipement est déjà assigné');
    }

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    assignments.push(newAssignment);

    res.status(201).json(newAssignment);
  })
);

/**
 * PUT /api/assignments/:id
 * Update assignment
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'user'),
  validateUUID('id'),
  validateBody(updateAssignmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const index = assignments.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      throw new AppError(404, 'Assignation non trouvée');
    }

    assignments[index] = {
      ...assignments[index],
      ...req.body,
      updatedAt: new Date(),
    };

    res.json(assignments[index]);
  })
);

/**
 * POST /api/assignments/:id/return
 * Mark assignment as returned
 */
router.post(
  '/:id/return',
  authenticate,
  authorize('admin', 'user'),
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const index = assignments.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      throw new AppError(404, 'Assignation non trouvée');
    }

    if (assignments[index].status === 'returned') {
      throw new AppError(400, 'Assignation déjà retournée');
    }

    assignments[index] = {
      ...assignments[index],
      status: 'returned',
      returnDate: new Date(),
      updatedAt: new Date(),
    };

    res.json(assignments[index]);
  })
);

/**
 * DELETE /api/assignments/:id
 * Delete assignment (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const index = assignments.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      throw new AppError(404, 'Assignation non trouvée');
    }

    assignments.splice(index, 1);

    res.status(204).send();
  })
);

export default router;
