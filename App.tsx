


import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, useParams, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { UserRole, EquipmentStatus, AssignmentStatus, FormAction, type User, type Equipment, type Category, type Model, type Assignment, type ModelFormData, type AuditAction, type EntityType, type Country, type Site, type Department, type AuditSession, type ValidationActor } from './types';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Users from './components/Users';
import AddEquipmentForm from './components/AddEquipmentForm';
import AddUserForm from './components/AddUserForm';
import Management from './components/Management';
import Locations from './components/Locations';
import AddCategoryForm from './components/AddCategoryForm';
import AddModelForm from './components/AddModelForm';
import Reports from './components/Reports';
import SelectAuditLocation from './components/SelectAuditLocation';
// FIX: Use named import for AuditOverview to resolve module loading error.
import { AuditOverview as AuditOverviewComponent } from './components/AuditOverview';
import Profile from './components/Profile';
import MoreMenuSheet from './components/MoreMenuSheet';
import ImportEquipmentForm from './components/ImportEquipmentForm';
import { PinManagementModal, FingerprintRegistrationModal } from './components/Modals';
import SettingsSheet from './components/SettingsSheet';
import ImportUsersForm from './components/ImportUsersForm';
import ImportModelsForm from './components/ImportModelsForm';
import Login from './components/Login';
import ImportLocationsForm from './components/ImportLocationsForm';
import SettingsAboutPage from './components/SettingsAboutPage';
import SettingsNotificationsPage from './components/SettingsNotificationsPage';
import SettingsDataPage from './components/SettingsDataPage';
import SettingsHelpPage from './components/SettingsHelpPage';
import SettingsWhatsNewPage from './components/SettingsWhatsNewPage';
import EquipmentDetailsRoute from './routes/EquipmentDetailsRoute';
import UserDetailsRoute from './routes/UserDetailsRoute';
import CategoryDetailsRoute from './routes/CategoryDetailsRoute';
import ModelDetailsRoute from './routes/ModelDetailsRoute';
import AssignmentWizardAssignRoute from './routes/AssignmentWizardAssignRoute';
import AssignmentWizardReturnRoute from './routes/AssignmentWizardReturnRoute';
import PendingApprovalsRoute from './routes/PendingApprovalsRoute';
import AuditSessionRoute from './routes/AuditSessionRoute';
import AuditReportRoute from './routes/AuditReportRoute';


