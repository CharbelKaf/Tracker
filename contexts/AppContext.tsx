

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type {
  Assignment,
  Equipment,
  User,
  Category,
  Model,
  AuditLogEntry,
  AuditAction,
  EntityType,
  ModelFormData,
  Country,
  Site,
  Department,
  EditHistoryEntry,
  ChangeDetail,
  AuditSession,
  ValidationActor
} from '../types';
import { AssignmentStatus, EquipmentStatus, UserRole, FormAction } from '../types';
import { INITIAL_EQUIPMENT, INITIAL_ASSIGNMENTS, ALL_USERS, CATEGORIES, MODELS, INITIAL_AUDIT_LOG, COUNTRIES, SITES, DEPARTMENTS } from '../data';

// 1. Define State Shape
interface AppState {
  currentUser: User | null;
  assignments: Assignment[];
  equipment: Equipment[];
  users: User[];
  categories: Category[];
  models: Model[];
  auditLog: AuditLogEntry[];
  editHistory: EditHistoryEntry[];
  countries: Country[];
  sites: Site[];
  departments: Department[];
  auditSessions: AuditSession[];
}

// 2. Define Actions
type Action =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SAVE_ASSIGNMENT'; payload: Omit<Assignment, 'id'> }
  | { type: 'SAVE_EQUIPMENT'; payload: Partial<Equipment> }
  | { type: 'IMPORT_EQUIPMENT'; payload: Partial<Equipment>[] }
  | { type: 'SAVE_USER'; payload: Partial<User> & { avatarUrl?: string } }
  | { type: 'SAVE_PIN'; payload: { userId: string; pin: string } }
  | { type: 'SAVE_WEBAUTHN_CREDENTIAL'; payload: { userId: string; credentialId: string } }
  | { type: 'SAVE_CATEGORY'; payload: { name: string; description: string; icon: string; id?: string } }
  | { type: 'SAVE_MODEL'; payload: Omit<ModelFormData, 'image'> }
  | { type: 'DELETE_EQUIPMENT'; payload: string }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'DELETE_MODEL'; payload: string }
  | { type: 'BULK_DELETE_EQUIPMENT'; payload: string[] }
  | { type: 'BULK_DELETE_USERS'; payload: string[] }
  | { type: 'BULK_UPDATE_STATUS'; payload: { ids: string[]; status: EquipmentStatus } }
  | { type: 'BULK_UPDATE_LOCATION'; payload: { ids: string[]; location: string } }
  | { type: 'APPROVE_ASSIGNMENT'; payload: { assignmentId: string; currentUser: User; actor?: ValidationActor } }
  | { type: 'REJECT_ASSIGNMENT'; payload: { assignmentId: string; reason: string } }
  | { type: 'REVERT_ASSIGNMENT_VALIDATION'; payload: { assignmentId: string; actor: ValidationActor } }
  | { type: 'RESTORE_REJECTED_ASSIGNMENT'; payload: { assignmentId: string } }
  | { type: 'LOG_AUDIT_EVENT'; payload: { user: User; action: AuditAction; entityType: EntityType; entityName: string } }
  | { type: 'SAVE_COUNTRY'; payload: Partial<Country> }
  | { type: 'DELETE_COUNTRY'; payload: string }
  | { type: 'SAVE_SITE'; payload: Partial<Site> }
  | { type: 'DELETE_SITE'; payload: string }
  | { type: 'SAVE_DEPARTMENT'; payload: Partial<Department> }
  | { type: 'DELETE_DEPARTMENT'; payload: string }
  | { type: 'IMPORT_USERS'; payload: Partial<User>[] }
  | { type: 'IMPORT_MODELS'; payload: Partial<Model>[] }
  | { type: 'IMPORT_LOCATIONS'; payload: { countries: Partial<Country>[], sites: Partial<Site>[], departments: Partial<Department>[] } }
  | { type: 'START_AUDIT_SESSION'; payload: { departmentId: string; userId: string } }
  | { type: 'PAUSE_AUDIT_SESSION'; payload: { sessionId: string } }
  | { type: 'CANCEL_AUDIT_SESSION'; payload: { sessionId: string } }
  | { type: 'COMPLETE_AUDIT_SESSION'; payload: { sessionId: string } }
  | { type: 'UPDATE_AUDIT_SESSION_SCAN'; payload: { sessionId: string; scannedItemId?: string; unexpectedItem?: any } };


