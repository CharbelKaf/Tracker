import React, { useState, useEffect, useMemo } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Pagination from '../../../components/ui/Pagination';
import Button from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { useDebounce } from '../../../hooks/useDebounce';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useData } from '../../../context/DataContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useToast } from '../../../context/ToastContext';
import { Approval } from '../../../types';
import { PageTabs, TabItem } from '../../../components/ui/PageTabs';
import { PageContainer } from '../../../components/layout/PageContainer';
import { ApprovalRow } from '../components/ApprovalRow';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import ListActionFab from '../../../components/ui/ListActionFab';
import { cn } from '../../../lib/utils';

const ITEMS_PER_PAGE = 10;
const LEGACY_ACTIVE_STATUSES: Approval['status'][] = ['Pending', 'Processing', 'WaitingManager', 'WaitingUser'];
const MODERN_ACTIVE_STATUSES: Approval['status'][] = [
    'WAITING_MANAGER_APPROVAL',
    'WAITING_IT_PROCESSING',
    'WAITING_DOTATION_APPROVAL',
    'PENDING_DELIVERY',
];
const ACTIVE_REQUEST_STATUSES: Approval['status'][] = [...LEGACY_ACTIVE_STATUSES, ...MODERN_ACTIVE_STATUSES];
const HISTORY_STATUSES: Approval['status'][] = ['Approved', 'Rejected', 'Completed', 'Cancelled'];

type ApprovalView = 'active' | 'history';

const isLegacyWorkflow = (status: Approval['status']) => LEGACY_ACTIVE_STATUSES.includes(status);
const isModernWorkflow = (status: Approval['status']) => MODERN_ACTIVE_STATUSES.includes(status);

