


import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Tooltip from './Tooltip';
import StatusBadge from './StatusBadge';
import ValidationStepper from './ValidationStepper';
import type { Assignment, Equipment, User, Model, Category, EditHistoryEntry, ChangeDetail, Site, Department, ValidationActor } from '../types';
import { EquipmentStatus, FormAction, UserRole, AssignmentStatus } from '../types';
import PageHeader, { PageHeaderActions, DetailSection, DetailRow, Tabs } from './PageHeader';
import { ConfirmationModal, RejectionModal, ValidationModal, AuditItemModal } from './Modals';

// Status colors handled by StatusBadge

const HistoryIcon: React.FC<{ action: FormAction, status?: AssignmentStatus }> = ({ action, status }) => {
    if (status === AssignmentStatus.REJECTED) {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400">block</span>
            </div>
        );
    }
    
    const isAssign = action === FormAction.ASSIGN;
    const icon = isAssign ? 'person_add' : 'undo';
    const bgColor = isAssign ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-orange-100 dark:bg-orange-900/50';
    const iconColor = isAssign ? 'text-primary-600 dark:text-primary-400' : 'text-orange-600 dark:text-orange-400';

    return (
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}>
            <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </div>
    );
};

interface ValidationRowProps {
  actorName: string;
  status: boolean;
  isPending: boolean;
  isWaiting?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  roleBadge?: string;
  highlight?: boolean;
  validatedByName?: string;
  tooltip?: string;
}

const ValidationRow: React.FC<ValidationRowProps> = ({
  actorName,
  status,
  isPending,
  isWaiting = false,
  onClick,
  disabled = false,
  roleBadge,
  highlight = false,
  validatedByName,
  tooltip,
}) => {
  let statusText = 'Validé';
  let statusColor = 'text-status-success-700 dark:text-status-success-400';
  let iconName = 'verified';
  let iconBgColor = 'bg-status-success-100 dark:bg-status-success-900/20';
  let iconColor = 'text-status-success-600 dark:text-status-success-400';
  let rightIcon: React.ReactNode = <span className="material-symbols-outlined text-2xl text-status-success-500">check_circle</span>;
  let containerStyles = 'bg-status-success-50/50 dark:bg-status-success-900/20 border-status-success-200 dark:border-status-success-700';

  const isInteractive = Boolean(onClick) && !disabled && !status && !isWaiting;

  if (isWaiting) {
    statusText = "En attente de l'étape précédente";
    statusColor = 'text-gray-500 dark:text-gray-400';
    iconName = 'more_horiz';
    iconBgColor = 'bg-gray-200 dark:bg-gray-700';
    iconColor = 'text-gray-500 dark:text-gray-400';
    rightIcon = null;
    containerStyles = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  } else if (isPending) {
    statusText = 'En attente de validation';
    statusColor = 'text-status-warning-700 dark:text-status-warning-400';
    iconName = 'hourglass_top';
    iconBgColor = 'bg-status-warning-100 dark:bg-status-warning-900/50';
    iconColor = 'text-status-warning-700 dark:text-status-warning-400';
    rightIcon = isInteractive ? <span className="material-symbols-outlined text-2xl text-gray-400 dark:text-gray-500">chevron_right</span> : null;
    containerStyles = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  }

  if (!isWaiting && !isPending && status && validatedByName) {
    statusText = `Validé par ${validatedByName}`;
  }

  const containerClasses = [
    'flex items-center gap-4 rounded-xl border p-4 w-full text-left transition-colors',
    containerStyles,
    isInteractive ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500' : 'cursor-default',
    disabled && !status ? 'opacity-60 cursor-not-allowed' : '',
    highlight ? 'ring-2 ring-primary-300 dark:ring-primary-700' : '',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <div className={`flex items-center justify-center rounded-full shrink-0 size-12 ${iconBgColor}`}>
        <span className={`material-symbols-outlined text-2xl ${iconColor}`}>{iconName}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-gray-900 dark:text-gray-100 text-base font-semibold leading-normal">{actorName}</p>
          {roleBadge && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{roleBadge}</span>
          )}
        </div>
        <p className={`text-sm font-medium ${statusColor}`}>{statusText}</p>
      </div>
      {rightIcon}
    </>
  );

  const element = isInteractive ? (
    <button type="button" onClick={onClick} className={containerClasses}>
      {content}
    </button>
  ) : (
    <div className={containerClasses}>{content}</div>
  );

  return tooltip && (disabled || isWaiting) ? (
    <Tooltip content={tooltip}>
      {element}
    </Tooltip>
  ) : (
    element
  );
};

