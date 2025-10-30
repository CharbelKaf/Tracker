/**
 * Equipment routes
 */

import { Router, Request, Response } from 'express';
import { validateBody, validateQuery, validateUUID } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  equipmentFilterSchema,
  Equipment,
} from '../schemas/validation';

const router = Router();

// Mock database
const equipment: Equipment[] = [];

/**
 * GET /api/equipment
 * Get all equipment with filters
 */
router.get(
  '/',
  authenticate,
  validateQuery(equipmentFilterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, category, status, search, sortBy, sortOrder } = req.query as any;

    let filtered = [...equipment];

    // Apply filters
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }
    if (status) {
      filtered = filtered.filter(e => e.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.name.toLowerCase().includes(searchLower) ||
          e.model?.toLowerCase().includes(searchLower) ||
          e.serialNumber?.toLowerCase().includes(searchLower)
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
 * GET /api/equipment/:id
 * Get equipment by ID
 */
router.get(
  '/:id',
  authenticate,
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const item = equipment.find(e => e.id === req.params.id);

    if (!item) {
      throw new AppError(404, 'Équipement non trouvé');
    }

    res.json(item);
  })
);

/**
 * POST /api/equipment
 * Create new equipment
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'user'),
  validateBody(createEquipmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const newEquipment: Equipment = {
      id: crypto.randomUUID(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    equipment.push(newEquipment);

    res.status(201).json(newEquipment);
  })
);

/**
 * PUT /api/equipment/:id
 * Update equipment
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'user'),
  validateUUID('id'),
  validateBody(updateEquipmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const index = equipment.findIndex(e => e.id === req.params.id);

    if (index === -1) {
      throw new AppError(404, 'Équipement non trouvé');
    }

    equipment[index] = {
      ...equipment[index],
      ...req.body,
      updatedAt: new Date(),
    };

    res.json(equipment[index]);
  })
);

/**
 * DELETE /api/equipment/:id
 * Delete equipment
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validateUUID('id'),
  asyncHandler(async (req: Request, res: Response) => {
    const index = equipment.findIndex(e => e.id === req.params.id);

    if (index === -1) {
      throw new AppError(404, 'Équipement non trouvé');
    }

    equipment.splice(index, 1);

    res.status(204).send();
  })
);

export default router;