const ApprovalsPage = () => {
    const [activeView, setActiveView] = useState<ApprovalView>('active');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { user: currentUser, role, canValidateRequest } = useAccessControl();
    const { users, approvals, updateApproval } = useData();
    const { navigate } = useAppNavigation();
    const { showToast } = useToast();
    const isCompact = useMediaQuery('(max-width: 599px)');

    const userAvatarById = useMemo(() => {
        return new Map(users.map((user) => [user.id, user.avatar]));
    }, [users]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeView, debouncedSearch]);

    const isUserAllowedToValidate = (approval: Approval) => {
        if (!currentUser) return false;

        if (approval.status === 'WAITING_MANAGER_APPROVAL') {
            return canValidateRequest(approval, users);
        }

        if (approval.status === 'WAITING_IT_PROCESSING') {
            return role === 'Admin' || role === 'SuperAdmin';
        }

        if (approval.status === 'WAITING_DOTATION_APPROVAL') {
            return canValidateRequest(approval, users);
        }

        if (approval.status === 'PENDING_DELIVERY') {
            return approval.beneficiaryId === currentUser.id;
        }

        if (approval.status === 'Pending') return role === 'Admin' || role === 'SuperAdmin';
        if (approval.status === 'WaitingManager') return canValidateRequest(approval, users);
        if (approval.status === 'WaitingUser') return approval.beneficiaryId === currentUser.id;

        return false;
    };

    const activeApprovals = useMemo(() => {
        if (!currentUser) return [];

        const actionable = approvals.filter((approval) => isUserAllowedToValidate(approval));
        const relatedActive = approvals.filter((approval) =>
            ACTIVE_REQUEST_STATUSES.includes(approval.status)
            && (approval.requesterId === currentUser.id || approval.beneficiaryId === currentUser.id),
        );

        const merged = new Map<string, Approval>();
        [...actionable, ...relatedActive].forEach((approval) => merged.set(approval.id, approval));

        return Array.from(merged.values());
    }, [approvals, currentUser, role, users, canValidateRequest]);

    const historyApprovals = useMemo(() => {
        if (!currentUser) return [];

        if (role === 'Admin' || role === 'SuperAdmin') {
            return approvals.filter((approval) => HISTORY_STATUSES.includes(approval.status));
        }

        if (role === 'Manager') {
            const teamUserIds = users.filter((user) => user.managerId === currentUser.id).map((user) => user.id);
            return approvals.filter((approval) =>
                HISTORY_STATUSES.includes(approval.status)
                && (
                    approval.requesterId === currentUser.id
                    || teamUserIds.includes(approval.requesterId)
                    || approval.beneficiaryId === currentUser.id
                    || teamUserIds.includes(approval.beneficiaryId)
                ),
            );
        }

        return approvals.filter((approval) =>
            HISTORY_STATUSES.includes(approval.status)
            && (approval.requesterId === currentUser.id || approval.beneficiaryId === currentUser.id),
        );
    }, [approvals, currentUser, role, users]);

    const filteredList = useMemo(() => {
        let list = activeView === 'active' ? [...activeApprovals] : [...historyApprovals];

        if (debouncedSearch) {
            const lower = debouncedSearch.toLowerCase();
            list = list.filter((item) =>
                item.equipmentName?.toLowerCase().includes(lower)
                || item.requester?.toLowerCase().includes(lower)
                || item.requesterName?.toLowerCase().includes(lower)
                || item.beneficiaryName?.toLowerCase().includes(lower),
            );
        }

        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
    }, [activeView, activeApprovals, historyApprovals, debouncedSearch]);

    const hasMixedWorkflowFamilies = useMemo(() => {
        if (activeView !== 'active') return false;

        const hasLegacy = filteredList.some((item) => isLegacyWorkflow(item.status));
        const hasModern = filteredList.some((item) => isModernWorkflow(item.status));

        return hasLegacy && hasModern;
    }, [activeView, filteredList]);

    const workflowContextMessage = hasMixedWorkflowFamilies
        ? 'Certaines demandes suivent un parcours précédent. Les actions proposées restent adaptées à chaque étape.'
        : 'Les actions disponibles dépendent de l\'étape de validation affichée.';

    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
    const paginatedList = filteredList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const applyApprovalTransition = (
        approval: Approval,
        nextStatus: Approval['status'],
        successMessage: string,
    ) => {
        const decision = updateApproval(approval.id, nextStatus);
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return false;
        }
        showToast(successMessage, 'success');
        return true;
    };

    const handleAction = (approval: Approval) => {
        if (approval.status === 'WAITING_MANAGER_APPROVAL' || approval.status === 'WaitingManager') {
            applyApprovalTransition(approval, 'WAITING_IT_PROCESSING', 'Demande approuvée. Transmise à l\'IT.');
            return;
        }

        if (approval.status === 'WAITING_IT_PROCESSING' || approval.status === 'Pending') {
            const params = new URLSearchParams();
            params.append('approvalId', approval.id);
            params.append('userId', approval.beneficiaryId);
            params.append('category', approval.equipmentCategory || '');
            navigate(`/wizards/assignment?${params.toString()}`);
            return;
        }

        if (approval.status === 'WAITING_DOTATION_APPROVAL') {
            applyApprovalTransition(
                approval,
                'PENDING_DELIVERY',
                'Dotation approuvée. En attente de confirmation utilisateur.',
            );
            return;
        }

        if (approval.status === 'PENDING_DELIVERY' || approval.status === 'WaitingUser') {
            applyApprovalTransition(approval, 'Completed', 'Réception confirmée.');
            return;
        }
    };

    const handleReject = (approval: Approval) => {
        const nextStatus: Approval['status'] = approval.status === 'WAITING_DOTATION_APPROVAL'
            ? 'WAITING_IT_PROCESSING'
            : 'Rejected';
        const decision = updateApproval(approval.id, nextStatus);
        if (!decision.allowed) {
            showToast(decision.reason || 'Action non autorisée.', 'error');
            return;
        }
        if (nextStatus === 'WAITING_IT_PROCESSING') {
            showToast('Dotation refusée. Retour en traitement IT.', 'info');
            return;
        }
        showToast('Demande rejetée', 'info');
    };

    const activeCount = activeApprovals.length;

    const tabs: TabItem[] = [
        {
            id: 'active',
            label: 'En cours',
            icon: <MaterialIcon name="inbox" />,
            badge: activeCount > 0 ? activeCount : undefined,
        },
        {
            id: 'history',
            label: 'Historique',
            icon: <MaterialIcon name="history" />,
        },
    ];

    const getStepDetails = (approval: Approval) => {
        if (approval.status === 'WAITING_MANAGER_APPROVAL' || approval.status === 'WaitingManager') {
            return {
                label: 'Validation Manager',
                color: 'text-on-tertiary-container',
                bg: 'bg-tertiary-container',
                icon: <MaterialIcon name="how_to_reg" size={14} />,
                btnText: 'Approuver',
            };
        }
        if (approval.status === 'WAITING_IT_PROCESSING' || approval.status === 'Pending' || approval.status === 'Processing') {
            return {
                label: 'Traitement IT',
                color: 'text-on-secondary-container',
                bg: 'bg-secondary-container',
                icon: <MaterialIcon name="settings" size={14} />,
                btnText: 'Affecter',
            };
        }
        if (approval.status === 'WAITING_DOTATION_APPROVAL') {
            return {
                label: 'Validation dotation',
                color: 'text-on-primary-container',
                bg: 'bg-primary-container',
                icon: <MaterialIcon name="verified" size={14} />,
                btnText: 'Valider',
            };
        }
        if (approval.status === 'PENDING_DELIVERY' || approval.status === 'WaitingUser') {
            return {
                label: 'Confirmation utilisateur',
                color: 'text-on-secondary-container',
                bg: 'bg-secondary-container',
                icon: <MaterialIcon name="task_alt" size={14} />,
                btnText: 'Confirmer',
            };
        }
        if (approval.status === 'Approved') {
            return {
                label: 'Approuvée',
                color: 'text-on-tertiary-container',
                bg: 'bg-tertiary-container',
                icon: <MaterialIcon name="check_circle" size={14} />,
                btnText: 'Voir',
            };
        }
        if (approval.status === 'Rejected') {
            return {
                label: 'Refusée',
                color: 'text-on-error-container',
                bg: 'bg-error-container',
                icon: <MaterialIcon name="cancel" size={14} />,
                btnText: 'Voir',
            };
        }
        if (approval.status === 'Cancelled') {
            return {
                label: 'Annulée',
                color: 'text-on-surface-variant',
                bg: 'bg-surface-container-high',
                icon: <MaterialIcon name="do_not_disturb_on" size={14} />,
                btnText: 'Voir',
            };
        }
        if (approval.status === 'Completed') {
            return {
                label: 'Terminée',
                color: 'text-on-surface-variant',
                bg: 'bg-surface-container',
                icon: <MaterialIcon name="task_alt" size={14} />,
                btnText: 'Voir',
            };
        }

        return {
            label: 'Statut inconnu',
            color: 'text-on-surface-variant',
            bg: 'bg-surface-container',
            icon: <MaterialIcon name="help" size={14} />,
            btnText: 'Voir',
        };
    };

    const getWorkflowHint = (approval: Approval) => {
        if (activeView !== 'active' || !hasMixedWorkflowFamilies) return undefined;
        if (isLegacyWorkflow(approval.status)) return 'Parcours de validation précédent';
        return undefined;
    };

    return (
        <div className="flex flex-col h-full bg-surface-background">
            <div className="bg-surface border-b border-outline-variant pt-page-sm medium:pt-page pb-0 px-0 sticky top-0 z-20">
                <div className="px-page-sm medium:px-page mb-6">
                    <PageHeader
                        sticky={false}
                        title={GLOSSARY.APPROVALS}
                        subtitle={role === 'User' ? 'Suivez l\'état de vos demandes d\'équipement.' : 'Centre de validation des demandes.'}
                        breadcrumb={GLOSSARY.APPROVALS}
                        actions={isCompact ? null : (
                            <Button
                                variant="filled"
                                icon={<MaterialIcon name="add" size={18} />}
                                onClick={() => navigate('/approvals/new')}
                            >
                                Nouvelle demande
                            </Button>
                        )}
                    />
                </div>

                <PageTabs
                    items={tabs}
                    activeId={activeView}
                    onChange={(id) => setActiveView(id as ApprovalView)}
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                <PageContainer>
                    <div className={cn('animate-in fade-in slide-in-from-bottom-4 duration-macro space-y-6', isCompact && 'pb-44')}>
                        {isCompact ? (
                            <SearchFilterBar
                                searchValue={searchQuery}
                                onSearchChange={setSearchQuery}
                                placeholder="Rechercher une demande..."
                            />
                        ) : (
                            <SearchFilterBar
                                searchValue={searchQuery}
                                onSearchChange={setSearchQuery}
                                placeholder="Rechercher une demande..."
                                resultCount={filteredList.length}
                            />
                        )}

                        {isCompact && (
                            <p className="-mt-3 text-body-small text-on-surface-variant">
                                {filteredList.length} demande{filteredList.length > 1 ? 's' : ''}
                            </p>
                        )}
                        {activeView === 'active' && (
                            <div className="-mt-2 rounded-md border border-outline-variant bg-surface-container-low px-3 py-2 text-body-small text-on-surface-variant flex items-start gap-2">
                                <MaterialIcon name="info" size={16} className="shrink-0 mt-0.5" />
                                <p>{workflowContextMessage}</p>
                            </div>
                        )}

                        <div className="bg-surface rounded-card border border-outline-variant shadow-elevation-1 overflow-hidden min-h-[400px]">
                            {paginatedList.length > 0 ? (
                                <div className="divide-y divide-outline-variant/30">
                                    {paginatedList.map((approval) => {
                                        const stepDetails = getStepDetails(approval);
                                        const isActionable = activeView === 'active' && isUserAllowedToValidate(approval);

                                        return (
                                            <ApprovalRow
                                                key={approval.id}
                                                approval={approval}
                                                stepDetails={stepDetails}
                                                compact={activeView === 'history'}
                                                showActions={isActionable}
                                                onApprove={handleAction}
                                                onReject={handleReject}
                                                requesterAvatar={userAvatarById.get(approval.requesterId)}
                                                beneficiaryAvatar={userAvatarById.get(approval.beneficiaryId)}
                                                workflowHint={getWorkflowHint(approval)}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-12">
                                    <EmptyState
                                        icon={activeView === 'active' ? 'inbox' : 'history'}
                                        title={activeView === 'active' ? 'Aucune demande active' : 'Historique vide'}
                                        description={
                                            activeView === 'active'
                                                ? 'Aucune demande à traiter ou à suivre pour le moment.'
                                                : 'Aucune demande passée trouvée.'
                                        }
                                        action={activeView === 'active' && (
                                            <Button variant="filled" icon={<MaterialIcon name="add" size={18} />} onClick={() => navigate('/approvals/new')}>
                                                Faire une demande
                                            </Button>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {isCompact && (
                            <ListActionFab
                                label="Demande"
                                className="bottom-20 right-4"
                                sheetTitle="Actions Demandes"
                                actions={[
                                    {
                                        id: 'new-request',
                                        label: 'Nouvelle demande',
                                        icon: 'add',
                                        variant: 'filled' as const,
                                        onSelect: () => navigate('/approvals/new'),
                                    },
                                ]}
                            />
                        )}

                        {filteredList.length > 0 && (
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        )}
                    </div>
                </PageContainer>
            </div>
        </div>
    );
};

export default ApprovalsPage;
