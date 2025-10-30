/**
 * Zod validation schemas
 */

import { z } from 'zod';

// ===== User Schemas =====

export const userSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createUserSchema = userSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});

export const updateUserSchema = userSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

// ===== Equipment Schemas =====

export const equipmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(200),
  category: z.enum(['laptop', 'desktop', 'monitor', 'phone', 'tablet', 'accessory', 'other']),
  model: z.string().max(200).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.string().datetime().or(z.date()).optional(),
  purchasePrice: z.number().positive().optional(),
  status: z.enum(['available', 'assigned', 'maintenance', 'retired']).default('available'),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  warrantyExpiry: z.string().datetime().or(z.date()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createEquipmentSchema = equipmentSchema.omit({ id: true, createdAt: true, updatedAt: true });

export const updateEquipmentSchema = equipmentSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

// ===== Assignment Schemas =====

export const assignmentSchema = z.object({
  id: z.string().uuid().optional(),
  equipmentId: z.string().uuid('ID équipement invalide'),
  userId: z.string().uuid('ID utilisateur invalide'),
  assignedDate: z.string().datetime().or(z.date()),
  returnDate: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['active', 'returned', 'pending']).default('active'),
  notes: z.string().max(1000).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createAssignmentSchema = assignmentSchema.omit({ id: true, createdAt: true, updatedAt: true });

export const updateAssignmentSchema = assignmentSchema.partial().omit({ id: true, createdAt: true, updatedAt: true });

// ===== Query Params Schemas =====

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const equipmentFilterSchema = paginationSchema.extend({
  category: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const userFilterSchema = paginationSchema.extend({
  role: z.string().optional(),
  status: z.string().optional(),
  department: z.string().optional(),
  search: z.string().optional(),
});

export const assignmentFilterSchema = paginationSchema.extend({
  status: z.string().optional(),
  userId: z.string().uuid().optional(),
  equipmentId: z.string().uuid().optional(),
});

// ===== Types =====

export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Login = z.infer<typeof loginSchema>;

export type Equipment = z.infer<typeof equipmentSchema>;
export type CreateEquipment = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipment = z.infer<typeof updateEquipmentSchema>;

export type Assignment = z.infer<typeof assignmentSchema>;
export type CreateAssignment = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>;

export type PaginationParams = z.infer<typeof paginationSchema>;
export type EquipmentFilter = z.infer<typeof equipmentFilterSchema>;
export type UserFilter = z.infer<typeof userFilterSchema>;
export type AssignmentFilter = z.infer<typeof assignmentFilterSchema>;
