import { Approval, ApprovalStatus, Equipment, User, UserRole } from '../types';

export interface BusinessRuleDecision {
    allowed: boolean;
    reason?: string;
}

interface ApprovalTransitionContext {
    approval: Approval;
    nextStatus: ApprovalStatus;
    actorRole?: UserRole;
    actorId?: string;
    users: User[];
}

interface EquipmentFromApprovalContext {
    status: ApprovalStatus;
    actorId?: string;
    nowISO: string;
}

interface UserUpdateContext {
    user: User;
    updates: Partial<User>;
    hasActiveApprovals: boolean;
    hasPendingManagerValidations: boolean;
}

interface UserDeleteContext {
    hasAssignedEquipment: boolean;
    hasActiveApprovals: boolean;
}

interface ReturnWorkflowContext {
    phase: 'initiation' | 'inspection';
    condition?: ReturnInspectionCondition;
    actorId?: string;
    nowISO: string;
}

export type ReturnInspectionCondition =
    | 'Excellent'
    | 'Bon'
    | 'Moyen'
    | 'Mauvais'
    | 'Dégradé'
    | 'Hors service';

const APPROVAL_TRANSITIONS: Partial<Record<ApprovalStatus, readonly ApprovalStatus[]>> = {
    WAITING_MANAGER_APPROVAL: ['WAITING_IT_PROCESSING', 'Rejected', 'Cancelled'],
    WAITING_IT_PROCESSING: ['WAITING_DOTATION_APPROVAL', 'Rejected', 'Cancelled'],
    WAITING_DOTATION_APPROVAL: ['PENDING_DELIVERY', 'WAITING_IT_PROCESSING', 'Rejected', 'Cancelled'],
    PENDING_DELIVERY: ['Completed', 'Rejected', 'Cancelled'],

    // Legacy compatibility
    WaitingManager: ['WAITING_IT_PROCESSING', 'Rejected', 'Cancelled'],
    Pending: ['WAITING_DOTATION_APPROVAL', 'PENDING_DELIVERY', 'Rejected', 'Cancelled'],
    Processing: ['WAITING_DOTATION_APPROVAL', 'PENDING_DELIVERY', 'Rejected', 'Cancelled'],
    WaitingUser: ['Completed', 'Rejected', 'Cancelled'],
};

export const ACTIVE_APPROVAL_STATUSES: readonly ApprovalStatus[] = [
    'Pending',
    'Processing',
    'WaitingManager',
    'WaitingUser',
    'WAITING_MANAGER_APPROVAL',
    'WAITING_IT_PROCESSING',
    'WAITING_DOTATION_APPROVAL',
    'PENDING_DELIVERY',
];

export const MANAGER_VALIDATION_PENDING_STATUSES: readonly ApprovalStatus[] = [
    'WaitingManager',
    'WAITING_MANAGER_APPROVAL',
    'WAITING_DOTATION_APPROVAL',
];

const RETURN_STATUS_BY_CONDITION: Record<ReturnInspectionCondition, Equipment['status']> = {
    Excellent: 'Disponible',
    Bon: 'Disponible',
    Moyen: 'Disponible',
    Mauvais: 'En réparation',
    Dégradé: 'En maintenance préventive',
    'Hors service': 'Retiré',
};

const MANAGER_GATES: readonly ApprovalStatus[] = ['WAITING_MANAGER_APPROVAL', 'WaitingManager', 'WAITING_DOTATION_APPROVAL'];
const IT_GATES: readonly ApprovalStatus[] = ['WAITING_IT_PROCESSING', 'Pending', 'Processing'];
const USER_CONFIRMATION_GATES: readonly ApprovalStatus[] = ['PENDING_DELIVERY', 'WaitingUser'];

const findUserByApprovalRef = (users: User[], id?: string, name?: string) => {
    return users.find((user) => {
        if (id && user.id === id) return true;
        if (name && (user.name === name || user.email === name)) return true;
        return false;
    });
};

const isManagerOfRequest = (approval: Approval, actorId: string, users: User[]) => {
    const requester = findUserByApprovalRef(users, approval.requesterId, approval.requesterName);
    const beneficiary = findUserByApprovalRef(users, approval.beneficiaryId, approval.beneficiaryName);

    if (approval.requesterId === actorId || approval.beneficiaryId === actorId) return true;
    if (requester?.managerId === actorId) return true;
    if (beneficiary?.managerId === actorId) return true;
    return false;
};

