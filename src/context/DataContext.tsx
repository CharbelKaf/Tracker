import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
    User,
    Equipment,
    Approval,
    HistoryEvent,
    Category,
    Model,
    AppSettings,
    ApprovalStatus,
    FinanceExpense,
    FinanceBudget,
    FinanceExpenseType,
    FinanceExpenseInsertResult,
} from '../types';
import { mockAllUsersExtended, mockAllEquipment, mockLocationCountries, mockPendingApprovals, mockApprovalHistory, mockHistoryEvents, mockCategories, mockModels, CATEGORY_ICONS } from '../data/mockData';
import { mockFinanceBudgets, mockFinanceExpenses } from '../data/mockFinanceData';
import { useAuth } from './AuthContext';
import { applyMd3Theme } from '../lib/md3Theme';
import {
    ACTIVE_APPROVAL_STATUSES,
    BusinessRuleDecision,
    canDeleteEquipmentByBusinessRule,
    canDeleteUserByBusinessRule,
    canTransitionApprovalStatus,
    canUpdateUserByBusinessRule,
    getEquipmentUpdatesForApprovalStatus,
    MANAGER_VALIDATION_PENDING_STATUSES,
} from '../lib/businessRules';

// Structure des données de localisation pour la cascade
interface LocationData {
    countries: string[];
    sites: Record<string, string[]>; // Clé: Pays -> Valeur: Liste de sites
    services: Record<string, string[]>; // Clé: Site -> Valeur: Liste de services
}

interface DataContextType {
    users: User[];
    equipment: Equipment[];
    categories: Category[];
    models: Model[];
    approvals: Approval[];
    events: HistoryEvent[];
    locationData: LocationData;
    serviceManagers: Record<string, string>; // NOUVEAU: Mapping Service Name -> Manager ID
    settings: AppSettings;
    financeExpenses: FinanceExpense[];
    financeBudgets: FinanceBudget[];

    addUser: (user: User) => BusinessRuleDecision;
    updateUser: (id: string, updates: Partial<User>) => BusinessRuleDecision;
    deleteUser: (id: string) => BusinessRuleDecision;
    addEquipment: (item: Equipment) => void;
    updateEquipment: (id: string, updates: Partial<Equipment>, logMetadata?: Record<string, unknown>) => void;
    deleteEquipment: (id: string) => boolean;
    updateApproval: (id: string, status: ApprovalStatus) => BusinessRuleDecision;
    addApproval: (approval: Omit<Approval, 'id'>) => void;
    logEvent: (event: Omit<HistoryEvent, 'id' | 'timestamp'>) => void;

    addLocation: (type: 'country' | 'site' | 'service', name: string, parentId?: string) => boolean;
    renameLocation: (type: 'country' | 'site' | 'service', oldName: string, newName: string, parentId?: string) => boolean;
    deleteLocation: (type: 'country' | 'site' | 'service', name: string, parentId?: string) => void;
    assignManagerToService: (serviceName: string, managerId: string) => void; // NOUVEAU

    // Category CRUD
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => boolean;

    // Model CRUD
    addModel: (model: Omit<Model, 'id'>) => void;
    updateModel: (id: string, updates: Partial<Model>) => void;
    deleteModel: (id: string) => boolean;

