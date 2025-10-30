


export enum FormAction {
  ASSIGN = 'Attribuer un équipement',
  RETURN = 'Retourner un équipement',
}

export enum EquipmentStatus {
  AVAILABLE = 'Disponible',
  ASSIGNED = 'Attribué',
  PENDING_VALIDATION = 'En attente de validation',
  IN_REPAIR = 'En réparation',
  IN_STORAGE = 'En stock',
  DECOMMISSIONED = 'Désaffecté',
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface Model {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  imageUrl?: string;
  specifications?: string;
  modelNumber?: string;
}

export interface Country {
  id: string;
  name: string;
}

export interface Site {
    id: string;
    name: string;
    countryId: string;
}

export interface Department {
    id: string;
    name: string;
    siteId: string;
}


export interface Equipment {
  id: string;
  modelId: string;
  name?: string; // Nom AD
  assetTag: string; // Numéro de Série
  purchaseDate?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  status: EquipmentStatus;
  pendingAssignmentId?: string;
  
  // Champs de localisation structurés
  siteId?: string;
  departmentId?: string;

  // Anciens champs (à déprécier/migrer)
  location?: string; // Site
  country?: string; // Pays

  // Nouveaux champs
  os?: string; // OS
  ram?: string; // RAM
  storage?: string; // Disque dur
  agentS1?: string; // Agent S1
  agentM42?: string; // Agent M42
  agentME?: string; // Agent ME
  notes?: string; // Observations
  operationalStatus?: string; // Statut: Actif, etc.
}

export type EquipmentWithDetails = Equipment & {
    model?: Model | null;
    category?: Category | null;
};

export type EquipmentCondition = 'Excellent' | 'Bon' | 'Moyen' | 'Mauvais';

export enum AssignmentStatus {
  PENDING = 'En attente',
  APPROVED = 'Approuvé',
  REJECTED = 'Rejeté',
}

export interface Assignment {
  id: string;
  action: FormAction;
  equipmentId: string; // Link to the equipment
  date: string;
  userId: string;
  managerId: string;
  signature: string; // Base64 data URL or validation method string
  validation?: {
    it: boolean;
    manager: boolean;
    user: boolean;
  };
  validatedBy?: {
    it?: string; // userId of the IT admin who validated
    manager?: string; // userId of the manager who validated
    user?: string; // userId of the end-user who validated
  };
  validatedAt?: {
    it?: string; // ISO timestamp when IT validated
    manager?: string; // ISO timestamp when manager validated
    user?: string; // ISO timestamp when end-user validated
  };
  condition?: EquipmentCondition;
  returnNotes?: string;
  status?: AssignmentStatus;
  rejectionReason?: string;
}

export type ValidationActor = 'manager' | 'user' | 'it';

export interface Point {
  x: number;
  y: number;
}

export enum UserRole {
  ADMIN = 'Admin TI',
  MANAGER = 'Responsable',
  EMPLOYEE = 'Employé',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  employeeId?: string;
  email?: string;
  managerId?: string;
  password?: string; // For authentication (login)
  pin?: string; // For validation (approvals)
  // FIX: Add webauthnCredentialId for fingerprint validation
  webauthnCredentialId?: string;
}

export type AuditAction = 'create' | 'update' | 'delete';
export type EntityType = 'equipment' | 'model' | 'category' | 'user' | 'location';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  entityType: EntityType;
  entityName: string;
}

export interface ModelFormData {
  modelName: string;
  brand: string;
  type: string;
  specifications: string;
  image: File | null;
  id?: string;
  imageUrl?: string;
  modelNumber?: string;
}

export interface ChangeDetail {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface EditHistoryEntry {
  id: string;
  timestamp: string;
  userId: string; // ID of the user who made the change
  entityType: 'user' | 'equipment';
  entityId: string;
  changes: ChangeDetail[];
}

export interface QrScanData {
  serialNumber: string;
  hostname?: string;
  os?: string;
  ipAddress?: string;
  ramTotalGB?: number;
  architecture?: string;
}

export interface AuditSession {
  id: string;
  departmentId: string;
  status: 'in-progress' | 'paused' | 'completed' | 'cancelled';
  scannedItemIds: string[];
  unexpectedItems: { assetTag: string, modelName?: string, originalLocation?: string }[];
  startedByUserId: string;
  startedAt: string;
  updatedAt: string;
}