export const canTransitionApprovalStatus = ({
    approval,
    nextStatus,
    actorRole,
    actorId,
    users,
}: ApprovalTransitionContext): BusinessRuleDecision => {
    if (!actorRole) {
        return { allowed: false, reason: 'Session invalide: rôle manquant.' };
    }

    if (approval.status === nextStatus) {
        return { allowed: true };
    }

    const allowedTargets = APPROVAL_TRANSITIONS[approval.status] || [];
    if (!allowedTargets.includes(nextStatus)) {
        return {
            allowed: false,
            reason: `Transition non autorisée: ${approval.status} -> ${nextStatus}.`,
        };
    }

    if (actorRole === 'SuperAdmin') {
        return { allowed: true };
    }

    if (MANAGER_GATES.includes(approval.status)) {
        if (actorRole !== 'Manager') {
            return { allowed: false, reason: 'Cette étape est réservée au manager.' };
        }
        if (!actorId || !isManagerOfRequest(approval, actorId, users)) {
            return { allowed: false, reason: 'Vous ne gérez pas ce collaborateur.' };
        }
        return { allowed: true };
    }

    if (IT_GATES.includes(approval.status)) {
        if (actorRole !== 'Admin') {
            return { allowed: false, reason: 'Cette étape est réservée à l’IT.' };
        }
        return { allowed: true };
    }

    if (USER_CONFIRMATION_GATES.includes(approval.status)) {
        if (!actorId || approval.beneficiaryId !== actorId) {
            return { allowed: false, reason: 'Seul le bénéficiaire peut confirmer la réception.' };
        }
        return { allowed: true };
    }

    return { allowed: true };
};

export const getEquipmentUpdatesForApprovalStatus = ({
    status,
    actorId,
    nowISO,
}: EquipmentFromApprovalContext): Partial<Equipment> | null => {
    if (status === 'WAITING_MANAGER_APPROVAL') {
        return { status: 'En attente', assignmentStatus: 'WAITING_MANAGER_APPROVAL' };
    }
    if (status === 'WAITING_IT_PROCESSING') {
        return {
            status: 'En attente',
            assignmentStatus: 'WAITING_IT_PROCESSING',
            managerValidationBy: actorId,
            managerValidationAt: nowISO,
        };
    }
    if (status === 'WAITING_DOTATION_APPROVAL') {
        return { status: 'En attente', assignmentStatus: 'WAITING_DOTATION_APPROVAL' };
    }
    if (status === 'PENDING_DELIVERY') {
        return { status: 'En attente', assignmentStatus: 'PENDING_DELIVERY' };
    }
    if (status === 'Completed') {
        return {
            status: 'Attribué',
            assignmentStatus: 'CONFIRMED',
            confirmedBy: actorId,
            confirmedAt: nowISO,
        };
    }
    if (status === 'Rejected' || status === 'Cancelled') {
        return {
            status: 'Disponible',
            assignmentStatus: 'NONE',
            user: null,
        };
    }
    return null;
};

export const canDeleteEquipmentByBusinessRule = (
    equipment: Equipment,
    hasBusinessHistory: boolean,
): BusinessRuleDecision => {
    if (equipment.status === 'Attribué' || equipment.status === 'En attente') {
        return { allowed: false, reason: 'Impossible de supprimer un actif attribué ou en attente.' };
    }

    if (hasBusinessHistory) {
        return { allowed: false, reason: 'Suppression bloquée: actif avec historique métier existant.' };
    }

    return { allowed: true };
};

export const canUpdateUserByBusinessRule = ({
    user,
    updates,
    hasActiveApprovals,
    hasPendingManagerValidations,
}: UserUpdateContext): BusinessRuleDecision => {
    const wantsDeactivate = updates.status === 'inactive' && user.status !== 'inactive';
    if (wantsDeactivate && hasActiveApprovals) {
        return {
            allowed: false,
            reason: 'Impossible de désactiver un utilisateur avec des demandes en cours.',
        };
    }

    const managerChanged = !!updates.managerId && updates.managerId !== user.managerId;
    if (managerChanged && hasPendingManagerValidations) {
        return {
            allowed: false,
            reason: 'Impossible de changer le manager pendant une validation en attente.',
        };
    }

    return { allowed: true };
};

export const canDeleteUserByBusinessRule = ({
    hasAssignedEquipment,
    hasActiveApprovals,
}: UserDeleteContext): BusinessRuleDecision => {
    if (hasAssignedEquipment) {
        return {
            allowed: false,
            reason: 'Suppression impossible: ce compte possède encore des équipements assignés.',
        };
    }

    if (hasActiveApprovals) {
        return {
            allowed: false,
            reason: 'Suppression impossible: des demandes liées à cet utilisateur sont en cours.',
        };
    }

    return { allowed: true };
};

export const getEquipmentUpdatesForReturnWorkflow = ({
    phase,
    condition,
    actorId,
    nowISO,
}: ReturnWorkflowContext): Partial<Equipment> => {
    if (phase === 'initiation') {
        return {
            status: 'En attente',
            assignmentStatus: 'PENDING_RETURN',
            returnRequestedAt: nowISO,
            returnRequestedBy: actorId,
        };
    }

    const resolvedCondition = condition || 'Bon';
    const finalStatus = RETURN_STATUS_BY_CONDITION[resolvedCondition];
    const isRepairFlow = finalStatus === 'En réparation';

    return {
        status: finalStatus,
        assignmentStatus: 'NONE',
        user: null,
        assignedBy: undefined,
        assignedAt: undefined,
        assignedByName: undefined,
        managerValidationBy: undefined,
        managerValidationAt: undefined,
        confirmedBy: undefined,
        confirmedAt: undefined,
        reservedFor: undefined,
        reservedAt: undefined,
        returnInspectedAt: nowISO,
        lastReturnCondition: resolvedCondition,
        repairStartDate: isRepairFlow ? nowISO : undefined,
    };
};