const fieldLabels: Record<string, string> = {
  name: "Nom AD",
  assetTag: "N° de série",
  purchaseDate: "Date d'achat",
  warrantyEndDate: "Fin de garantie",
  status: "Statut",
  siteId: "Site",
  departmentId: "Service",
  os: "OS",
  ram: "RAM",
  storage: "Disque dur",
  notes: "Observations",
  operationalStatus: "Statut Opérationnel"
};

const formatValue = (field: string, value: any, sites: Site[], departments: Department[]): string => {
    if (value === null || value === undefined || value === '') return 'Vide';
    if (field === 'siteId') return sites.find(s => s.id === value)?.name || value;
    if (field === 'departmentId') return departments.find(d => d.id === value)?.name || value;
    return String(value);
};

const ChangeItem: React.FC<{ change: ChangeDetail; sites: Site[], departments: Department[] }> = ({ change, sites, departments }) => {
    const label = fieldLabels[change.field] || change.field;
    const oldValue = formatValue(change.field, change.oldValue, sites, departments);
    const newValue = formatValue(change.field, change.newValue, sites, departments);

    return (
        <li className="text-xs text-gray-600 dark:text-gray-400 pl-4">
            <span className="font-semibold">{label}:</span> de <span className="italic">"{oldValue}"</span> à <span className="italic">"{newValue}"</span>
        </li>
    );
};

// FIX: Cannot find name 'EquipmentDetailsProps'.
interface EquipmentDetailsProps {
    equipment: Equipment;
    assignments: Assignment[];
    users: User[];
    currentUser: User;
    models: Model[];
    categories: Category[];
    editHistory: EditHistoryEntry[];
    sites: Site[];
    departments: Department[];
    onBack: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onApprove: (id: string, actor?: ValidationActor) => void;
    onReject: (id: string, reason: string) => void;
}

