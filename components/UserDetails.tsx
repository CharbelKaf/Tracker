


import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { User, Assignment, Equipment, Model, Category, EditHistoryEntry, ChangeDetail } from '../types';
import { FormAction, UserRole, AssignmentStatus } from '../types';
import PageHeader, { PageHeaderActions, DetailSection, DetailRow, Tabs } from './PageHeader';
import { ConfirmationModal } from './Modals';
import FingerprintIcon from './icons/FingerprintIcon';
import RoleBadge from './RoleBadge';
import Button from './ui/Button';

interface UserDetailsProps {
    user: User;
    assignments: Assignment[];
    equipment: Equipment[];
    models: Model[];
    categories: Category[];
    manager?: User;
    allUsers: User[];
    editHistory: EditHistoryEntry[];
    onBack: () => void;
    currentUser: User;
    onEdit: (userId: string) => void;
    onDelete: (userId: string) => void;
    onManagePassword: (userId: string) => void;
    onManagePin: (userId: string) => void;
    onRegisterFingerprint: (userId: string) => void;
}

const EquipmentIcon: React.FC<{iconName?: string}> = ({iconName}) => {
    return <span className="material-symbols-outlined text-2xl text-gray-600">{iconName || 'device_unknown'}</span>
}

const fieldLabels: Record<string, string> = {
  name: "Nom complet",
  role: "Rôle",
  department: "Département",
  email: "E-mail",
  managerId: "Responsable",
};

const formatValue = (field: string, value: any, allUsers: User[]): string => {
    if (value === null || value === undefined || value === '') return 'Vide';
    if (field === 'managerId') {
        return allUsers.find(u => u.id === value)?.name || value;
    }
    return String(value);
};

const ChangeItem: React.FC<{ change: ChangeDetail; allUsers: User[] }> = ({ change, allUsers }) => {
    const label = fieldLabels[change.field] || change.field;
    const oldValue = formatValue(change.field, change.oldValue, allUsers);
    const newValue = formatValue(change.field, change.newValue, allUsers);

    return (
        <li className="text-xs text-gray-600 pl-4">
            <span className="font-semibold">{label}:</span> de <span className="italic">"{oldValue}"</span> à <span className="italic">"{newValue}"</span>
        </li>
    );
};