    // Global Settings
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    addFinanceExpense: (expense: Omit<FinanceExpense, 'id' | 'createdAt'>) => FinanceExpenseInsertResult;
    upsertFinanceBudget: (budget: Omit<FinanceBudget, 'updatedAt'> & { updatedAt?: string }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'system',
    accentColor: 'yellow',
    currency: 'EUR',
    fiscalYearStart: '01',
    defaultDepreciationMethod: 'linear',
    defaultDepreciationYears: 3,
    salvageValuePercent: 0,
    renewalThreshold: 85,
    roundingRule: 'standard',
    compactNotation: false
};

const STORAGE_KEYS = {
    settings: { current: 'tracker_settings', legacy: 'neemba_settings' },
    users: { current: 'tracker_users', legacy: 'neemba_users' },
    equipment: { current: 'tracker_equipment', legacy: 'neemba_equipment' },
    categories: { current: 'tracker_categories', legacy: 'neemba_categories' },
    models: { current: 'tracker_models', legacy: 'neemba_models' },
    events: { current: 'tracker_events', legacy: 'neemba_events' },
    serviceManagers: { current: 'tracker_service_managers', legacy: 'neemba_service_managers' },
    financeExpenses: { current: 'tracker_finance_expenses', legacy: 'neemba_finance_expenses' },
    financeBudgets: { current: 'tracker_finance_budgets', legacy: 'neemba_finance_budgets' },
} as const;

const getPersistedValue = (currentKey: string, legacyKey: string): string | null => {
    const currentValue = localStorage.getItem(currentKey);
    if (currentValue !== null) {
        return currentValue;
    }

    const legacyValue = localStorage.getItem(legacyKey);
    if (legacyValue !== null) {
        localStorage.setItem(currentKey, legacyValue);
        localStorage.removeItem(legacyKey);
        return legacyValue;
    }

    return null;
};

const extractPersistedIds = (items: unknown[]): Set<string> => {
    const ids = items
        .map((item) => {
            if (typeof item !== 'object' || item === null || !('id' in item)) return undefined;
            const rawId = (item as { id?: unknown }).id;
            return typeof rawId === 'string' ? rawId : undefined;
        })
        .filter((id): id is string => typeof id === 'string');

    return new Set(ids);
};

const getBudgetCategoryByExpenseType = (type: FinanceExpenseType): string => {
    if (type === 'Purchase') return 'Matériel IT';
    if (type === 'License') return 'Licences Logiciel';
    if (type === 'Cloud') return 'Cloud Infrastructure';
    return 'Maintenance & Services';
};

const normalizeValueForFingerprint = (value: string | undefined): string => {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const buildExpenseFingerprint = (expense: Pick<FinanceExpense, 'supplier' | 'invoiceNumber' | 'amount' | 'date'>): string => {
    const supplier = normalizeValueForFingerprint(expense.supplier);
    const invoice = normalizeValueForFingerprint(expense.invoiceNumber || '');
    const amount = Number(expense.amount || 0).toFixed(2);
    const date = normalizeValueForFingerprint(expense.date || '');
    return `${supplier}|${invoice}|${amount}|${date}`;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();

    // --- SETTINGS ---
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.settings.current, STORAGE_KEYS.settings.legacy);
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    // --- USERS & EQUIPMENT ---
    const [users, setUsers] = useState<User[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.users.current, STORAGE_KEYS.users.legacy);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const merged = [...parsed];
                    const ids = extractPersistedIds(parsed);
                    mockAllUsersExtended.forEach(seedUser => {
                        if (!ids.has(seedUser.id)) {
                            merged.push(seedUser);
                        }
                    });
                    return merged;
                }
            }
            return mockAllUsersExtended;
        } catch {
            return mockAllUsersExtended;
        }
    });

    const [equipment, setEquipment] = useState<Equipment[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.equipment.current, STORAGE_KEYS.equipment.legacy);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const merged = [...parsed];
                    const ids = extractPersistedIds(parsed);
                    mockAllEquipment.forEach(seedEquipment => {
                        if (!ids.has(seedEquipment.id)) {
                            merged.push(seedEquipment);
                        }
                    });
                    return merged;
                }
            }
            return mockAllEquipment;
        } catch {
            return mockAllEquipment;
        }
    });

    // --- CATEGORIES ---
    const [categories, setCategories] = useState<Category[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.categories.current, STORAGE_KEYS.categories.legacy);
            if (!saved) return mockCategories;

            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return mockCategories;
            // Re-inflate icons as React components
            return parsed.map((cat) => {
                const categoryData = (typeof cat === 'object' && cat !== null
                    ? cat
                    : {}) as Partial<Category> & { iconName?: string };

                return {
                    ...categoryData,
                    icon: CATEGORY_ICONS[categoryData.iconName || 'Laptop'] || CATEGORY_ICONS['Laptop']
                } as Category;
            });
        } catch {
            return mockCategories;
        }
    });

    // --- MODELS ---
    const [models, setModels] = useState<Model[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.models.current, STORAGE_KEYS.models.legacy);
            return saved ? JSON.parse(saved) : mockModels;
        } catch {
            return mockModels;
        }
    });

    // --- APPROVALS ---
    const [approvals, setApprovals] = useState<Approval[]>([...mockPendingApprovals, ...mockApprovalHistory]);

    // --- HISTORY EVENTS ---
    const [events, setEvents] = useState<HistoryEvent[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.events.current, STORAGE_KEYS.events.legacy);
            return saved ? JSON.parse(saved) : mockHistoryEvents;
        } catch {
            return mockHistoryEvents;
        }
    });

    // --- FINANCE ---
    const [financeExpenses, setFinanceExpenses] = useState<FinanceExpense[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.financeExpenses.current, STORAGE_KEYS.financeExpenses.legacy);
            if (!saved) return mockFinanceExpenses;

            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : mockFinanceExpenses;
        } catch {
            return mockFinanceExpenses;
        }
    });

    const [financeBudgets, setFinanceBudgets] = useState<FinanceBudget[]>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.financeBudgets.current, STORAGE_KEYS.financeBudgets.legacy);
            if (!saved) return mockFinanceBudgets;

            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : mockFinanceBudgets;
        } catch {
            return mockFinanceBudgets;
        }
    });

    // --- LOCATIONS MANAGEMENT ---
    const [locationData, setLocationData] = useState<LocationData>(() => {
        return {
            countries: mockLocationCountries,
            sites: {
                'France': ['Bureau Paris', 'Bureau Lyon'],
                'Sénégal': ['Campus Dakar'],
                'Togo': ['Lomé Siège']
            },
            services: {
                'Bureau Paris': ['IT', 'Marketing Europe', 'Finance'],
                'Bureau Lyon': ['Commercial'],
                'Campus Dakar': ['Support Afrique', 'Engineering'],
                'Lomé Siège': ['Direction']
            }
        };
    });

    // --- SERVICE MANAGERS (New) ---
    const [serviceManagers, setServiceManagers] = useState<Record<string, string>>(() => {
        try {
            const saved = getPersistedValue(STORAGE_KEYS.serviceManagers.current, STORAGE_KEYS.serviceManagers.legacy);
            // Mock initial: Jane Manager gère 'Sales' et 'Marketing'
            return saved ? JSON.parse(saved) : {
                'Sales': '3',
                'Marketing': '3',
                'Marketing Europe': '3',
                'Commercial': '3'
            };
        } catch {
            return {};
        }
    });

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.users.current, JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.equipment.current, JSON.stringify(equipment));
    }, [equipment]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.categories.current, JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.models.current, JSON.stringify(models));
    }, [models]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.events.current, JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.settings.current, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.serviceManagers.current, JSON.stringify(serviceManagers));
    }, [serviceManagers]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.financeExpenses.current, JSON.stringify(financeExpenses));
    }, [financeExpenses]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.financeBudgets.current, JSON.stringify(financeBudgets));
    }, [financeBudgets]);

    // --- THEME & ACCENT COLOR APPLICATION ---
    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const syncTheme = () => {
            applyMd3Theme({
                root,
                accentColor: settings.accentColor,
                themeMode: settings.theme,
                prefersDark: mediaQuery.matches,
            });
        };

        syncTheme();

        if (settings.theme !== 'system') {
            return;
        }

        const onSystemThemeChange = () => syncTheme();
        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', onSystemThemeChange);
            return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
        }

        mediaQuery.addListener(onSystemThemeChange);
        return () => mediaQuery.removeListener(onSystemThemeChange);
    }, [settings.accentColor, settings.theme]);

    const logEvent = useCallback((eventData: Omit<HistoryEvent, 'id' | 'timestamp'>) => {
        const newEvent: HistoryEvent = {
            ...eventData,
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
        };
        setEvents(prev => [newEvent, ...prev]);
    }, []);

    const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    const addFinanceExpense = useCallback((expenseData: Omit<FinanceExpense, 'id' | 'createdAt'>): FinanceExpenseInsertResult => {
        const now = new Date().toISOString();
        const computedFingerprint = expenseData.importFingerprint || buildExpenseFingerprint({
            supplier: expenseData.supplier,
            invoiceNumber: expenseData.invoiceNumber,
            amount: expenseData.amount,
            date: expenseData.date,
        });

        const duplicateExpense = financeExpenses.find((existing) => {
            if (existing.importFingerprint && existing.importFingerprint === computedFingerprint) {
                return true;
            }

            const sameInvoice = existing.invoiceNumber
                && expenseData.invoiceNumber
                && normalizeValueForFingerprint(existing.invoiceNumber) === normalizeValueForFingerprint(expenseData.invoiceNumber);
            const sameSupplier = normalizeValueForFingerprint(existing.supplier) === normalizeValueForFingerprint(expenseData.supplier);
            const sameAmount = Number(existing.amount).toFixed(2) === Number(expenseData.amount).toFixed(2);
            const sameDate = existing.date === expenseData.date;

            if (sameInvoice && sameSupplier && sameAmount) return true;
            if (existing.sourceFileName && expenseData.sourceFileName && existing.sourceFileName === expenseData.sourceFileName && sameAmount) {
                return true;
            }

            return sameSupplier && sameAmount && sameDate;
        });

        if (duplicateExpense) {
            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'Admin',
                targetType: 'SYSTEM',
                targetId: duplicateExpense.id,
                targetName: `Dépense ${duplicateExpense.supplier}`,
                description: `Tentative d'import dupliqué ignorée (${expenseData.supplier})`,
                metadata: {
                    duplicateOf: duplicateExpense.id,
                    sourceFileName: expenseData.sourceFileName || null,
                    invoiceNumber: expenseData.invoiceNumber || null,
                },
                isSystem: false,
                isSensitive: false,
            });

            return {
                ok: false,
                duplicateOf: duplicateExpense,
                reason: 'duplicate',
            };
        }

        const createdAt = now;
        const newExpense: FinanceExpense = {
            ...expenseData,
            id: `expense_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt,
            importFingerprint: computedFingerprint,
        };

        const expenseYear = Number(newExpense.date.slice(0, 4)) || new Date().getFullYear();
        const budgetCategory = getBudgetCategoryByExpenseType(newExpense.type);

        setFinanceExpenses(prev => [newExpense, ...prev]);
        setFinanceBudgets(prev => {
            const targetBudget = prev.find(budget => budget.year === expenseYear);

            if (!targetBudget) {
                const createdBudget: FinanceBudget = {
                    year: expenseYear,
                    status: expenseYear < new Date().getFullYear() ? 'Clôturé' : 'En cours',
                    totalAllocated: newExpense.amount,
                    items: [{
                        category: budgetCategory,
                        type: newExpense.type,
                        allocated: newExpense.amount,
                        spent: newExpense.amount,
                    }],
                    updatedAt: createdAt,
                    sourceFileName: newExpense.sourceFileName,
                };

                return [createdBudget, ...prev].sort((a, b) => b.year - a.year);
            }

            const hasCategory = targetBudget.items.some((item) => item.category === budgetCategory);
            const updatedItems = hasCategory
                ? targetBudget.items.map((item) => item.category === budgetCategory
                    ? { ...item, spent: item.spent + newExpense.amount }
                    : item)
                : [
                    ...targetBudget.items,
                    {
                        category: budgetCategory,
                        type: newExpense.type,
                        allocated: newExpense.amount,
                        spent: newExpense.amount,
                    },
                ];

            const updatedBudget: FinanceBudget = {
                ...targetBudget,
                items: updatedItems,
                totalAllocated: hasCategory ? targetBudget.totalAllocated : targetBudget.totalAllocated + newExpense.amount,
                updatedAt: createdAt,
            };

            return prev
                .map((budget) => budget.year === expenseYear ? updatedBudget : budget)
                .sort((a, b) => b.year - a.year);
        });

        logEvent({
            type: 'UPDATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'Admin',
            targetType: 'SYSTEM',
            targetId: newExpense.id,
            targetName: `Dépense ${newExpense.supplier}`,
            description: `Nouvelle dépense enregistrée (${newExpense.supplier})`,
            metadata: {
                amount: newExpense.amount,
                type: newExpense.type,
                date: newExpense.date,
                invoiceNumber: newExpense.invoiceNumber || null,
            },
            isSystem: false,
            isSensitive: false,
        });

        return {
            ok: true,
            expense: newExpense,
        };
    }, [currentUser, logEvent, financeExpenses]);

    const upsertFinanceBudget = useCallback((budgetData: Omit<FinanceBudget, 'updatedAt'> & { updatedAt?: string }) => {
        const updatedBudget: FinanceBudget = {
            ...budgetData,
            updatedAt: budgetData.updatedAt || new Date().toISOString(),
        };

        setFinanceBudgets(prev => {
            const hasYear = prev.some(budget => budget.year === updatedBudget.year);
            const next = hasYear
                ? prev.map(budget => budget.year === updatedBudget.year ? updatedBudget : budget)
                : [...prev, updatedBudget];

            return next.sort((a, b) => b.year - a.year);
        });

        logEvent({
            type: 'UPDATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'Admin',
            targetType: 'SYSTEM',
            targetId: `budget_${updatedBudget.year}`,
            targetName: `Budget ${updatedBudget.year}`,
            description: `Budget ${updatedBudget.year} enregistré`,
            metadata: {
                totalAllocated: updatedBudget.totalAllocated,
                lineCount: updatedBudget.items.length,
                sourceFileName: updatedBudget.sourceFileName || null,
            },
            isSystem: false,
            isSensitive: false,
        });
    }, [currentUser, logEvent]);

    const assignManagerToService = useCallback((serviceName: string, managerId: string) => {
        setServiceManagers(prev => ({ ...prev, [serviceName]: managerId }));

        // OPTIONNEL : Mettre à jour rétroactivement les utilisateurs existants de ce service ?
        // Pour l'instant, on laisse l'existant tel quel, la règle s'applique aux nouveaux/modifiés.
    }, []);

    const addUser = useCallback((user: User): BusinessRuleDecision => {
        if (user.role === 'SuperAdmin' && currentUser?.role !== 'SuperAdmin') {
            return {
                allowed: false,
                reason: 'Seul un SuperAdmin peut créer un compte SuperAdmin.',
            };
        }

        const newId = Date.now().toString();

        // AUTOMATIC MANAGER ASSIGNMENT
        const finalUser = user.department && serviceManagers[user.department]
            ? { ...user, id: newId, managerId: serviceManagers[user.department] }
            : { ...user, id: newId };

        logEvent({
            type: 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'USER',
            targetId: newId,
            targetName: user.name,
            description: `Création de l'utilisateur ${user.name}`,
            isSystem: false,
            isSensitive: false
        });

        // LOGIQUE DE NOTIFICATION AUTOMATIQUE AU MANAGER
        if (finalUser.managerId) {
            const manager = users.find(u => u.id === finalUser.managerId);
            if (manager) {
                logEvent({
                    type: 'UPDATE', // Utilisation d'un type générique pour "Notification système"
                    actorId: 'system',
                    actorName: 'Système',
                    actorRole: 'SuperAdmin',
                    targetType: 'USER',
                    targetId: finalUser.managerId,
                    targetName: manager.name,
                    description: `Notification d'effectif : ${finalUser.name} a rejoint l'équipe de ${manager.name} (Service: ${finalUser.department}).`,
                    isSystem: true,
                    isSensitive: false
                });
            }
        }

        setUsers(prev => [...prev, finalUser]);
        return { allowed: true };
    }, [currentUser, logEvent, users, serviceManagers]);

    const updateUser = useCallback((id: string, updates: Partial<User>): BusinessRuleDecision => {
        const oldUser = users.find(u => u.id === id);
        if (!oldUser) {
            return { allowed: false, reason: 'Utilisateur introuvable.' };
        }

        const finalUpdates = updates.department && serviceManagers[updates.department]
            ? { ...updates, managerId: serviceManagers[updates.department] }
            : { ...updates };

        const hasActiveApprovals = approvals.some((approval) =>
            ACTIVE_APPROVAL_STATUSES.includes(approval.status)
            && (approval.requesterId === id || approval.beneficiaryId === id),
        );
        const hasPendingManagerValidations = approvals.some((approval) =>
            MANAGER_VALIDATION_PENDING_STATUSES.includes(approval.status)
            && (approval.requesterId === id || approval.beneficiaryId === id),
        );

        const updateDecision = canUpdateUserByBusinessRule({
            user: oldUser,
            updates: finalUpdates,
            hasActiveApprovals,
            hasPendingManagerValidations,
            actorRole: currentUser?.role,
        });
        if (!updateDecision.allowed) {
            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'SuperAdmin',
                targetType: 'USER',
                targetId: id,
                targetName: oldUser.name,
                description: `Mise à jour refusée pour ${oldUser.name}`,
                metadata: {
                    reason: updateDecision.reason,
                    attemptedUpdates: finalUpdates,
                },
                isSystem: false,
                isSensitive: true,
            });
            return updateDecision;
        }

        logEvent({
            type: 'UPDATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'USER',
            targetId: id,
            targetName: oldUser.name,
            description: `Mise à jour du profil de ${oldUser.name}`,
            isSystem: false,
            isSensitive: false
        });

        // Nouvelle notif si changement de département/manager
        if (finalUpdates.managerId && finalUpdates.managerId !== oldUser.managerId) {
            const newManager = users.find(u => u.id === finalUpdates.managerId);
            if (newManager) {
                logEvent({
                    type: 'UPDATE',
                    actorId: 'system',
                    actorName: 'Système',
                    actorRole: 'SuperAdmin',
                    targetType: 'USER',
                    targetId: finalUpdates.managerId,
                    targetName: newManager.name,
                    description: `Notification d'effectif : ${oldUser.name} a rejoint l'équipe de ${newManager.name}.`,
                    isSystem: true,
                    isSensitive: false
                });
            }
        }
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...finalUpdates } : u));
        return { allowed: true };
    }, [users, approvals, currentUser, logEvent, serviceManagers]);

    const deleteUser = useCallback((id: string): BusinessRuleDecision => {
        const userToDelete = users.find(u => u.id === id);
        if (!userToDelete) {
            return { allowed: false, reason: 'Utilisateur introuvable.' };
        }

        const hasEquipment = equipment.some(e => e.user?.id === id || e.user?.name === userToDelete.name);
        const hasActiveApprovals = approvals.some((approval) =>
            ACTIVE_APPROVAL_STATUSES.includes(approval.status)
            && (approval.requesterId === id || approval.beneficiaryId === id),
        );
        const activeSuperAdminCount = users.filter(
            (existingUser) => existingUser.role === 'SuperAdmin' && existingUser.status !== 'inactive',
        ).length;
        const deleteDecision = canDeleteUserByBusinessRule({
            hasAssignedEquipment: hasEquipment,
            hasActiveApprovals,
            actorRole: currentUser?.role,
            targetRole: userToDelete.role,
            isSelfDelete: currentUser?.id === id,
            activeSuperAdminCount,
        });
        if (!deleteDecision.allowed) {
            return deleteDecision;
        }

        setUsers(prev => prev.filter(u => u.id !== id));

        logEvent({
            type: 'DELETE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'USER',
            targetId: id,
            targetName: userToDelete.name,
            description: `Suppression de l'utilisateur ${userToDelete.name}`,
            isSystem: false,
            isSensitive: false
        });
        return { allowed: true };
    }, [users, equipment, approvals, currentUser, logEvent]);

    // ... (Equipment CRUD, Approval, etc. kept same, abbreviated for brevity)
    // Re-inserting existing Equipment logic to not break file
    const addEquipment = useCallback((item: Equipment) => {
        const newItem = { ...item, id: item.id || Date.now().toString() };
        setEquipment(prev => [...prev, newItem]);
        logEvent({
            type: 'CREATE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'EQUIPMENT',
            targetId: newItem.id,
            targetName: newItem.name,
            description: `Création de l'équipement ${newItem.name}`,
            metadata: { snapshot: newItem },
            isSystem: false,
            isSensitive: false
        });
    }, [currentUser, logEvent]);

    const updateEquipment = useCallback((id: string, updates: Partial<Equipment>, logMetadata?: Record<string, unknown>) => {
        const oldItem = equipment.find(e => e.id === id);
        if (oldItem) {
            const nextItem = { ...oldItem, ...updates };
            const oldUserId = oldItem.user?.id;
            const nextUserId = nextItem.user?.id;
            const nextUserName = nextItem.user?.name || 'utilisateur';
            let eventType: HistoryEvent['type'] = 'UPDATE';
            let description = `Mise à jour équipement`;
            const metadata: Record<string, unknown> = {
                ...(logMetadata || {}),
                fromStatus: oldItem.status,
                toStatus: nextItem.status,
                fromAssignmentStatus: oldItem.assignmentStatus || 'NONE',
                toAssignmentStatus: nextItem.assignmentStatus || 'NONE',
            };
            if (nextUserId) {
                metadata.beneficiaryId = nextUserId;
                metadata.beneficiaryName = nextUserName;
            }
            if (oldUserId && oldUserId !== nextUserId) {
                metadata.previousUserId = oldUserId;
                metadata.previousUser = oldItem.user?.name || null;
            }

            if (!oldUserId && nextUserId) {
                if (nextItem.assignmentStatus === 'CONFIRMED' || nextItem.status === 'Attribué') {
                    eventType = 'ASSIGN_CONFIRMED';
                    description = `Équipement attribué à ${nextUserName}`;
                } else if (nextItem.assignmentStatus === 'WAITING_MANAGER_APPROVAL') {
                    eventType = 'ASSIGN_MANAGER_WAIT';
                    description = `Attribution initiée pour ${nextUserName} (validation manager requise)`;
                } else if (nextItem.assignmentStatus === 'WAITING_DOTATION_APPROVAL') {
                    eventType = 'ASSIGN_DOTATION_WAIT';
                    description = `Équipement proposé pour ${nextUserName} (validation de dotation en attente)`;
                } else {
                    eventType = 'ASSIGN_PENDING';
                    description = `Attribution initiée pour ${nextUserName}`;
                }
            } else if (oldUserId && !nextUserId) {
                eventType = 'RETURN';
                if (oldItem.assignmentStatus === 'PENDING_RETURN') {
                    description = nextItem.status === 'En réparation'
                        ? `Restitution inspectée: équipement orienté en réparation`
                        : `Restitution inspectée: équipement remis en stock`;
                } else {
                    description = `Retour de l'équipement (${oldItem.user?.name || 'utilisateur'})`;
                }
            } else if (oldItem.status !== 'En réparation' && nextItem.status === 'En réparation') {
                eventType = 'REPAIR_START';
                description = `Entrée en maintenance`;
            } else if (oldItem.status === 'En réparation' && nextItem.status !== 'En réparation') {
                eventType = 'REPAIR_END';
                description = `Fin de maintenance`;
            } else if (oldItem.assignmentStatus !== nextItem.assignmentStatus) {
                if (nextItem.assignmentStatus === 'WAITING_MANAGER_APPROVAL') {
                    eventType = 'ASSIGN_MANAGER_WAIT';
                    description = `En attente de validation manager`;
                } else if (nextItem.assignmentStatus === 'WAITING_IT_PROCESSING') {
                    eventType = 'ASSIGN_IT_PROCESSING';
                    description = `Validation manager reçue, traitement IT en cours`;
                } else if (nextItem.assignmentStatus === 'WAITING_DOTATION_APPROVAL') {
                    eventType = 'ASSIGN_DOTATION_WAIT';
                    description = `En attente de validation de dotation`;
                } else if (nextItem.assignmentStatus === 'PENDING_DELIVERY') {
                    eventType = 'ASSIGN_PENDING';
                    description = `En attente de confirmation utilisateur`;
                } else if (nextItem.assignmentStatus === 'PENDING_RETURN') {
                    eventType = 'RETURN';
                    description = `Restitution initiée, en attente d'inspection IT`;
                    if (nextUserId) {
                        metadata.beneficiaryId = nextUserId;
                        metadata.beneficiaryName = nextUserName;
                    }
                } else if (nextItem.assignmentStatus === 'CONFIRMED') {
                    eventType = 'ASSIGN_CONFIRMED';
                    description = `Réception confirmée par l'utilisateur`;
                    if (nextUserId) {
                        metadata.beneficiaryId = nextUserId;
                        metadata.beneficiaryName = nextUserName;
                    }
                } else if (nextItem.assignmentStatus === 'DISPUTED') {
                    eventType = 'ASSIGN_DISPUTED';
                    description = `Litige utilisateur déclaré`;
                }
            } else if (oldItem.status !== nextItem.status) {
                description = `Statut modifié: ${oldItem.status} → ${nextItem.status}`;
            } else if (oldItem.user?.id !== nextItem.user?.id) {
                description = nextItem.user
                    ? `Réaffectation vers ${nextItem.user.name}`
                    : `Utilisateur retiré`;
            }

            logEvent({
                type: eventType,
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'SuperAdmin',
                targetType: 'EQUIPMENT',
                targetId: id,
                targetName: oldItem.name,
                description,
                metadata,
                isSystem: false,
                isSensitive: false
            });
        }
        setEquipment(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }, [equipment, currentUser, logEvent]);

    const deleteEquipment = useCallback((id: string) => {
        const itemToDelete = equipment.find(e => e.id === id);
        if (!itemToDelete) return false;

        const hasBusinessHistory = events.some((event) =>
            event.targetType === 'EQUIPMENT'
            && event.targetId === id
            && event.type !== 'CREATE',
        );
        const decision = canDeleteEquipmentByBusinessRule(itemToDelete, hasBusinessHistory);
        if (!decision.allowed) return false;

        setEquipment(prev => prev.filter(e => e.id !== id));
        logEvent({
            type: 'DELETE',
            actorId: currentUser?.id || 'system',
            actorName: currentUser?.name || 'Système',
            actorRole: currentUser?.role || 'SuperAdmin',
            targetType: 'EQUIPMENT',
            targetId: id,
            targetName: itemToDelete.name,
            description: `Suppression de l'équipement ${itemToDelete.name}`,
            isSystem: false,
            isSensitive: false,
        });
        return true;
    }, [equipment, events, currentUser, logEvent]);

    const updateApproval = useCallback((id: string, status: ApprovalStatus): BusinessRuleDecision => {
        const oldApproval = approvals.find(a => a.id === id);
        if (!oldApproval) {
            return { allowed: false, reason: 'Demande introuvable.' };
        }

        const transitionDecision = canTransitionApprovalStatus({
            approval: oldApproval,
            nextStatus: status,
            actorRole: currentUser?.role,
            actorId: currentUser?.id,
            users,
        });

        if (!transitionDecision.allowed) {
            logEvent({
                type: 'UPDATE',
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'User',
                targetType: 'APPROVAL',
                targetId: id,
                targetName: `Demande de ${oldApproval.requesterName}`,
                description: `Transition refusée ${oldApproval.status} -> ${status}`,
                metadata: {
                    from: oldApproval.status,
                    to: status,
                    reason: transitionDecision.reason,
                },
                isSystem: false,
                isSensitive: true,
            });
            return transitionDecision;
        }

        const now = new Date().toISOString();
        setApprovals(prev => prev.map(item => item.id === id ? { ...item, status, requestDate: 'Aujourd\'hui' } : item));

        if (oldApproval?.assignedEquipmentId) {
            const equipmentUpdates = getEquipmentUpdatesForApprovalStatus({
                status,
                actorId: currentUser?.id,
                nowISO: now,
            });

            if (equipmentUpdates) {
                updateEquipment(oldApproval.assignedEquipmentId, equipmentUpdates, {
                    source: 'approval_workflow',
                    approvalId: id,
                    approvalStatus: status,
                });
            }
        }

        if (oldApproval) {
            let eventType: HistoryEvent['type'] = 'UPDATE';
            if (status === 'WAITING_IT_PROCESSING') eventType = 'APPROVAL_MANAGER';
            else if (status === 'Approved') eventType = 'APPROVAL_ADMIN';
            else if (status === 'Rejected') eventType = 'APPROVAL_REJECT';

            logEvent({
                type: eventType,
                actorId: currentUser?.id || 'system',
                actorName: currentUser?.name || 'Système',
                actorRole: currentUser?.role || 'Admin',
                targetType: 'APPROVAL',
                targetId: id,
                targetName: `Demande de ${oldApproval.requesterName}`,
                description: `Statut mis à jour: ${status}`,
                metadata: { from: oldApproval.status, to: status },
                isSystem: false,
                isSensitive: false
            });
        }
        return { allowed: true };
    }, [approvals, currentUser, logEvent, updateEquipment, users]);

    const addApproval = useCallback((approval: Omit<Approval, 'id'>) => {
        const newId = Date.now().toString();
        setApprovals(prev => [{ ...approval, id: newId }, ...prev]);

        logEvent({
            type: 'APPROVAL_CREATE',
            actorId: currentUser?.id || approval.requesterId || 'system',
            actorName: currentUser?.name || approval.requesterName || 'Système',
            actorRole: currentUser?.role || 'User',
            targetType: 'APPROVAL',
            targetId: newId,
            targetName: `Demande ${approval.equipmentCategory}`,
            description: `Nouvelle demande: ${approval.reason}`,
            metadata: { urgency: approval.urgency },
            isSystem: false,
            isSensitive: false
        });
    }, [currentUser, logEvent]);

    // --- Location Management ---
    const addLocation = useCallback((type: 'country' | 'site' | 'service', name: string, parentId?: string) => {
        let success = false;
        setLocationData(prev => {
            const newData = { ...prev };
            if (type === 'country') {
                if (newData.countries.includes(name)) return prev;
                newData.countries = [...newData.countries, name];
                success = true;
            } else if (type === 'site' && parentId) {
                const currentSites = newData.sites[parentId] || [];
                if (currentSites.includes(name)) return prev;
                newData.sites = { ...newData.sites, [parentId]: [...currentSites, name] };
                success = true;
            } else if (type === 'service' && parentId) {
                const currentServices = newData.services[parentId] || [];
                if (currentServices.includes(name)) return prev;
                newData.services = { ...newData.services, [parentId]: [...currentServices, name] };
                success = true;
            }
            return newData;
        });
        return success;
    }, []);

    const renameLocation = useCallback((type: 'country' | 'site' | 'service', oldName: string, newName: string, parentId?: string) => {
        let success = false;
        setLocationData(prev => {
            const newData = { ...prev };
            if (type === 'country') {
                if (newData.countries.includes(newName)) return prev;
                newData.countries = newData.countries.map(c => c === oldName ? newName : c);
                if (newData.sites[oldName]) {
                    newData.sites[newName] = newData.sites[oldName];
                    delete newData.sites[oldName];
                }
                success = true;
            } else if (type === 'site' && parentId) {
                const currentSites = newData.sites[parentId] || [];
                if (currentSites.includes(newName)) return prev;
                newData.sites[parentId] = currentSites.map(s => s === oldName ? newName : s);
                if (newData.services[oldName]) {
                    newData.services[newName] = newData.services[oldName];
                    delete newData.services[oldName];
                }
                success = true;
            } else if (type === 'service' && parentId) {
                const currentServices = newData.services[parentId] || [];
                if (currentServices.includes(newName)) return prev;
                newData.services[parentId] = currentServices.map(s => s === oldName ? newName : s);

                // Update service manager key
                if (serviceManagers[oldName]) {
                    setServiceManagers(prevMgr => {
                        const newMgr = { ...prevMgr, [newName]: prevMgr[oldName] };
                        delete newMgr[oldName];
                        return newMgr;
                    });
                }

                success = true;
            }
            return newData;
        });
        return success;
    }, [serviceManagers]);

    const deleteLocation = useCallback((type: 'country' | 'site' | 'service', name: string, parentId?: string) => {
        setLocationData(prev => {
            const newData = { ...prev };
            if (type === 'country') {
                newData.countries = newData.countries.filter(c => c !== name);
                delete newData.sites[name];
            } else if (type === 'site' && parentId) {
                newData.sites[parentId] = (newData.sites[parentId] || []).filter(s => s !== name);
                delete newData.services[name];
            } else if (type === 'service' && parentId) {
                newData.services[parentId] = (newData.services[parentId] || []).filter(s => s !== name);
                setServiceManagers(prev => {
                    const newMgr = { ...prev };
                    delete newMgr[name];
                    return newMgr;
                });
            }
            return newData;
        });
    }, []);

    // ... (Category/Model CRUD kept same)
    const addCategory = useCallback((catData: Omit<Category, 'id'>) => {
        const newId = Date.now().toString();
        setCategories(prev => [...prev, { ...catData, id: newId }]);
    }, []);
    const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }, []);
    const deleteCategory = useCallback((id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
        return true;
    }, []);
    const addModel = useCallback((modelData: Omit<Model, 'id'>) => {
        const newId = Date.now().toString();
        setModels(prev => [...prev, { ...modelData, id: newId }]);
    }, []);
    const updateModel = useCallback((id: string, updates: Partial<Model>) => {
        setModels(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    }, []);
    const deleteModel = useCallback((id: string) => {
        setModels(prev => prev.filter(m => m.id !== id));
        return true;
    }, []);

    const contextValue = useMemo(() => ({
        users,
        equipment,
        categories,
        models,
        approvals,
        events,
        locationData,
        serviceManagers, // Exposed
        settings,
        financeExpenses,
        financeBudgets,
        addUser,
        updateUser,
        deleteUser,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        updateApproval,
        addApproval,
        logEvent,
        addLocation,
        renameLocation,
        deleteLocation,
        assignManagerToService, // Exposed
        addCategory,
        updateCategory,
        deleteCategory,
        addModel,
        updateModel,
        deleteModel,
        updateSettings,
        addFinanceExpense,
        upsertFinanceBudget,
    }), [users, equipment, categories, models, approvals, events, locationData, serviceManagers, settings, financeExpenses, financeBudgets, addUser, updateUser, deleteUser, addEquipment, updateEquipment, deleteEquipment, updateApproval, addApproval, logEvent, addLocation, renameLocation, deleteLocation, assignManagerToService, addCategory, updateCategory, deleteCategory, addModel, updateModel, deleteModel, updateSettings, addFinanceExpense, upsertFinanceBudget]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