const EquipmentDetails: React.FC<EquipmentDetailsProps> = ({ equipment, assignments, users, currentUser, models, categories, editHistory, sites, departments, onBack, onEdit, onDelete, onApprove, onReject }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [rejectionTarget, setRejectionTarget] = useState<Assignment | null>(null);
    const [validationTarget, setValidationTarget] = useState<Assignment | null>(null);
    const [validationActor, setValidationActor] = useState<ValidationActor | null>(null);
    const [actionPickerTarget, setActionPickerTarget] = useState<Assignment | null>(null);
    const model = models.find(m => m.id === equipment.modelId);
    const category = model ? categories.find(c => c.id === model.categoryId) : null;
    const userMap = new Map(users.map(u => [u.id, u]));

    const sortedAssignments = [...assignments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const latestAssignment = sortedAssignments.find(a => a.status === AssignmentStatus.APPROVED);

    const assignedUser = equipment.status === EquipmentStatus.ASSIGNED && latestAssignment
        ? users.find(u => u.id === latestAssignment.userId)
        : null;

    const pendingAssignment = (equipment.status === EquipmentStatus.PENDING_VALIDATION && equipment.pendingAssignmentId)
        ? assignments.find(a => a.id === equipment.pendingAssignmentId)
        : null;

    const needsCurrentUserAction = useMemo(() => {
        if (!pendingAssignment || !pendingAssignment.validation) return false;
        const a = pendingAssignment;
        const v = a.validation;
        const isAssign = a.action === FormAction.ASSIGN;

        // Admin IT validation first
        if (currentUser.role === UserRole.ADMIN && !v.it) return true;

        if (isAssign) {
            // Manager then User
            if (currentUser.id === a.managerId && !v.manager && v.it) return true;
            if (currentUser.id === a.userId && v.it && v.manager && !v.user) return true;
        } else {
            // RETURN: IT -> USER -> MANAGER
            if (currentUser.id === a.userId && v.it && !v.user) return true;
            if (currentUser.id === a.managerId && v.it && v.user && !v.manager) return true;
        }
        return false;
    }, [pendingAssignment, currentUser]);

    const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

    const actorEligibility = useMemo(() => {
        const defaultEligibility = {
            manager: { canAct: false, highlight: false },
            user: { canAct: false, highlight: false },
        } as const;

        if (!pendingAssignment || !pendingAssignment.validation) {
            return defaultEligibility;
        }

        const validation = pendingAssignment.validation;

        const isAssign = pendingAssignment.action === FormAction.ASSIGN;

        const managerAllowed = pendingAssignment.managerId === currentUser.id || canManage;
        const managerAlreadyValidated = !!validation.manager;
        const managerPrereqMet = isAssign ? validation.it : (validation.it && validation.user);
        const managerCanAct = managerAllowed && !managerAlreadyValidated && managerPrereqMet;
        const managerHighlight = managerCanAct && pendingAssignment.managerId === currentUser.id;

        const userAllowed = pendingAssignment.userId === currentUser.id || canManage;
        const userAlreadyValidated = !!validation.user;
        const userPrerequisiteMet = isAssign ? (validation.it && validation.manager) : validation.it;
        const userCanAct = userAllowed && !userAlreadyValidated && userPrerequisiteMet;
        const userHighlight = userCanAct && pendingAssignment.userId === currentUser.id;
        
        return {
            manager: { canAct: managerCanAct, highlight: managerHighlight },
            user: { canAct: userCanAct, highlight: userHighlight },
        } as const;
    }, [pendingAssignment, currentUser, canManage]);
    

    const suggestedActor = useMemo(() => {
        if (!pendingAssignment) return null;
        if (currentUser.role === UserRole.ADMIN && !pendingAssignment.validation?.it) return 'it';
        if (currentUser.id === pendingAssignment.managerId) return 'manager';
        if (currentUser.id === pendingAssignment.userId) return 'user';
        if (actorEligibility.manager.canAct) return 'manager';
        if (actorEligibility.user.canAct) return 'user';
        return null;
    }, [pendingAssignment, currentUser, actorEligibility]);
    
    const combinedHistory = useMemo(() => {
        const assignmentHistory = sortedAssignments.map(a => ({
            type: 'assignment' as const,
            date: new Date(a.date),
            data: a
        }));

        const equipmentEditHistory = editHistory
            .filter(entry => entry.entityType === 'equipment' && entry.entityId === equipment.id)
            .map(e => ({
                type: 'edit' as const,
                date: new Date(e.timestamp),
                data: e
            }));

        return [...assignmentHistory, ...equipmentEditHistory].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [sortedAssignments, editHistory, equipment.id]);

    const isDeletable = equipment.status !== EquipmentStatus.ASSIGNED && equipment.status !== EquipmentStatus.PENDING_VALIDATION;

    const equipmentActions = [];

    if (equipment.status === EquipmentStatus.AVAILABLE) {
        equipmentActions.push({
            label: 'Attribuer',
            icon: 'person_add',
            onClick: () => window.location.hash = `#/assign/equipment/${equipment.id}`,
            disabled: currentUser.role !== UserRole.ADMIN,
            title: currentUser.role !== UserRole.ADMIN ? "Seuls les administrateurs peuvent effectuer cette action." : undefined
        });
    }
    
    if (equipment.status === EquipmentStatus.ASSIGNED) {
        equipmentActions.push({
            label: 'Retourner',
            icon: 'undo',
            onClick: () => window.location.hash = `#/return/equipment/${equipment.id}`,
            disabled: currentUser.role !== UserRole.ADMIN,
            title: currentUser.role !== UserRole.ADMIN ? "Seuls les administrateurs peuvent effectuer cette action." : undefined
        });
    }

    if (canManage) {
        equipmentActions.push({ label: 'Modifier', icon: 'edit', onClick: () => onEdit(equipment.id) });
        equipmentActions.push({ label: 'Supprimer', icon: 'delete', onClick: () => setIsDeleteModalOpen(true), isDestructive: true, disabled: !isDeletable, title: !isDeletable ? "L'équipement attribué ou en attente ne peut être supprimé." : "Supprimer l'équipement" });
    }
    
    const tabs = [
        { id: 'details', label: 'Détails', icon: 'info' },
        { id: 'history', label: 'Historique', icon: 'history' },
    ];

    const statusHeroMetrics = [
        {
            label: 'Statut',
            value: equipment.status,
            description: assignedUser ? `Attribué à ${assignedUser.name}` : 'Aucun utilisateur assigné',
        },
        {
            label: 'Dernière activité',
            value: latestAssignment ? new Date(latestAssignment.date).toLocaleDateString() : 'N/A',
            description: latestAssignment ? latestAssignment.action : 'Aucune action',
        },
    ];

    const siteName = sites.find(s => s.id === equipment.siteId)?.name || 'Non défini';
    const departmentName = departments.find(d => d.id === equipment.departmentId)?.name || 'Non défini';

    return (
        <div className="flex flex-col h-full bg-secondary-50 dark:bg-[#0f1722] text-gray-900 dark:text-gray-100">
            <PageHeader title={model?.name || 'Détails'} onBack={onBack}>
                {equipmentActions.length > 0 && <PageHeaderActions actions={equipmentActions} />}
            </PageHeader>
            <main className="flex-1 overflow-y-auto pb-36">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="mx-4 mt-4 mb-6 rounded-3xl border border-white/60 dark:border-white/10 bg-white/85 dark:bg-secondary-900/60 shadow-[var(--shadow-elev-2)] overflow-hidden"
                >
                    <div className="relative">
                        <div className="aspect-[16/9] w-full overflow-hidden bg-secondary-100/40 dark:bg-secondary-900/40">
                            <img alt={model?.name} className="h-full w-full object-cover" src={model?.imageUrl || 'https://placehold.co/600x400/e2e8f0/a0aec0/png'} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                        <div className="absolute inset-0 flex flex-col justify-center p-6 text-white">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                                        {category?.name || 'Non catégorisé'}
                                    </p>
                                    <h1 className="mt-1 text-3xl font-semibold text-white tracking-tight">
                                        <button onClick={() => model && (window.location.hash = `#/models/${model.id}`)} className="text-left hover:underline">
                                            {model?.name || 'Modèle inconnu'}
                                        </button>
                                    </h1>
                                    <p className="text-sm text-white/75">N/S: {equipment.assetTag}</p>
                                </div>
                                <div className="flex gap-3">
                                    {statusHeroMetrics.map(metric => (
                                        <div key={metric.label} className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 backdrop-blur">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{metric.label}</p>
                                            <p className="mt-1 text-lg font-semibold">{metric.value}</p>
                                            <p className="text-xs text-white/70">{metric.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="rounded-2xl border border-white/60 dark:border-secondary-800/60 bg-white/90 dark:bg-secondary-900/40 p-4 flex items-center gap-4 shadow-[var(--shadow-elev-1)]">
                            <div className="flex items-center justify-center size-12 rounded-2xl bg-secondary-100/70 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-200">
                                <span className="material-symbols-outlined text-2xl">location_on</span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-300">Site & service</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{siteName}</p>
                                <p className="text-xs text-secondary-600 dark:text-secondary-300">{departmentName}</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {pendingAssignment && pendingAssignment.validation && (
                    <div className="px-4 pt-4">
                        <div className="surface-card surface-card-gradient rounded-3xl border border-white/60 dark:border-secondary-800/60 p-5 shadow-[var(--shadow-elev-1)]">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary-500 dark:text-secondary-300">rule</span>
                                Validation en attente
                            </h2>
                            {needsCurrentUserAction ? (
                                <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-4">Votre approbation est requise pour cette demande de {pendingAssignment.action === FormAction.ASSIGN ? 'dotation' : 'restitution'}.</p>
                            ) : (
                                <p className="text-sm text-secondary-600 dark:text-secondary-300 mb-4">Une action est requise par un autre utilisateur.</p>
                            )}
                            {(() => {
                                const isAssign = pendingAssignment.action === FormAction.ASSIGN;
                                const v = pendingAssignment.validation;
                                const canAdminTriggerManager = isAssign
                                    ? (canManage && !v.manager && v.it)
                                    : (canManage && !v.manager && v.it && v.user);
                                const canAdminTriggerUser = isAssign
                                    ? (canManage && !v.user && v.manager && v.it)
                                    : (canManage && !v.user && v.it);
                                return (
                                    <ValidationStepper
                                        assignment={pendingAssignment}
                                        currentUser={currentUser}
                                        userMap={userMap}
                                        manager={actorEligibility.manager}
                                        user={actorEligibility.user}
                                        canManage={canManage}
                                        canAdminTriggerManager={canAdminTriggerManager}
                                        canAdminTriggerUser={canAdminTriggerUser}
                                        onActorClick={(actor) => { setValidationActor(actor); setActionPickerTarget(pendingAssignment); }}
                                    />
                                );
                            })()}
                        </div>
                    </div>
                )}

                <Tabs tabs={tabs} activeTab={activeTab} onTabClick={(id) => setActiveTab(id as any)} />

                {activeTab === 'details' && (
                    <div className="p-4 space-y-6">
                        <DetailSection title="Spécifications" icon="list_alt" className="surface-card surface-card-gradient border border-white/60 dark:border-secondary-800/60">
                            <DetailRow label="Marque" value={model?.brand} />
                            <DetailRow label="Numéro de modèle" value={model?.modelNumber} />
                            <DetailRow label="Système d'exploitation" value={equipment.os} />
                            <DetailRow label="RAM" value={equipment.ram} />
                            <DetailRow label="Stockage" value={equipment.storage} />
                        </DetailSection>
                        <DetailSection title="Acquisition & Garantie" icon="receipt_long" className="surface-card surface-card-gradient border border-white/60 dark:border-secondary-800/60">
                            <DetailRow label="Date d'achat" value={equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString() : undefined} />
                            <DetailRow label="Début de la garantie" value={equipment.warrantyStartDate ? new Date(equipment.warrantyStartDate).toLocaleDateString() : undefined} />
                            <DetailRow label="Fin de la garantie" value={equipment.warrantyEndDate ? new Date(equipment.warrantyEndDate).toLocaleDateString() : undefined} />
                        </DetailSection>
                        <DetailSection title="Localisation" icon="pin_drop" className="surface-card surface-card-gradient border border-white/60 dark:border-secondary-800/60">
                            <DetailRow label="Site" value={sites.find(s => s.id === equipment.siteId)?.name} />
                            <DetailRow label="Service / Département" value={departments.find(d => d.id === equipment.departmentId)?.name} />
                        </DetailSection>
                        <DetailSection title="Sécurité & Agents" icon="security" className="surface-card surface-card-gradient border border-white/60 dark:border-secondary-800/60">
                            <DetailRow label="Statut Opérationnel" value={equipment.operationalStatus} />
                            <DetailRow label="Agent SentinelOne" value={equipment.agentS1} />
                            <DetailRow label="Agent Matrix42" value={equipment.agentM42} />
                            <DetailRow label="Agent ManageEngine" value={equipment.agentME} />
                        </DetailSection>
                        {equipment.notes && (
                            <DetailSection title="Observations" icon="notes" className="surface-card surface-card-gradient border border-white/60 dark:border-secondary-800/60">
                                <p className="sm:col-span-2 text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{equipment.notes}</p>
                            </DetailSection>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="p-4">
                        <div className="surface-card surface-card-gradient rounded-3xl border border-white/60 dark:border-secondary-800/60 p-5 shadow-[var(--shadow-elev-1)]">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary-500 dark:text-secondary-300">timeline</span>
                                Historique complet
                            </h2>
                            {combinedHistory.length > 0 ? (
                                <div className="relative pl-8">
                                    <div className="absolute left-4 top-2 -ml-px h-[calc(100%-1rem)] w-0.5 bg-secondary-200 dark:bg-secondary-800" aria-hidden="true" />
                                    <ul className="space-y-8">
                                        {combinedHistory.map((entry: { type: 'assignment'; data: Assignment } | { type: 'edit'; data: EditHistoryEntry }) => (
                                            <li key={`${entry.type}-${entry.data.id}`} className="relative">
                                                <div className="absolute -left-[38px] top-0">
                                                    {entry.type === 'assignment' ? (
                                                        <HistoryIcon action={entry.data.action} status={entry.data.status} />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
                                                            <span className="material-symbols-outlined text-primary-600 dark:text-primary-400">edit_note</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-6 rounded-2xl border border-secondary-100/60 dark:border-secondary-800/60 bg-white/95 dark:bg-secondary-900/40 p-4">
                                                    {entry.type === 'assignment' ? (
                                                        <>
                                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.data.action}</h3>
                                                            <p className="text-xs text-secondary-600 dark:text-secondary-300">
                                                                {entry.data.action === FormAction.ASSIGN ? 'Pour' : 'Par'} {userMap.get(entry.data.userId)?.name || 'Utilisateur inconnu'}
                                                            </p>
                                                            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{new Date(entry.data.date).toLocaleDateString()}</p>
                                                            {entry.data.status === AssignmentStatus.REJECTED && entry.data.rejectionReason && (
                                                                <p className="text-xs text-status-danger-600 dark:text-status-danger-400 italic mt-1">Rejeté: "{entry.data.rejectionReason}"</p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Modification de l'équipement</h3>
                                                            <p className="text-xs text-secondary-600 dark:text-secondary-300">
                                                                Par {userMap.get(entry.data.userId)?.name || 'Utilisateur inconnu'}
                                                            </p>
                                                            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">{new Date(entry.data.timestamp).toLocaleString()}</p>
                                                            <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-secondary-600 dark:text-secondary-300">
                                                                {entry.data.changes.map((change, idx) => (
                                                                    <ChangeItem key={idx} change={change} sites={sites} departments={departments} />
                                                                ))}
                                                            </ul>
                                                        </>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-center text-secondary-600 dark:text-secondary-300 py-4">Aucun historique trouvé pour cet équipement.</p>
                            )}
                        </div>
                    </div>
                )}
            </main>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    onDelete(equipment.id);
                    setIsDeleteModalOpen(false);
                }}
                title={`Supprimer "${model?.name || equipment.assetTag}"`}
                confirmButtonText="Supprimer"
            >
                <p>Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.</p>
            </ConfirmationModal>
            {rejectionTarget && (
                <RejectionModal
                    isOpen={!!rejectionTarget}
                    onClose={() => setRejectionTarget(null)}
                    onConfirm={(reason) => {
                        onReject(rejectionTarget.id, reason);
                        setRejectionTarget(null);
                    }}
                />
            )}
            {actionPickerTarget && (
                <AuditItemModal
                    isOpen={!!actionPickerTarget}
                    onClose={() => setActionPickerTarget(null)}
                    title="Choisir une action"
                    primaryButtonText="Valider"
                    onPrimaryClick={() => {
                        if (!actionPickerTarget) return;
                        setValidationTarget(actionPickerTarget);
                        setActionPickerTarget(null);
                    }}
                    secondaryButtonText="Rejeter"
                    onSecondaryClick={() => {
                        if (!actionPickerTarget) return;
                        setRejectionTarget(actionPickerTarget);
                        setActionPickerTarget(null);
                    }}
                    icon="rule"
                    iconBgColor="bg-primary-100"
                    iconColor="text-primary-600"
                >
                    <p className="text-sm text-gray-600">Souhaitez-vous valider ou rejeter cette étape de validation ?</p>
                </AuditItemModal>
            )}
            {validationTarget && (
                <ValidationModal
                    isOpen={!!validationTarget}
                    onClose={() => {
                        setValidationTarget(null);
                        setValidationActor(null);
                    }}
                    onConfirm={() => {
                        if (!validationTarget) {
                            return;
                        }
                        const inferredActor: ValidationActor | undefined = validationActor
                            ?? (validationTarget.managerId === currentUser.id
                                ? 'manager'
                                : validationTarget.userId === currentUser.id
                                    ? 'user'
                                    : undefined);
                        onApprove(validationTarget.id, inferredActor ?? undefined);
                        setValidationTarget(null);
                        setValidationActor(null);
                    }}
                    assignment={validationTarget}
                    equipment={{...equipment, model, category}}
                    userToValidate={(() => {
                        if (!validationActor || !validationTarget) return currentUser;
                        if (validationActor === 'manager') {
                            return users.find(u => u.id === validationTarget.managerId) || currentUser;
                        }
                        if (validationActor === 'it') {
                            return currentUser;
                        }
                        return users.find(u => u.id === validationTarget.userId) || currentUser;
                    })()}
                    actorLabel={validationActor === 'manager' ? 'Responsable' : validationActor === 'user' ? 'Utilisateur' : validationActor === 'it' ? 'Admin IT' : undefined}
                    instructions={validationActor === 'manager'
                        ? 'Confirmez l’attribution ou la restitution en tant que responsable.'
                        : validationActor === 'user'
                            ? 'Confirmez la réception ou la restitution en tant qu’utilisateur.'
                            : validationActor === 'it'
                                ? 'Confirmez l’opération en tant qu’administrateur IT.'
                                : undefined}
                />
            )}
        </div>
    );
};

export default EquipmentDetails;