const AppContent: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { state, dispatch } = useAppContext();
    const location = useLocation();
    const activeHash = `#${location.pathname}${location.search}`;
    const { addToast } = useToast();

    const SIMULATED_LATENCY_MS = 700;
    const FAILURE_RATE = 0.15;

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<string>>(new Set());
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
    const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
    const [pinManagementInfo, setPinManagementInfo] = useState<{ userId: string; existingPin?: string } | null>(null);
    const [fingerprintRegistrationInfo, setFingerprintRegistrationInfo] = useState<{ userId: string } | null>(null);
    
    useEffect(() => {
        // Close sheet on navigation
        setMoreMenuOpen(false);
    }, [location.pathname]);

    const isFormPage = useMemo(() => {
        const path = location.pathname;
        return path.includes('/assign') ||
               path.includes('/return') ||
               path.includes('/new') ||
               path.includes('/edit') ||
               path.includes('/import');
    }, [location.pathname]);

    const currentUser = state.currentUser!;
    const isManager = currentUser.role === UserRole.MANAGER;
    const showFullNav = currentUser.role !== UserRole.EMPLOYEE;

    const directReports = useMemo(
        () => state.users.filter((user) => user.managerId === currentUser.id),
        [state.users, currentUser.id]
    );

    const teamUserIds = useMemo(() => new Set<string>([currentUser.id, ...directReports.map((user) => user.id)]), [currentUser.id, directReports]);

    const visibleUsers = useMemo(() => {
        if (!isManager) {
            return state.users;
        }
        const uniqueUsers = new Map<string, User>();
        uniqueUsers.set(currentUser.id, currentUser);
        directReports.forEach((user) => uniqueUsers.set(user.id, user));
        return Array.from(uniqueUsers.values());
    }, [isManager, state.users, currentUser, directReports]);

    const visibleAssignments = useMemo(() => {
        if (!isManager) {
            return state.assignments;
        }
        return state.assignments.filter(
            (assignment) => teamUserIds.has(assignment.userId) || teamUserIds.has(assignment.managerId)
        );
    }, [isManager, state.assignments, teamUserIds]);

    const visibleEquipment = useMemo(() => {
        if (!isManager) {
            return state.equipment;
        }
        const relevantEquipmentIds = new Set(visibleAssignments.map((assignment) => assignment.equipmentId));
        const relevantAssignmentIds = new Set(visibleAssignments.map((assignment) => assignment.id));
        return state.equipment.filter(
            (item) =>
                relevantEquipmentIds.has(item.id) ||
                (item.pendingAssignmentId ? relevantAssignmentIds.has(item.pendingAssignmentId) : false)
        );
    }, [isManager, state.equipment, visibleAssignments]);

    const pendingApprovalsCount = useMemo(() => {
        return visibleAssignments.filter((assignment) => {
            const equipmentItem = visibleEquipment.find((item) => item.id === assignment.equipmentId);
            if (!equipmentItem) return false;
            if (equipmentItem.status !== EquipmentStatus.PENDING_VALIDATION) return false;
            if (assignment.status !== AssignmentStatus.PENDING || !assignment.validation) return false;

            const v = assignment.validation;
            const isAssign = assignment.action === FormAction.ASSIGN;

            // Manager gating
            const managerCanAct = isAssign ? (!v.manager && v.it) : (!v.manager && v.it && v.user);
            if (currentUser.id === assignment.managerId && managerCanAct) return true;

            // User gating
            const userCanAct = isAssign ? (v.it && v.manager && !v.user) : (v.it && !v.user);
            if (currentUser.id === assignment.userId && userCanAct) return true;

            // Admin IT can act when IT validation is pending
            if (currentUser.role === UserRole.ADMIN && !v.it) return true;

            return false;
        }).length;
    }, [visibleAssignments, visibleEquipment, currentUser]);

    const logAuditEvent = (action: AuditAction, entityType: EntityType, entityName: string) => {
        if(currentUser) {
            dispatch({ type: 'LOG_AUDIT_EVENT', payload: { user: currentUser, action, entityType, entityName } });
        }
    };

    const handleSaveEquipment = async (data: Partial<Equipment>) => {
        dispatch({ type: 'SAVE_EQUIPMENT', payload: data });
        logAuditEvent(data.id ? 'update' : 'create', 'equipment', data.name || data.assetTag || 'N/A');
        window.location.hash = data.id ? `#/equipment/${data.id}` : '#/inventory';
    };
    
    const handleSaveUser = async (data: Partial<User> & { avatarFile?: File | null }) => {
        const { avatarFile, ...userData } = data;
        let avatarUrl = userData.avatarUrl;
        if (avatarFile) {
            avatarUrl = URL.createObjectURL(avatarFile);
        }
        dispatch({ type: 'SAVE_USER', payload: { ...userData, avatarUrl } });
        logAuditEvent(userData.id ? 'update' : 'create', 'user', userData.name || 'N/A');
        window.location.hash = userData.id ? `#/users/${userData.id}` : '#/users';
    };
    
    // --- Wrapper Components for Routing ---
    
    const AddEquipmentFormEditWrapper: React.FC = () => {
        const { id } = useParams<{ id: string }>();
        const equipment = state.equipment.find((e) => e.id === id);
        return equipment ? (
            <AddEquipmentForm
                onSave={handleSaveEquipment}
                onBack={() => window.history.back()}
                categories={state.categories}
                models={state.models}
                countries={state.countries}
                sites={state.sites}
                departments={state.departments}
                initialData={equipment}
            />
        ) : (
            <h2>Équipement non trouvé</h2>
        );
    };

    const AddUserFormEditWrapper: React.FC = () => {
        const { id } = useParams<{ id: string }>();
        const user = state.users.find((u) => u.id === id);
        return user ? (
            <AddUserForm onSave={handleSaveUser} onBack={() => window.history.back()} users={state.users} initialData={user} />
        ) : (
            <h2>Utilisateur non trouvé</h2>
        );
    };

    const AddCategoryFormEditWrapper: React.FC = () => {
        const { id } = useParams<{ id: string }>();
        const category = state.categories.find((c) => c.id === id);
        return category ? (
            <AddCategoryForm
                onSave={async (data) => {
                    dispatch({ type: 'SAVE_CATEGORY', payload: data });
                    logAuditEvent(data.id ? 'update' : 'create', 'category', data.name);
                    window.location.hash = '#/management';
                }}
                onBack={() => window.history.back()}
                initialData={category}
            />
        ) : (
            <h2>Catégorie non trouvée</h2>
        );
    };

    const AddModelFormWrapper: React.FC = () => {
        const [searchParams] = useSearchParams();
        const categoryId = searchParams.get('categoryId');
        return (
            <AddModelForm
                onSave={async (data) => {
                    dispatch({ type: 'SAVE_MODEL', payload: data });
                    logAuditEvent(data.id ? 'update' : 'create', 'model', data.modelName);
                    window.location.hash = '#/management';
                }}
                onBack={() => window.history.back()}
                categories={state.categories}
                initialData={{ categoryId: categoryId || '' }}
            />
        );
    };

    const AddModelFormEditWrapper: React.FC = () => {
        const { id } = useParams<{ id: string }>();
        const model = state.models.find((m) => m.id === id);
        return model ? (
            <AddModelForm
                onSave={async (data) => {
                    dispatch({ type: 'SAVE_MODEL', payload: data });
                    logAuditEvent(data.id ? 'update' : 'create', 'model', data.modelName);
                    window.location.hash = '#/management';
                }}
                onBack={() => window.history.back()}
                categories={state.categories}
                initialData={model}
            />
        ) : (
            <h2>Modèle non trouvé</h2>
        );
    };

    const handleAssignmentSubmit = async (data: Omit<Assignment, 'id'>) => {
        dispatch({ type: 'SAVE_ASSIGNMENT', payload: data });
        const v = data.validation || { it: false, manager: false, user: false };
        const isAssign = data.action === FormAction.ASSIGN;
        let nextActorLabel: 'Admin IT' | 'Responsable' | 'Utilisateur' | null = null;
        if (!v.it) nextActorLabel = 'Admin IT';
        else if (isAssign) {
            if (!v.manager) nextActorLabel = 'Responsable';
            else if (!v.user) nextActorLabel = 'Utilisateur';
        } else {
            if (!v.user) nextActorLabel = 'Utilisateur';
            else if (!v.manager) nextActorLabel = 'Responsable';
        }
        if (nextActorLabel === 'Admin IT' && currentUser.role === UserRole.ADMIN) {
            addToast('Demande créée. Validez maintenant en tant qu\'Admin IT.', 'info', {
                actionLabel: 'Valider',
                onAction: () => { window.location.hash = '#/pending-approvals'; }
            });
        } else if (nextActorLabel) {
            addToast(`Demande créée. Notification envoyée à ${nextActorLabel}.`, 'info');
        } else {
            addToast('Demande créée.', 'info');
        }
        window.location.hash = '#/dashboard';
    };

    const handleApproveAssignment = (assignmentId: string, actor?: ValidationActor) => {
        const assignment = state.assignments.find((item) => item.id === assignmentId);
        if (!assignment) return;
        if (isManager && assignment.managerId !== currentUser.id) return;

        // Derive actor if not provided to enable precise Undo
        const derivedActor: ValidationActor = actor
            || (currentUser.id === assignment.managerId ? 'manager'
            : currentUser.id === assignment.userId ? 'user'
            : currentUser.role === UserRole.ADMIN ? 'it'
            : 'user');

        dispatch({ type: 'APPROVE_ASSIGNMENT', payload: { assignmentId, currentUser, actor: derivedActor } });
        addToast('Validation enregistrée', 'success', {
            actionLabel: 'Annuler',
            onAction: () => dispatch({ type: 'REVERT_ASSIGNMENT_VALIDATION', payload: { assignmentId, actor: derivedActor } })
        });

        // Notify next actor (simulated toast) and log audit event
        try {
            const v = { ...(assignment.validation || { it: false, manager: false, user: false }) };
            v[derivedActor] = true;
            const isAssign = assignment.action === FormAction.ASSIGN;
            let nextActorLabel: string | null = null;
            if (isAssign) {
                if (!v.it) nextActorLabel = 'Admin IT';
                else if (!v.manager) nextActorLabel = 'Responsable';
                else if (!v.user) nextActorLabel = 'Utilisateur';
            } else {
                // RETURN flow: IT -> USER -> MANAGER
                if (!v.it) nextActorLabel = 'Admin IT';
                else if (!v.user) nextActorLabel = 'Utilisateur';
                else if (!v.manager) nextActorLabel = 'Responsable';
            }
            if (!v.it && nextActorLabel === 'Admin IT') {
                // already targeting IT; but derivedActor was set to true; keep generic
            }
            const equipmentItem = state.equipment.find(e => e.id === assignment.equipmentId);
            if (equipmentItem) {
                dispatch({ type: 'LOG_AUDIT_EVENT', payload: { user: currentUser, action: 'update', entityType: 'equipment', entityName: equipmentItem.assetTag } });
            }
            const fullyApproved = v.it && v.manager && v.user;
            if (fullyApproved) {
                addToast('Processus complété.', 'success');
            } else if (nextActorLabel) {
                addToast(`Notification envoyée à ${nextActorLabel}.`, 'info');
            }
        } catch {}

        // Simuler latence et échec potentiel avec rollback
        setTimeout(() => {
            if (Math.random() < FAILURE_RATE) {
                dispatch({ type: 'REVERT_ASSIGNMENT_VALIDATION', payload: { assignmentId, actor: derivedActor } });
                addToast('Erreur réseau: validation annulée, restauration effectuée.', 'error', {
                    actionLabel: 'Réessayer',
                    onAction: () => handleApproveAssignment(assignmentId, derivedActor)
                });
            }
        }, SIMULATED_LATENCY_MS);
    };

    const handleRejectAssignment = (assignmentId: string, reason: string) => {
        const assignment = state.assignments.find((item) => item.id === assignmentId);
        if (!assignment) return;
        if (isManager && assignment.managerId !== currentUser.id) return;

        dispatch({ type: 'REJECT_ASSIGNMENT', payload: { assignmentId, reason } });
        addToast('Demande rejetée', 'info', {
            actionLabel: 'Annuler',
            onAction: () => dispatch({ type: 'RESTORE_REJECTED_ASSIGNMENT', payload: { assignmentId } })
        });

        // Simuler latence et échec potentiel avec rollback
        setTimeout(() => {
            if (Math.random() < FAILURE_RATE) {
                dispatch({ type: 'RESTORE_REJECTED_ASSIGNMENT', payload: { assignmentId } });
                addToast('Erreur réseau: rejet annulé, restauration effectuée.', 'error', {
                    actionLabel: 'Réessayer',
                    onAction: () => handleRejectAssignment(assignmentId, reason)
                });
            }
        }, SIMULATED_LATENCY_MS);
    };

    const handleAuditEquipmentUpdate = (data: Partial<Equipment>) => {
        dispatch({ type: 'SAVE_EQUIPMENT', payload: data });
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <Sidebar currentUser={currentUser} activeHash={activeHash} isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(p => !p)} onOpenSettings={() => setIsSettingsSheetOpen(true)} onLogout={onLogout} pendingApprovalsCount={pendingApprovalsCount} />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Routes>
                    <Route path="/dashboard" element={<Dashboard currentUser={currentUser} assignments={visibleAssignments} equipment={visibleEquipment} users={visibleUsers} models={state.models} categories={state.categories} auditLog={state.auditLog} editHistory={state.editHistory} onAddEquipment={() => window.location.hash = '#/equipment/new'} onShowPendingApprovals={() => window.location.hash = '#/pending-approvals'} isLoading={false} onOpenSettings={() => setIsSettingsSheetOpen(true)} />} />
                    <Route
                        path="/inventory"
                        element={
                            isManager ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <Inventory
                                    equipment={state.equipment}
                                    models={state.models}
                                    categories={state.categories}
                                    assignments={state.assignments}
                                    users={state.users}
                                    onAdd={() => window.location.hash = '#/equipment/new'}
                                    onImport={() => window.location.hash = '#/equipment/import'}
                                    canAdd={currentUser.role === UserRole.ADMIN}
                                    onEdit={(id) => window.location.hash = `#/equipment/${id}/edit`}
                                    onDelete={(id) => {
                                        const item = state.equipment.find(e => e.id === id);
                                        if(item) {
                                            const model = state.models.find(m => m.id === item.modelId);
                                            logAuditEvent('delete', 'equipment', model?.name || item.assetTag);
                                        }
                                        dispatch({ type: 'DELETE_EQUIPMENT', payload: id });
                                    }}
                                    selectedIds={selectedInventoryIds}
                                    onSelectedIdsChange={setSelectedInventoryIds}
                                    onBulkDelete={(ids) => dispatch({ type: 'BULK_DELETE_EQUIPMENT', payload: ids })}
                                    onBulkUpdateStatus={(ids, status) => dispatch({ type: 'BULK_UPDATE_STATUS', payload: { ids, status } })}
                                    onBulkUpdateLocation={(ids, location) => dispatch({ type: 'BULK_UPDATE_LOCATION', payload: { ids, location } })}
                                    isLoading={false}
                                    currentUser={currentUser}
                                />
                            )
                        }
                    />
                    <Route
                        path="/users"
                        element={
                            <Users
                                users={visibleUsers}
                                onAdd={() => window.location.hash = '#/users/new'}
                                isLoading={false}
                                canAdd={currentUser.role === UserRole.ADMIN}
                                onEdit={(id) => window.location.hash = `#/users/${id}/edit`}
                                onDelete={(id) => {
                                    const user = state.users.find(u => u.id === id);
                                    if(user) {
                                        logAuditEvent('delete', 'user', user.name);
                                    }
                                    dispatch({ type: 'DELETE_USER', payload: id });
                                }}
                                currentUser={currentUser}
                                selectedIds={selectedUserIds}
                                onSelectedIdsChange={setSelectedUserIds}
                                onBulkDelete={(ids) => {
                                    dispatch({ type: 'BULK_DELETE_USERS', payload: ids });
                                    setSelectedUserIds(new Set());
                                }}
                            />
                        }
                    />
                    <Route
                        path="/equipment/:id"
                        element={
                            <EquipmentDetailsRoute
                                assignments={visibleAssignments}
                                equipmentList={visibleEquipment}
                                users={visibleUsers}
                                currentUser={currentUser}
                                models={state.models}
                                categories={state.categories}
                                editHistory={state.editHistory}
                                sites={state.sites}
                                departments={state.departments}
                                onBack={() => window.history.back()}
                                onEdit={(id) => (window.location.hash = `#/equipment/${id}/edit`)}
                                onDelete={(id) => {
                                    const item = state.equipment.find((e) => e.id === id);
                                    if (item) {
                                        const model = state.models.find((m) => m.id === item.modelId);
                                        logAuditEvent('delete', 'equipment', model?.name || item.assetTag);
                                    }
                                    dispatch({ type: 'DELETE_EQUIPMENT', payload: id });
                                    window.location.hash = '#/inventory';
                                }}
                                onApprove={(id, actor) => dispatch({ type: 'APPROVE_ASSIGNMENT', payload: { assignmentId: id, currentUser, actor } })}
                                onReject={(id, reason) => dispatch({ type: 'REJECT_ASSIGNMENT', payload: { assignmentId: id, reason } })}
                            />
                        }
                    />
                    <Route
                        path="/users/:id"
                        element={
                            <UserDetailsRoute
                                assignments={visibleAssignments}
                                equipment={visibleEquipment}
                                users={visibleUsers}
                                models={state.models}
                                categories={state.categories}
                                currentUser={currentUser}
                                editHistory={state.editHistory}
                                onBack={() => (window.location.hash = '#/users')}
                                onEdit={(id) => (window.location.hash = `#/users/${id}/edit`)}
                                onDelete={(id) => {
                                    const user = state.users.find((u) => u.id === id);
                                    if (user) {
                                        logAuditEvent('delete', 'user', user.name);
                                    }
                                    dispatch({ type: 'DELETE_USER', payload: id });
                                    window.location.hash = '#/users';
                                }}
                                onManagePin={(userId) => setPinManagementInfo({ userId, existingPin: state.users.find((u) => u.id === userId)?.pin })}
                                onRegisterFingerprint={(userId) => setFingerprintRegistrationInfo({ userId })}
                            />
                        }
                    />
                    <Route
                        path="/equipment/new"
                        element={
                            isManager ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <AddEquipmentForm onSave={handleSaveEquipment} onBack={() => window.history.back()} categories={state.categories} models={state.models} countries={state.countries} sites={state.sites} departments={state.departments} />
                            )
                        }
                    />
                    <Route
                        path="/equipment/import"
                        element={
                            isManager ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <ImportEquipmentForm onImport={async (items) => { dispatch({ type: 'IMPORT_EQUIPMENT', payload: items }); window.location.hash = '#/inventory'; }} onBack={() => window.history.back()} models={state.models} />
                            )
                        }
                    />
                    <Route
                        path="/equipment/:id/edit"
                        element={isManager ? <Navigate to="/dashboard" replace /> : <AddEquipmentFormEditWrapper />}
                    />
                    <Route
                        path="/users/new"
                        element={isManager ? <Navigate to="/dashboard" replace /> : <AddUserForm onSave={handleSaveUser} onBack={() => window.history.back()} users={state.users} />}
                    />
                    <Route
                        path="/users/import"
                        element={isManager ? <Navigate to="/dashboard" replace /> : <ImportUsersForm users={state.users} onImport={async (items) => { dispatch({ type: 'IMPORT_USERS', payload: items }); window.location.hash = '#/users'; }} onBack={() => window.history.back()} />}
                    />
                    <Route path="/users/:id/edit" element={isManager ? <Navigate to="/dashboard" replace /> : <AddUserFormEditWrapper />} />
                    <Route
                        path="/assign/*"
                        element={
                            <AssignmentWizardAssignRoute
                                equipment={state.equipment}
                                users={state.users}
                                currentUser={currentUser}
                                models={state.models}
                                categories={state.categories}
                                assignments={state.assignments}
                                onSubmit={handleAssignmentSubmit}
                                onBack={() => window.history.back()}
                            />
                        }
                    />
                    <Route
                        path="/return"
                        element={
                            <AssignmentWizardReturnRoute
                                equipment={state.equipment}
                                users={state.users}
                                currentUser={currentUser}
                                models={state.models}
                                categories={state.categories}
                                assignments={state.assignments}
                                onSubmit={handleAssignmentSubmit}
                                onBack={() => window.history.back()}
                            />
                        }
                    />
                    <Route
                        path="/return/equipment/:equipmentId"
                        element={
                            <AssignmentWizardReturnRoute
                                equipment={state.equipment}
                                users={state.users}
                                currentUser={currentUser}
                                models={state.models}
                                categories={state.categories}
                                assignments={state.assignments}
                                onSubmit={handleAssignmentSubmit}
                                onBack={() => window.history.back()}
                            />
                        }
                    />
                    <Route
                        path="/pending-approvals"
                        element={
                            <PendingApprovalsRoute
                                assignments={visibleAssignments}
                                equipment={visibleEquipment}
                                models={state.models}
                                categories={state.categories}
                                users={visibleUsers}
                                currentUser={currentUser}
                                onApprove={handleApproveAssignment}
                                onReject={handleRejectAssignment}
                                onBack={() => window.history.back()}
                            />
                        }
                    />
                    <Route
                        path="/management"
                        element={
                            isManager ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <Management categories={state.categories} models={state.models} equipment={state.equipment} onAddCategory={() => window.location.hash = '#/categories/new'} onAddModel={() => window.location.hash = '#/models/new'} onViewCategory={(id) => window.location.hash = `#/categories/${id}`} onSelectModel={(id) => window.location.hash = `#/models/${id}`} />
                            )
                        }
                    />
                    <Route path="/locations" element={<Locations countries={state.countries} sites={state.sites} departments={state.departments} dispatch={dispatch} logAuditEvent={logAuditEvent} />} />
                    <Route path="/locations/import" element={isManager ? <Navigate to="/dashboard" replace /> : <ImportLocationsForm countries={state.countries} sites={state.sites} onImport={async (data) => { dispatch({ type: 'IMPORT_LOCATIONS', payload: data }); window.location.hash = '#/locations'; }} onBack={() => window.history.back()} />} />
                    <Route path="/categories/new" element={<AddCategoryForm onSave={async (data) => { dispatch({ type: 'SAVE_CATEGORY', payload: data }); logAuditEvent(data.id ? 'update' : 'create', 'category', data.name); window.location.hash = '#/management'; }} onBack={() => window.history.back()} />} />
                    <Route
                        path="/categories/:id"
                        element={
                            <CategoryDetailsRoute
                                categories={state.categories}
                                models={state.models}
                                equipment={state.equipment}
                                users={state.users}
                                currentUser={currentUser}
                                onBack={() => (window.location.hash = '#/management')}
                                onEdit={(id) => (window.location.hash = `#/categories/${id}/edit`)}
                                onDelete={(id) => {
                                    const category = state.categories.find((c) => c.id === id);
                                    if (category) {
                                        logAuditEvent('delete', 'category', category.name);
                                    }
                                    dispatch({ type: 'DELETE_CATEGORY', payload: id });
                                    window.location.hash = '#/management';
                                }}
                                onSelectEquipment={(id) => (window.location.hash = `#/equipment/${id}`)}
                                onSelectModel={(id) => (window.location.hash = `#/models/${id}`)}
                            />
                        }
                    />
                    <Route path="/categories/:id/edit" element={isManager ? <Navigate to="/dashboard" replace /> : <AddCategoryFormEditWrapper />} />
                    <Route path="/models/new" element={isManager ? <Navigate to="/dashboard" replace /> : <AddModelFormWrapper />} />
                    <Route path="/models/import" element={isManager ? <Navigate to="/dashboard" replace /> : <ImportModelsForm categories={state.categories} onImport={async (items) => { dispatch({ type: 'IMPORT_MODELS', payload: items }); window.location.hash = '#/management'; }} onBack={() => window.history.back()} />} />
                    <Route
                        path="/models/:id"
                        element={
                            <ModelDetailsRoute
                                models={state.models}
                                categories={state.categories}
                                equipment={state.equipment}
                                assignments={state.assignments}
                                users={state.users}
                                currentUser={currentUser}
                                onBack={() => (window.location.hash = '#/management')}
                                onEdit={(id) => (window.location.hash = `#/models/${id}/edit`)}
                                onDelete={(id) => {
                                    const model = state.models.find((m) => m.id === id);
                                    if (model) {
                                        logAuditEvent('delete', 'model', model.name);
                                    }
                                    dispatch({ type: 'DELETE_MODEL', payload: id });
                                    window.location.hash = '#/management';
                                }}
                                onSelectEquipment={(id) => (window.location.hash = `#/equipment/${id}`)}
                            />
                        }
                    />
                    <Route path="/models/:id/edit" element={isManager ? <Navigate to="/dashboard" replace /> : <AddModelFormEditWrapper />} />
                    <Route path="/reports" element={isManager ? <Navigate to="/dashboard" replace /> : <Reports equipment={state.equipment} assignments={state.assignments} users={state.users} models={state.models} categories={state.categories} currentUser={currentUser} />} />
                    <Route path="/audit" element={isManager ? <Navigate to="/dashboard" replace /> : <SelectAuditLocation equipment={state.equipment} currentUser={currentUser} sites={state.sites} departments={state.departments} countries={state.countries} auditSessions={state.auditSessions} dispatch={dispatch} />} />
                    <Route path="/audit/overview" element={isManager ? <Navigate to="/dashboard" replace /> : <AuditOverviewComponent auditSessions={state.auditSessions} equipment={state.equipment} countries={state.countries} sites={state.sites} departments={state.departments} users={state.users} />} />
                    <Route
                        path="/audit/session/:sessionId"
                        element={
                            isManager ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <AuditSessionRoute
                                    auditSessions={state.auditSessions}
                                    equipment={state.equipment}
                                    models={state.models}
                                    categories={state.categories}
                                    sites={state.sites}
                                    departments={state.departments}
                                    countries={state.countries}
                                    onBack={() => (window.location.hash = '#/audit')}
                                    onUpdateEquipment={handleAuditEquipmentUpdate}
                                    dispatch={dispatch}
                                />
                            )
                        }
                    />
                    <Route
                        path="/audit/report/:sessionId"
                        element={
                            isManager ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <AuditReportRoute
                                    auditSessions={state.auditSessions}
                                    equipment={state.equipment}
                                    models={state.models}
                                    sites={state.sites}
                                    departments={state.departments}
                                    countries={state.countries}
                                    onBack={() => (window.location.hash = '#/audit')}
                                />
                            )
                        }
                    />
                    <Route path="/profile" element={<Profile currentUser={currentUser} onBack={() => window.history.back()} onEdit={(id) => window.location.hash = `#/users/${id}/edit`} onLogout={onLogout} onManagePin={(userId) => setPinManagementInfo({userId, existingPin: currentUser.pin})} />} />
                    <Route path="/settings/about" element={<SettingsAboutPage />} />
                    <Route path="/settings/notifications" element={<SettingsNotificationsPage />} />
                    <Route path="/settings/data" element={<SettingsDataPage />} />
                    <Route path="/settings/help" element={<SettingsHelpPage />} />
                    <Route path="/settings/whats-new" element={<SettingsWhatsNewPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
            {!isFormPage && <MobileNav activeHash={activeHash} showFullNav={showFullNav} role={currentUser.role} onMoreClick={() => setMoreMenuOpen(true)} pendingApprovalsCount={pendingApprovalsCount} />}
            <MoreMenuSheet isOpen={isMoreMenuOpen} onClose={() => setMoreMenuOpen(false)} onNavigate={(hash) => window.location.hash = hash} role={currentUser.role} />
             <SettingsSheet isOpen={isSettingsSheetOpen} onClose={() => setIsSettingsSheetOpen(false)} currentUser={currentUser} onLogout={onLogout} />
            <PinManagementModal isOpen={!!pinManagementInfo} onClose={() => setPinManagementInfo(null)} onSave={(pin) => { if(pinManagementInfo) { dispatch({type: 'SAVE_PIN', payload: { userId: pinManagementInfo.userId, pin }}); setPinManagementInfo(null); }}} userName={state.users.find(u => u.id === pinManagementInfo?.userId)?.name || ''} existingPin={pinManagementInfo?.existingPin} />
            <FingerprintRegistrationModal
                isOpen={!!fingerprintRegistrationInfo}
                onClose={() => setFingerprintRegistrationInfo(null)}
                onSave={(credentialId) => {
                    if (fingerprintRegistrationInfo) {
                        dispatch({ type: 'SAVE_WEBAUTHN_CREDENTIAL', payload: { userId: fingerprintRegistrationInfo.userId, credentialId } });
                    }
                    setFingerprintRegistrationInfo(null);
                }}
                userId={fingerprintRegistrationInfo?.userId || ''}
                userName={state.users.find(u => u.id === fingerprintRegistrationInfo?.userId)?.name || ''}
                existingCredentialId={state.users.find(u => u.id === fingerprintRegistrationInfo?.userId)?.webauthnCredentialId}
            />
        </div>
    );
}

const App: React.FC = () => {
    const { state, dispatch } = useAppContext();

    const handleLoginSuccess = (user: User) => {
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        window.location.hash = '#/dashboard';
    };
    
    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
    };

    if (!state.currentUser) {
        return <Login users={state.users} onLoginSuccess={handleLoginSuccess} />;
    }

    return <AppContent onLogout={handleLogout} />;
};

const AppRoot: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <AppProvider>
        <HashRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <App />
        </HashRouter>
      </AppProvider>
    </ToastProvider>
  </ThemeProvider>
);

export default AppRoot;