const UserDetails: React.FC<UserDetailsProps> = ({ user, assignments, equipment, models, categories, manager, allUsers, editHistory, onBack, currentUser, onEdit, onDelete, onManagePassword, onManagePin, onRegisterFingerprint }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'equipment' | 'history'>('details');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const equipmentMap = new Map(equipment.map(e => [e.id, e]));
    const modelMap = new Map(models.map(m => [m.id, m]));
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    const latestAssignments = new Map<string, Assignment>();
    const userAssignments = assignments.filter(a => a.userId === user.id);

    for (const assignment of userAssignments) {
        const existing = latestAssignments.get(assignment.equipmentId);
        if (!existing || new Date(assignment.date) > new Date(existing.date)) {
            latestAssignments.set(assignment.equipmentId, assignment);
        }
    }

    const assignedEquipment = Array.from(latestAssignments.values())
      .filter(a => a.action === FormAction.ASSIGN && a.status === AssignmentStatus.APPROVED)
      .map(a => equipmentMap.get(a.equipmentId))
      .filter((e): e is Equipment => e !== undefined);

    const sortedAssignments = [...userAssignments]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
    const userHistory = editHistory.filter(h => h.entityType === 'user' && h.entityId === user.id);

    const canManageUser = currentUser.role === UserRole.ADMIN && user.id !== currentUser.id;
    const canManageEquipment = currentUser.role === UserRole.ADMIN || (currentUser.role === UserRole.MANAGER && user.managerId === currentUser.id);

    const userActions = [];
    if (canManageUser) {
        userActions.push({
            label: 'Attribuer un équipement',
            icon: 'add_circle',
            onClick: () => window.location.hash = `#/assign/user/${user.id}`
        });
        userActions.push({
            label: 'Modifier',
            icon: 'edit',
            onClick: () => onEdit(user.id)
        });
        userActions.push({
            label: 'Supprimer',
            icon: 'delete',
            onClick: () => setIsDeleteModalOpen(true),
            isDestructive: true,
        });
    }
    
    const tabs = [
        { id: 'details', label: 'Détails', icon: 'person' },
        { id: 'equipment', label: 'Équipement', icon: 'devices' },
        { id: 'history', label: 'Historique', icon: 'history' },
    ];

    const canManageSecurity = currentUser.role === UserRole.ADMIN;

    const hasEmail = Boolean(user.email);
    const emailLabel = user.email ?? 'Adresse e-mail non renseignée';

    const roleLabel = useMemo(() => {
        switch (user.role) {
            case UserRole.ADMIN:
                return 'Administrateur';
            case UserRole.MANAGER:
                return 'Responsable';
            case UserRole.EMPLOYEE:
                return 'Employé';
            default:
                return 'Collaborateur';
        }
    }, [user.role]);

    const latestAssignment = sortedAssignments[0];
    const pendingValidations = userAssignments.filter((assignment) => {
        if (assignment.status === AssignmentStatus.REJECTED) return false;
        if (assignment.status === AssignmentStatus.APPROVED) return false;
        if (assignment.status === AssignmentStatus.PENDING) return true;
        if (!assignment.validation) return false;
        const { manager: managerValid, user: userValid, it: itValid } = assignment.validation;
        return !managerValid || !userValid || !itValid;
    }).length;


    // Metric badges data
    const metricBadges = [
        {
            label: `${assignedEquipment.length} équipement${assignedEquipment.length > 1 ? 's' : ''}`,
            sublabel: `${userAssignments.length} mouvement${userAssignments.length > 1 ? 's' : ''}`,
        },
        {
            label: latestAssignment ? `Activité: ${new Date(latestAssignment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : 'Aucune activité',
            sublabel: latestAssignment ? (latestAssignment.action === FormAction.ASSIGN ? 'Attribution' : 'Restitution') : null,
        },
        {
            label: `${pendingValidations} demande${pendingValidations > 1 ? 's' : ''} en attente`,
            sublabel: null,
        },
    ];

    return (
        <div className="flex flex-col h-full bg-secondary-50 dark:bg-[#0f1722] text-gray-900 dark:text-gray-100">
            <PageHeader title={user.name} onBack={onBack}>
                {userActions.length > 0 && <PageHeaderActions actions={userActions} />}
            </PageHeader>
            <main className="flex-1 overflow-y-auto pb-36">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="mx-4 mt-4 mb-6 rounded-3xl border border-white/60 dark:border-white/10 bg-white/90 dark:bg-secondary-900/60 shadow-[var(--shadow-elev-2)] px-6 py-8"
                >
                    <div className="flex flex-col items-center text-center gap-5">
                        {/* Avatar */}
                        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-secondary-100 via-white to-white dark:from-secondary-900/50 dark:via-secondary-900/30 dark:to-secondary-900/20 shadow-[var(--shadow-elev-2)] ring-4 ring-white/70 dark:ring-secondary-900/40 overflow-hidden">
                            <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                        </div>

                        {/* Name + Role Badge */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50 tracking-tight">{user.name}</h1>
                                <RoleBadge role={user.role} />
                            </div>

                            {/* Email */}
                            {hasEmail ? (
                                <a href={`mailto:${user.email}`} className="text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-300 dark:hover:text-primary-400 transition-colors">
                                    {emailLabel}
                                </a>
                            ) : (
                                <p className="text-sm text-secondary-500 dark:text-secondary-400">{emailLabel}</p>
                            )}

                            {/* ID + Org inline chips */}
                            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                                {user.employeeId && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 dark:bg-secondary-800/60 px-3 py-1 text-secondary-700 dark:text-secondary-200 font-medium">
                                        <span className="material-symbols-outlined !text-sm">badge</span>
                                        ID {user.employeeId}
                                    </span>
                                )}
                                {user.department && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 dark:bg-secondary-800/60 px-3 py-1 text-secondary-700 dark:text-secondary-200 font-medium">
                                        <span className="material-symbols-outlined !text-sm">apartment</span>
                                        {user.department}
                                    </span>
                                )}
                                {manager && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 dark:bg-secondary-800/60 px-3 py-1 text-secondary-700 dark:text-secondary-200 font-medium">
                                        <span className="material-symbols-outlined !text-sm">supervisor_account</span>
                                        {manager.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Compact metrics grid */}
                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-secondary-200 dark:border-secondary-700 w-full max-w-lg">
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{assignedEquipment.length}</p>
                                <p className="text-xs text-secondary-600 dark:text-secondary-300">Équipement{assignedEquipment.length > 1 ? 's' : ''}</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{latestAssignment ? new Date(latestAssignment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</p>
                                <p className="text-xs text-secondary-600 dark:text-secondary-300">Dernière activité</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingValidations}</p>
                                <p className="text-xs text-secondary-600 dark:text-secondary-300">En attente</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <Tabs tabs={tabs} activeTab={activeTab} onTabClick={(id) => setActiveTab(id as any)} />

                {activeTab === 'details' && (
                    <div className="space-y-6 p-4">
                        
                        {(canManageSecurity || currentUser.id === user.id) && (
                            <DetailSection title="Sécurité" icon="security" className="surface-card surface-card-gradient border border-white/60 dark:border-secondary-800/60 col-span-full">
                               <div className="sm:col-span-2 space-y-4">
                                <p className="text-sm text-secondary-600 dark:text-secondary-300">Gérer les méthodes d'authentification pour {user.name.split(' ')[0]}.</p>
                                <div className="flex items-center justify-between rounded-2xl border border-secondary-100/70 dark:border-secondary-800/60 bg-white/90 dark:bg-secondary-900/40 p-4">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-secondary-500 dark:text-secondary-300">password</span>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">Mot de passe</span>
                                            <span className="text-sm text-secondary-600 dark:text-secondary-300">{user.password ? "Un mot de passe a été défini." : "Aucun mot de passe défini."}</span>
                                        </div>
                                    </div>
                                    <Button onClick={() => onManagePassword(user.id)}>
                                        {user.password ? "Modifier" : "Créer"}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl border border-secondary-100/70 dark:border-secondary-800/60 bg-white/90 dark:bg-secondary-900/40 p-4">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-secondary-500 dark:text-secondary-300">pin</span>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">Code PIN</span>
                                            <span className="text-sm text-secondary-600 dark:text-secondary-300">{user.pin ? "Un code PIN a été défini." : "Aucun code PIN défini."}</span>
                                        </div>
                                    </div>
                                    <Button onClick={() => onManagePin(user.id)}>
                                        {user.pin ? "Modifier" : "Créer"}
                                    </Button>
                                </div>
                                {canManageSecurity && (
                                    <div className="flex items-center justify-between rounded-2xl border border-secondary-100/70 dark:border-secondary-800/60 bg-white/90 dark:bg-secondary-900/40 p-4">
                                        <div className="flex items-center gap-4">
                                            <FingerprintIcon className="text-secondary-500 dark:text-secondary-300" />
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Empreinte digitale</span>
                                                <span className="text-sm text-secondary-600 dark:text-secondary-300">{user.webauthnCredentialId ? "Une empreinte est enregistrée." : "Aucune empreinte enregistrée."}</span>
                                            </div>
                                        </div>
                                        <Button onClick={() => onRegisterFingerprint(user.id)}>
                                            {user.webauthnCredentialId ? "Gérer" : "Enregistrer"}
                                        </Button>
                                    </div>
                                )}
                               </div>
                            </DetailSection>
                        )}
                    </div>
                )}
                
                {activeTab === 'equipment' && (
                    <div className="p-4">
                        <div className="surface-card surface-card-gradient rounded-3xl border border-white/60 dark:border-secondary-800/60 p-5 shadow-[var(--shadow-elev-1)]">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary-500 dark:text-secondary-300">inventory_2</span>
                                Équipement attribué
                            </h2>
                            {assignedEquipment.length > 0 ? (
                                <div className="space-y-3">
                                    {assignedEquipment.map((item: Equipment) => {
                                        const model = modelMap.get(item.modelId);
                                        const category = model ? categoryMap.get(model.categoryId) : undefined;
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-4 rounded-2xl border border-secondary-100/70 dark:border-secondary-800/60 bg-white/95 dark:bg-secondary-900/40 p-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elev-2)]"
                                            >
                                                <button
                                                    type="button"
                                                    className="flex flex-1 items-center gap-4 text-left"
                                                    onClick={() => window.location.hash = `#/equipment/${item.id}`}
                                                >
                                                    <div className="flex size-12 items-center justify-center rounded-xl bg-secondary-100/70 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-200">
                                                        <EquipmentIcon iconName={category?.icon} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{model?.name || 'Modèle inconnu'}</p>
                                                        <p className="text-xs text-secondary-600 dark:text-secondary-300">N/S: {item.assetTag}</p>
                                                    </div>
                                                </button>
                                                {canManageEquipment && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        icon="undo"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.hash = `#/return/equipment/${item.id}`;
                                                        }}
                                                    >
                                                        Retour
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-secondary-600 dark:text-secondary-300 text-center py-2">Aucun équipement attribué actuellement.</p>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'history' && (
                    <div className="p-4 space-y-6">
                        <div className="surface-card surface-card-gradient rounded-3xl border border-white/60 dark:border-secondary-800/60 p-6 shadow-[var(--shadow-elev-1)]">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-primary-100 dark:bg-primary-900/50">
                                    <span className="material-symbols-outlined text-primary-600 dark:text-primary-400">history</span>
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Historique des équipements
                                </h2>
                            </div>
                            {sortedAssignments.length > 0 ? (
                                <div className="relative space-y-4">
                                    <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-200/50 via-secondary-200/30 to-transparent dark:from-primary-500/30 dark:via-secondary-500/20 dark:to-transparent rounded-full" />
                                    {sortedAssignments.map((assignment: Assignment) => {
                                        const item = equipmentMap.get(assignment.equipmentId);
                                        if (!item) return null;
                                        const model = modelMap.get(item.modelId);
                                        const category = model ? categoryMap.get(model.categoryId) : undefined;
                                        const isReturn = assignment.action === FormAction.RETURN;
                                        return (
                                            <div key={assignment.id} className="relative flex items-start gap-4 group">
                                                <div className={`relative z-10 flex size-12 items-center justify-center rounded-xl shadow-[var(--shadow-elev-1)] transition-transform duration-300 group-hover:scale-105 ${isReturn ? 'bg-status-warning-100/90 dark:bg-status-warning-900/60' : 'bg-primary-100/90 dark:bg-primary-900/60'}`}>
                                                    <EquipmentIcon iconName={category?.icon} />
                                                </div>
                                                <div className="flex-1 rounded-2xl border border-white/40 dark:border-secondary-700/60 bg-white/80 dark:bg-secondary-900/60 backdrop-blur-sm p-4 shadow-sm transition-all duration-300 group-hover:shadow-[var(--shadow-elev-1)] group-hover:-translate-y-0.5">
                                                    <p className={`text-sm font-bold ${isReturn && assignment.status !== AssignmentStatus.REJECTED ? 'text-secondary-500 dark:text-secondary-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{model?.name || 'Modèle inconnu'}</p>
                                                    <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1.5 flex items-center gap-2">
                                                        {assignment.status === AssignmentStatus.REJECTED ? (
                                                            <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-danger-100 dark:bg-status-danger-900/50 text-status-danger-700 dark:text-status-danger-300 font-semibold text-xs'>
                                                                <span className="material-symbols-outlined !text-xs">cancel</span>
                                                                Rejetée
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-xs ${isReturn ? 'bg-status-warning-100 dark:bg-status-warning-900/50 text-status-warning-700 dark:text-status-warning-300' : 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'}`}>
                                                                <span className="material-symbols-outlined !text-xs">{isReturn ? 'undo' : 'check_circle'}</span>
                                                                {assignment.action}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined !text-xs">schedule</span>
                                                            {new Date(assignment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </p>
                                                    {assignment.status === AssignmentStatus.REJECTED && assignment.rejectionReason && (
                                                        <div className="mt-2 p-2 rounded-lg bg-status-danger-50/50 dark:bg-status-danger-900/20 border border-status-danger-200/50 dark:border-status-danger-700/50">
                                                            <p className="text-xs text-status-danger-700 dark:text-status-danger-300 italic flex items-start gap-1">
                                                                <span className="material-symbols-outlined !text-xs mt-0.5">info</span>
                                                                <span><strong>Raison :</strong> "{assignment.rejectionReason}"</span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="flex items-center justify-center size-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">inventory_2</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aucun historique</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Les équipements attribués apparaîtront ici</p>
                                </div>
                            )}
                        </div>

                        <div className="surface-card surface-card-gradient rounded-3xl border border-white/60 dark:border-secondary-800/60 p-6 shadow-[var(--shadow-elev-1)]">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/50">
                                    <span className="material-symbols-outlined text-secondary-600 dark:text-secondary-400">edit_note</span>
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Historique des modifications
                                </h2>
                            </div>
                            {userHistory.length > 0 ? (
                                <div className="relative space-y-4">
                                    <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-secondary-200/50 via-gray-200/30 to-transparent dark:from-secondary-500/30 dark:via-gray-500/20 dark:to-transparent rounded-full" />
                                    {userHistory.map((entry: EditHistoryEntry) => {
                                        const editorUser = userMap.get(entry.userId);
                                        return (
                                            <div key={entry.id} className="relative flex items-start gap-4 group">
                                                <div className="relative z-10 flex size-12 items-center justify-center rounded-full shadow-[var(--shadow-elev-1)] ring-4 ring-white dark:ring-gray-800 transition-transform duration-300 group-hover:scale-105">
                                                    <img src={editorUser?.avatarUrl} alt={editorUser?.name} className="size-12 rounded-full object-cover" />
                                                </div>
                                                <div className="flex-grow rounded-2xl border border-white/40 dark:border-secondary-700/60 bg-white/80 dark:bg-secondary-900/60 backdrop-blur-sm p-4 shadow-sm transition-all duration-300 group-hover:shadow-[var(--shadow-elev-1)] group-hover:-translate-y-0.5">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        Modifié par {editorUser?.name || 'Utilisateur inconnu'}
                                                    </p>
                                                    <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined !text-xs">schedule</span>
                                                        {new Date(entry.timestamp).toLocaleString('fr-FR', { 
                                                            day: 'numeric', 
                                                            month: 'short', 
                                                            year: 'numeric',
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {entry.changes.map((change, index) => (
                                                            <ChangeItem key={index} change={change} allUsers={allUsers} />
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="flex items-center justify-center size-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">edit_off</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aucune modification</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">L'historique des changements apparaîtra ici</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    onDelete(user.id);
                    setIsDeleteModalOpen(false);
                }}
                title={`Supprimer "${user.name}"`}
                confirmButtonText="Supprimer"
            >
                <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.</p>
            </ConfirmationModal>
        </div>
    );
};

export default UserDetails;