// 3. Initial State
const initialState: AppState = {
  currentUser: null,
  assignments: INITIAL_ASSIGNMENTS,
  equipment: INITIAL_EQUIPMENT,
  users: ALL_USERS,
  categories: CATEGORIES,
  models: MODELS,
  auditLog: INITIAL_AUDIT_LOG,
  editHistory: [],
  countries: COUNTRIES,
  sites: SITES,
  departments: DEPARTMENTS,
  auditSessions: [],
};

// 4. Reducer
const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };

    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'SAVE_ASSIGNMENT': {
      const newAssignment: Assignment = {
        ...action.payload,
        id: `as-${Date.now()}`,
        status: AssignmentStatus.PENDING,
      };
      return {
        ...state,
        assignments: [newAssignment, ...state.assignments],
        equipment: state.equipment.map(item =>
          item.id === newAssignment.equipmentId
            ? { ...item, status: EquipmentStatus.PENDING_VALIDATION, pendingAssignmentId: newAssignment.id }
            : item
        ),
      };
    }

    case 'SAVE_EQUIPMENT': {
      const equipmentData = action.payload;
      const isEditing = !!equipmentData.id;
      let newEditHistory = state.editHistory;

      if (isEditing && equipmentData.id && state.currentUser) {
        const oldEquipment = state.equipment.find(e => e.id === equipmentData.id);
        if (oldEquipment) {
          const changes: ChangeDetail[] = [];
          const areDifferent = (a: any, b: any) => {
              const valA = a === null || a === undefined ? '' : String(a);
              const valB = b === null || b === undefined ? '' : String(b);
              return valA !== valB;
          };
          const fieldsToTrack: (keyof Equipment)[] = [
            'name', 'assetTag', 'purchaseDate', 'warrantyStartDate', 'warrantyEndDate',
            'status', 'siteId', 'departmentId', 'os', 'ram', 'storage',
            'agentS1', 'agentM42', 'agentME', 'notes', 'operationalStatus'
          ];
          
          fieldsToTrack.forEach(field => {
            if (field in equipmentData && areDifferent(oldEquipment[field], equipmentData[field])) {
              changes.push({
                field: field,
                oldValue: oldEquipment[field],
                newValue: equipmentData[field],
              });
            }
          });
          
          if (changes.length > 0) {
            const newEntry: EditHistoryEntry = {
              id: `hist-${Date.now()}`,
              timestamp: new Date().toISOString(),
              userId: state.currentUser.id,
              entityType: 'equipment',
              entityId: equipmentData.id,
              changes,
            };
            newEditHistory = [newEntry, ...state.editHistory];
          }
        }
      }

      const newEquipmentList = isEditing
        ? state.equipment.map(e => e.id === equipmentData.id ? { ...e, ...equipmentData } as Equipment : e)
        : [{ ...equipmentData, id: `eq-${Date.now()}` } as Equipment, ...state.equipment];
        
      return {
        ...state,
        equipment: newEquipmentList,
        editHistory: newEditHistory,
      };
    }

    case 'IMPORT_EQUIPMENT': {
        const itemsToAdd: Equipment[] = action.payload.map((item, index) => ({
            ...item,
            id: `eq-${Date.now()}-${index}`,
        } as Equipment));
        return { ...state, equipment: [...itemsToAdd, ...state.equipment] };
    }

    case 'IMPORT_USERS': {
        const usersToAdd: User[] = action.payload.map((item, index) => ({
            ...item,
            id: `user-${Date.now()}-${index}`,
        } as User));
        return { ...state, users: [...usersToAdd, ...state.users] };
    }

    case 'SAVE_USER': {
        const userData = action.payload;
        const isEditing = !!userData.id;
        let newEditHistory = state.editHistory;
        
        if (isEditing && userData.id && state.currentUser) {
            const oldUser = state.users.find(u => u.id === userData.id);
            if (oldUser) {
                const changes: ChangeDetail[] = [];
                const areDifferent = (a: any, b: any) => {
                    const valA = a === null || a === undefined ? '' : String(a);
                    const valB = b === null || b === undefined ? '' : String(b);
                    return valA !== valB;
                };
                const fieldsToTrack: (keyof User)[] = ['name', 'role', 'department', 'email', 'managerId'];
                
                fieldsToTrack.forEach(field => {
                    if (field in userData && areDifferent(oldUser[field], (userData as any)[field])) {
                        changes.push({
                            field: field,
                            oldValue: oldUser[field],
                            newValue: (userData as any)[field],
                        });
                    }
                });
                
                if (changes.length > 0) {
                    const newEntry: EditHistoryEntry = {
                        id: `hist-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        userId: state.currentUser.id,
                        entityType: 'user',
                        entityId: userData.id,
                        changes,
                    };
                    newEditHistory = [newEntry, ...state.editHistory];
                }
            }
        }

        const newUserList = isEditing
            ? state.users.map(u => u.id === userData.id ? { ...u, ...userData } as User : u)
            : [{ ...userData, id: `user-${Date.now()}` } as User, ...state.users];
            
        return {
            ...state,
            users: newUserList,
            editHistory: newEditHistory,
        };
    }
    
    case 'SAVE_PIN': {
        return {
            ...state,
            users: state.users.map(u => (u.id === action.payload.userId ? { ...u, pin: action.payload.pin } : u)),
        };
    }

    case 'SAVE_WEBAUTHN_CREDENTIAL': {
        return {
            ...state,
            users: state.users.map(u => (u.id === action.payload.userId ? { ...u, webauthnCredentialId: action.payload.credentialId || undefined } : u)),
        };
    }

    case 'SAVE_CATEGORY': {
        const categoryData = action.payload;
        const isEditing = !!categoryData.id;
        if (isEditing) {
            return {
                ...state,
                categories: state.categories.map(c =>
                    c.id === categoryData.id ? { ...c, ...categoryData } : c
                ),
            };
        } else {
            const newCategory: Category = {
                id: `cat-${Date.now()}`,
                name: categoryData.name,
                description: categoryData.description,
                icon: categoryData.icon,
            };
            return { ...state, categories: [newCategory, ...state.categories] };
        }
    }
    
    case 'SAVE_MODEL': {
        const modelData = action.payload;
        const isEditing = !!modelData.id;
        if (isEditing) {
            return {
                ...state,
                models: state.models.map(m =>
                    m.id === modelData.id ? {
                        ...m,
                        name: modelData.modelName,
                        brand: modelData.brand,
                        categoryId: modelData.type,
                        specifications: modelData.specifications,
                        modelNumber: modelData.modelNumber,
                        imageUrl: modelData.imageUrl,
                    } : m
                ),
            };
        } else {
            const newModel: Model = {
                id: `model-${Date.now()}`,
                name: modelData.modelName,
                brand: modelData.brand,
                categoryId: modelData.type,
                specifications: modelData.specifications,
                modelNumber: modelData.modelNumber,
                imageUrl: modelData.imageUrl,
            };
            return { ...state, models: [newModel, ...state.models] };
        }
    }

    case 'IMPORT_MODELS': {
        const modelsToAdd: Model[] = action.payload.map((item, index) => ({
            ...item,
            id: `model-${Date.now()}-${index}`,
        } as Model));
        return { ...state, models: [...modelsToAdd, ...state.models] };
    }

    case 'DELETE_EQUIPMENT':
      return { ...state, equipment: state.equipment.filter(e => e.id !== action.payload) };
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'DELETE_MODEL':
      return { ...state, models: state.models.filter(m => m.id !== action.payload) };
    case 'BULK_DELETE_EQUIPMENT':
      return { ...state, equipment: state.equipment.filter(e => !action.payload.includes(e.id)) };
    case 'BULK_DELETE_USERS':
      return { ...state, users: state.users.filter(u => !action.payload.includes(u.id)) };
    case 'BULK_UPDATE_STATUS':
      return { ...state, equipment: state.equipment.map(e => action.payload.ids.includes(e.id) ? { ...e, status: action.payload.status } : e) };
    case 'BULK_UPDATE_LOCATION':
      return { ...state, equipment: state.equipment.map(e => action.payload.ids.includes(e.id) ? { ...e, location: action.payload.location } : e) };

    case 'APPROVE_ASSIGNMENT': {
      const { assignmentId, currentUser, actor } = action.payload;
      const assignment = state.assignments.find(a => a.id === assignmentId);
      if (!assignment || !assignment.validation) return state;

      let updatedValidation = { ...assignment.validation };
      let targetActor: ValidationActor | null = null;

      if (actor) {
        targetActor = actor;
      } else if (currentUser.id === assignment.managerId) {
        targetActor = 'manager';
      } else if (currentUser.id === assignment.userId) {
        targetActor = 'user';
      } else if (currentUser.role === UserRole.ADMIN) {
        targetActor = 'it';
      }

      if (!targetActor) {
        return state;
      }

      const validation = assignment.validation;
      let canValidate = false;
      const newValidatedBy: Assignment['validatedBy'] = { ...(assignment.validatedBy || {}) };
      const newValidatedAt: Assignment['validatedAt'] = { ...(assignment.validatedAt || {}) };
      const nowIso = new Date().toISOString();

      const isAssign = assignment.action === FormAction.ASSIGN;
      if (targetActor === 'manager') {
        const prerequisiteMet = isAssign ? validation.it : (validation.it && validation.user);
        if (!validation.manager && prerequisiteMet) {
          updatedValidation.manager = true;
          canValidate = true;
          newValidatedBy.manager = currentUser.id;
          newValidatedAt.manager = nowIso;
        }
      } else if (targetActor === 'user') {
        const prerequisiteMet = isAssign ? (validation.it && validation.manager) : validation.it;
        if (!validation.user && prerequisiteMet) {
          updatedValidation.user = true;
          canValidate = true;
          newValidatedBy.user = currentUser.id;
          newValidatedAt.user = nowIso;
        }
      } else if (targetActor === 'it') {
        if (!validation.it) {
          updatedValidation.it = true;
          canValidate = true;
          newValidatedBy.it = currentUser.id;
          newValidatedAt.it = nowIso;
        }
      }

      if (!canValidate) {
        return state;
      }

      const isFullyApproved = updatedValidation.it && updatedValidation.manager && updatedValidation.user;
      const newAssignmentStatus = isFullyApproved ? AssignmentStatus.APPROVED : assignment.status;
      
      const newEquipmentStatus = isFullyApproved
        ? (assignment.action === FormAction.ASSIGN ? EquipmentStatus.ASSIGNED : EquipmentStatus.AVAILABLE)
        : EquipmentStatus.PENDING_VALIDATION;

      return {
        ...state,
        assignments: state.assignments.map(a =>
          a.id === assignmentId
            ? { ...a, validation: updatedValidation, status: newAssignmentStatus, validatedBy: newValidatedBy, validatedAt: newValidatedAt }
            : a
        ),
        equipment: isFullyApproved
          ? state.equipment.map(item =>
              item.id === assignment.equipmentId
                ? { ...item, status: newEquipmentStatus, pendingAssignmentId: undefined }
                : item
            )
          : state.equipment,
      };
    }

    case 'REJECT_ASSIGNMENT': {
        const { assignmentId, reason } = action.payload;
        const assignment = state.assignments.find(a => a.id === assignmentId);
        if (!assignment) return state;
        return {
            ...state,
            assignments: state.assignments.map(a => 
                a.id === assignmentId ? { ...a, status: AssignmentStatus.REJECTED, rejectionReason: reason } : a
            ),
            equipment: state.equipment.map(e =>
                e.id === assignment.equipmentId ? {...e, status: EquipmentStatus.AVAILABLE, pendingAssignmentId: undefined} : e
            ),
        };
    }

    case 'REVERT_ASSIGNMENT_VALIDATION': {
      const { assignmentId, actor } = action.payload;
      const assignment = state.assignments.find(a => a.id === assignmentId);
      if (!assignment || !assignment.validation) return state;

      const prevFullyApproved = assignment.validation.it && assignment.validation.manager && assignment.validation.user;

      const updatedValidation = { ...assignment.validation };
      const updatedValidatedBy: Assignment['validatedBy'] = { ...(assignment.validatedBy || {}) };
      const updatedValidatedAt: Assignment['validatedAt'] = { ...(assignment.validatedAt || {}) };
      if (actor === 'it') {
        updatedValidation.it = false;
        if (updatedValidatedBy) delete updatedValidatedBy.it;
        if (updatedValidatedAt) delete updatedValidatedAt.it;
      } else if (actor === 'manager') {
        updatedValidation.manager = false;
        if (updatedValidatedBy) delete updatedValidatedBy.manager;
        if (updatedValidatedAt) delete updatedValidatedAt.manager;
      } else if (actor === 'user') {
        updatedValidation.user = false;
        if (updatedValidatedBy) delete updatedValidatedBy.user;
        if (updatedValidatedAt) delete updatedValidatedAt.user;
      }

      const nowFullyApproved = updatedValidation.it && updatedValidation.manager && updatedValidation.user;
      const newAssignmentStatus = nowFullyApproved ? AssignmentStatus.APPROVED : AssignmentStatus.PENDING;

      return {
        ...state,
        assignments: state.assignments.map(a => a.id === assignmentId ? { ...a, validation: updatedValidation, validatedBy: updatedValidatedBy, validatedAt: updatedValidatedAt, status: newAssignmentStatus } : a),
        equipment: prevFullyApproved && !nowFullyApproved
          ? state.equipment.map(item => item.id === assignment.equipmentId ? { ...item, status: EquipmentStatus.PENDING_VALIDATION, pendingAssignmentId: assignmentId } : item)
          : state.equipment,
      };
    }

    case 'RESTORE_REJECTED_ASSIGNMENT': {
      const { assignmentId } = action.payload;
      const assignment = state.assignments.find(a => a.id === assignmentId);
      if (!assignment) return state;
      return {
        ...state,
        assignments: state.assignments.map(a => a.id === assignmentId ? { ...a, status: AssignmentStatus.PENDING, rejectionReason: undefined } : a),
        equipment: state.equipment.map(e => e.id === assignment.equipmentId ? { ...e, status: EquipmentStatus.PENDING_VALIDATION, pendingAssignmentId: assignmentId } : e),
      };
    }
    
    case 'LOG_AUDIT_EVENT': {
        const { user, action: auditAction, entityType, entityName } = action.payload;
        const newLogEntry: AuditLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: user.name,
            action: auditAction,
            entityType,
            entityName,
        };
        return { ...state, auditLog: [newLogEntry, ...state.auditLog] };
    }

    // Location Management
    case 'SAVE_COUNTRY': {
        const { id, name } = action.payload;
        if (id) { // Editing
            return { ...state, countries: state.countries.map(c => c.id === id ? { ...c, name: name! } : c) };
        } else { // Adding
            const newCountry: Country = { id: `country-${Date.now()}`, name: name! };
            return { ...state, countries: [...state.countries, newCountry] };
        }
    }
    case 'DELETE_COUNTRY':
        return { ...state, countries: state.countries.filter(c => c.id !== action.payload) };

    case 'SAVE_SITE': {
        const { id, name, countryId } = action.payload;
        if (id) { // Editing
            return { ...state, sites: state.sites.map(s => s.id === id ? { ...s, name: name!, countryId: countryId! } : s) };
        } else { // Adding
            const newSite: Site = { id: `site-${Date.now()}`, name: name!, countryId: countryId! };
            return { ...state, sites: [...state.sites, newSite] };
        }
    }
    case 'DELETE_SITE':
        return { ...state, sites: state.sites.filter(s => s.id !== action.payload) };
        
    case 'SAVE_DEPARTMENT': {
        const { id, name, siteId } = action.payload;
        if (id) { // Editing
            return { ...state, departments: state.departments.map(d => d.id === id ? { ...d, name: name!, siteId: siteId! } : d) };
        } else { // Adding
            const newDepartment: Department = { id: `dept-${Date.now()}`, name: name!, siteId: siteId! };
            return { ...state, departments: [...state.departments, newDepartment] };
        }
    }
    case 'DELETE_DEPARTMENT':
        return { ...state, departments: state.departments.filter(d => d.id !== action.payload) };
    
    case 'IMPORT_LOCATIONS': {
        const { countries, sites, departments } = action.payload;
        const newCountries: Country[] = countries.map((c, i) => ({ ...c, id: `country-${Date.now()}-${i}` } as Country));
        const newSites: Site[] = sites.map((s, i) => ({ ...s, id: `site-${Date.now()}-${i}` } as Site));
        const newDepartments: Department[] = departments.map((d, i) => ({ ...d, id: `dept-${Date.now()}-${i}` } as Department));
        
        return {
            ...state,
            countries: [...state.countries, ...newCountries],
            sites: [...state.sites, ...newSites],
            departments: [...state.departments, ...newDepartments],
        };
    }

    // Audit Management
    case 'START_AUDIT_SESSION': {
      const { departmentId, userId } = action.payload;
      const existingSession = state.auditSessions.find(s => s.departmentId === departmentId && (s.status === 'in-progress' || s.status === 'paused'));
      
      if (existingSession) {
        return { ...state, auditSessions: state.auditSessions.map(s => s.id === existingSession.id ? { ...s, status: 'in-progress', updatedAt: new Date().toISOString() } : s) };
      } else {
        const newSession: AuditSession = {
          id: `audit-${Date.now()}`,
          departmentId,
          startedByUserId: userId,
          status: 'in-progress',
          scannedItemIds: [],
          unexpectedItems: [],
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { ...state, auditSessions: [newSession, ...state.auditSessions] };
      }
    }
    case 'PAUSE_AUDIT_SESSION': {
      return { ...state, auditSessions: state.auditSessions.map(s => s.id === action.payload.sessionId ? { ...s, status: 'paused', updatedAt: new Date().toISOString() } : s) };
    }
    case 'CANCEL_AUDIT_SESSION': {
      return { ...state, auditSessions: state.auditSessions.filter(s => s.id !== action.payload.sessionId) };
    }
    case 'COMPLETE_AUDIT_SESSION': {
      return { ...state, auditSessions: state.auditSessions.map(s => s.id === action.payload.sessionId ? { ...s, status: 'completed', updatedAt: new Date().toISOString() } : s) };
    }
    case 'UPDATE_AUDIT_SESSION_SCAN': {
      const { sessionId, scannedItemId, unexpectedItem } = action.payload;
      return {
        ...state,
        auditSessions: state.auditSessions.map(s => {
          if (s.id === sessionId) {
            const updatedSession = { ...s, updatedAt: new Date().toISOString() };
            if (scannedItemId && !s.scannedItemIds.includes(scannedItemId)) {
              updatedSession.scannedItemIds = [...s.scannedItemIds, scannedItemId];
            }
            if (unexpectedItem) {
              updatedSession.unexpectedItems = [...s.unexpectedItems, unexpectedItem];
            }
            return updatedSession;
          }
          return s;
        })
      };
    }

    default:
      return state;
  }
};


// 5. Context and Provider
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

// 6. Custom Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};