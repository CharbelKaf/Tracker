


import React, { useEffect, useMemo, useState } from 'react';
import type { Assignment, Equipment, Model, Category, User, EquipmentWithDetails, ValidationActor } from '../types';
import { FormAction, UserRole, EquipmentStatus, AssignmentStatus } from '../types';
import PageHeader, { ListItemCard } from './PageHeader';
import Tooltip from './Tooltip';
import { RejectionModal, ValidationModal } from './Modals';

interface PendingApprovalsProps {
  assignments: Assignment[];
  equipment: Equipment[];
  models: Model[];
  categories: Category[];
  users: User[];
  currentUser: User;
  onApprove: (assignmentId: string, actor?: ValidationActor) => void;
  onReject: (assignmentId: string, reason: string) => void;
  onBack: () => void;
}

const PendingApprovals: React.FC<PendingApprovalsProps> = ({ assignments, equipment, models, categories, users, currentUser, onApprove, onReject, onBack }) => {
    const equipmentMap = new Map(equipment.map(e => [e.id, e]));
    const modelMap = new Map(models.map(m => [m.id, m]));
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const userMap = new Map(users.map(u => [u.id, u]));
    
    const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
    const [validationTarget, setValidationTarget] = useState<Assignment | null>(null);
    const [validationActor, setValidationActor] = useState<ValidationActor | null>(null);
    const [view, setView] = useState<'me' | 'team' | 'all'>('me');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 250);
        return () => clearTimeout(t);
    }, []);

    const directReports = useMemo(() => users.filter(u => u.managerId === currentUser.id).map(u => u.id), [users, currentUser.id]);
    const directReportsSet = useMemo(() => new Set(directReports), [directReports]);

    const getRoleNeeded = (a: Assignment): ValidationActor | null => {
        const v = a.validation;
        if (!v) return null;
        if (!v.it) return 'it';
        if (a.action === FormAction.ASSIGN) {
            if (!v.manager) return 'manager';
            if (v.it && v.manager && !v.user) return 'user';
        } else {
            if (v.it && !v.user) return 'user';
            if (v.it && v.user && !v.manager) return 'manager';
        }
        return null;
    };

    const getActorForCurrentUser = (a: Assignment): ValidationActor | null => {
        const v = a.validation;
        if (!v) return null;
        if (currentUser.role === UserRole.ADMIN && !v.it) return 'it';
        if (a.action === FormAction.ASSIGN) {
            if (currentUser.id === a.managerId && !v.manager) return 'manager';
            if (currentUser.id === a.userId && v.it && v.manager && !v.user) return 'user';
        } else {
            if (currentUser.id === a.userId && v.it && !v.user) return 'user';
            if (currentUser.id === a.managerId && v.it && v.user && !v.manager) return 'manager';
        }
        return null;
    };

    const allPending = useMemo(() => assignments.filter(a => {
        const eq = equipment.find(e => e.id === a.equipmentId);
        if (!eq) return false;
        if (eq.status !== EquipmentStatus.PENDING_VALIDATION) return false;
        if (a.status !== AssignmentStatus.PENDING || !a.validation) return false;
        return getRoleNeeded(a) !== null;
    }), [assignments, equipment]);

    // Historique des approbations : toutes les assignations avec validation complète, filtrées selon le rôle
    const approvalHistory = useMemo(() => {
        const allCompleted = assignments.filter(a => {
            if (!a.validation) return false;
            // Validation complète = tous les acteurs ont validé
            const v = a.validation;
            if (a.action === FormAction.ASSIGN) {
                return v.it && v.manager && v.user;
            } else {
                return v.it && v.user && v.manager;
            }
        });

        // Filtrer selon le rôle de l'utilisateur
        if (currentUser.role === UserRole.ADMIN) {
            // Admin voit tout l'historique
            return allCompleted;
        } else if (currentUser.role === UserRole.MANAGER) {
            // Manager voit l'historique de son équipe et de lui-même
            return allCompleted.filter(a => 
                a.userId === currentUser.id || 
                a.managerId === currentUser.id || 
                directReportsSet.has(a.userId)
            );
        } else {
            // User voit uniquement ses propres assignations
            return allCompleted.filter(a => a.userId === currentUser.id);
        }
    }, [assignments, currentUser.id, currentUser.role, directReportsSet]);

    const myPending = useMemo(() => allPending.filter(a => getActorForCurrentUser(a) !== null), [allPending]);
    const teamPending = useMemo(() => {
        if (currentUser.role !== UserRole.MANAGER) return myPending;
        return allPending.filter(a => a.managerId === currentUser.id || directReportsSet.has(a.userId));
    }, [allPending, myPending, currentUser.role, currentUser.id, directReportsSet]);

    const sorted = (list: Assignment[]) => [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedDescending = (list: Assignment[]) => [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const displayList = useMemo(() => {
        if (view === 'me') return sorted(myPending);
        if (view === 'team') return sorted(teamPending);
        // Vue "Tous" = historique des approbations (plus récent en premier)
        return sortedDescending(approvalHistory);
    }, [view, myPending, teamPending, approvalHistory]);

    const grouped = useMemo(() => {
        const groups: Record<ValidationActor, Assignment[]> = { it: [], manager: [], user: [] };
        if (view === 'all') {
            // Pour l'historique, pas de groupement par rôle
            return groups;
        }
        displayList.forEach(a => {
            const r = getRoleNeeded(a);
            if (r) groups[r].push(a);
        });
        return groups;
    }, [displayList, view]);

    const handleConfirmRejection = (reason: string) => {
        if (rejectionTargetId) {
            onReject(rejectionTargetId, reason);
            setRejectionTargetId(null);
        }
    };
    
    const handleValidationConfirm = () => {
        if (validationTarget) {
            onApprove(validationTarget.id, validationActor || undefined);
            setValidationTarget(null);
            setValidationActor(null);
        }
    };
    
    const equipmentWithDetails = (item: Equipment | undefined): EquipmentWithDetails | null => {
        if (!item) return null;
        const model = modelMap.get(item.modelId);
        const category = model ? categoryMap.get(model.categoryId) : null;
        return { ...item, model: model || null, category: category || null };
    };

    const equipmentForValidation = validationTarget ? equipmentWithDetails(equipmentMap.get(validationTarget.equipmentId)) : null;

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            <PageHeader title="Approbations en attente" onBack={onBack} />
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex gap-2 mb-2">
                    <button onClick={() => setView('me')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${view==='me' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>À moi</button>
                    {currentUser.role === UserRole.MANAGER && (
                        <button onClick={() => setView('team')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${view==='team' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Mon équipe</button>
                    )}
                    <button onClick={() => setView('all')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${view==='all' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Historique</button>
                </div>
                {isLoading ? (
                    <div className="space-y-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="animate-pulse rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm">
                                <div className="flex gap-4 items-center">
                                    <div className="h-16 w-16 rounded-md bg-gray-200 dark:bg-gray-700" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayList.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center">
                        <span className="material-symbols-outlined text-6xl text-green-500 mb-4">task_alt</span>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tout est à jour !</h3>
                        <p className="text-gray-500 dark:text-gray-400">{view === 'all' ? 'Aucun historique d\'approbation disponible.' : 'Il n\'y a aucune approbation en attente.'}</p>
                    </div>
                ) : view === 'all' ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1 mb-3">
                            <span className="material-symbols-outlined text-sm text-gray-500">history</span>
                            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                Historique des approbations ({displayList.length})
                            </h4>
                        </div>
                        {displayList.map((assignment: Assignment) => {
                            const item = equipmentMap.get(assignment.equipmentId);
                            if (!item) return null;
                            const model = modelMap.get(item.modelId);
                            const category = model ? categoryMap.get(model.categoryId) : null;
                            const user = userMap.get(assignment.userId);
                            const v = assignment.validation;

                            const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(assignment.date).getTime()) / (1000 * 60 * 60 * 24)));

                            return (
                                <ListItemCard
                                    key={assignment.id}
                                    id={assignment.id}
                                    imageUrl={model?.imageUrl}
                                    title={model?.name || 'Modèle inconnu'}
                                    details={[
                                        { text: `${assignment.action === FormAction.ASSIGN ? 'Attribution' : 'Retour'} validé • ${category?.name}` },
                                        { icon: 'person', text: `Utilisateur : ${user?.name || 'Inconnu'}` },
                                        { icon: 'schedule', text: `Il y a ${daysAgo}j` },
                                        { icon: 'check_circle', text: `Validé par IT, Manager et Utilisateur` }
                                    ]}
                                    onCardClick={(id) => window.location.hash = `#/equipment/${item.id}`}
                                />
                            );
                        })}
                    </div>
                ) : (
                    (['it','manager','user'] as ValidationActor[]).map((role) => {
                        const list = grouped[role];
                        if (list.length === 0) return null;
                        return (
                            <div key={role} className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="material-symbols-outlined text-sm text-gray-500">{role==='it' ? 'shield_person' : role==='manager' ? 'workspace_premium' : 'person'}</span>
                                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                        {role==='it' ? 'Admin IT' : role==='manager' ? 'Responsable' : 'Utilisateur'} ({list.length})
                                    </h4>
                                </div>
                                {list.map((assignment: Assignment) => {
                                    const item = equipmentMap.get(assignment.equipmentId);
                                    if (!item) return null;
                                    const model = modelMap.get(item.modelId);
                                    const category = model ? categoryMap.get(model.categoryId) : null;

                                    const validationRole: ValidationActor | null = getActorForCurrentUser(assignment);

                                    const requiredRole: ValidationActor | null = getRoleNeeded(assignment);
                                    const disabledReason = !validationRole && requiredRole ? (
                                        requiredRole === 'it' ? "Action réservée à l’Admin IT" : requiredRole === 'manager' ? 'Action réservée au Responsable' : 'Action réservée à l’utilisateur'
                                    ) : undefined;

                                    const footer = (
                                        <div className="flex">
                                            <button onClick={() => setRejectionTargetId(assignment.id)} className="flex-1 p-3 text-center text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-bl-xl">
                                                Rejeter
                                            </button>
                                            {disabledReason ? (
                                                <Tooltip content={disabledReason}>
                                                    <button
                                                        onClick={() => { /* disabled */ }}
                                                        disabled
                                                        className={`flex-1 p-3 text-center text-sm font-semibold border-l border-gray-200 dark:border-gray-700 transition-colors rounded-br-xl text-gray-400 cursor-not-allowed`}
                                                    >
                                                        Valider
                                                    </button>
                                                </Tooltip>
                                            ) : (
                                                <button
                                                    onClick={() => { if (!validationRole) return; setValidationTarget(assignment); setValidationActor(validationRole); }}
                                                    className={`flex-1 p-3 text-center text-sm font-semibold border-l border-gray-200 dark:border-gray-700 transition-colors rounded-br-xl text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20`}
                                                >
                                                    Valider
                                                </button>
                                            )}
                                        </div>
                                    );

                                    const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(assignment.date).getTime()) / (1000 * 60 * 60 * 24)));
                                    const isUrgent = daysAgo >= 7;

                                    return (
                                        <ListItemCard
                                            key={assignment.id}
                                            id={assignment.id}
                                            imageUrl={model?.imageUrl}
                                            title={model?.name || 'Modèle inconnu'}
                                            details={[
                                                { text: `${assignment.action === FormAction.ASSIGN ? 'Nouvelle attribution' : 'Demande de retour'} • ${category?.name}` },
                                                { icon: 'person', text: `Pour : ${userMap.get(assignment.userId)?.name || 'Utilisateur inconnu'}` },
                                                { icon: 'schedule', text: `Depuis ${daysAgo}j${isUrgent ? ' • Urgent' : ''}` }
                                            ]}
                                            onCardClick={(id) => window.location.hash = `#/equipment/${item.id}`}
                                            footerActions={footer}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </main>
            <RejectionModal
                isOpen={!!rejectionTargetId}
                onClose={() => setRejectionTargetId(null)}
                onConfirm={handleConfirmRejection}
            />
            {validationTarget && equipmentForValidation && (
                <ValidationModal
                    isOpen={!!validationTarget}
                    onClose={() => { setValidationTarget(null); setValidationActor(null); }}
                    onConfirm={handleValidationConfirm}
                    assignment={validationTarget}
                    equipment={equipmentForValidation}
                    userToValidate={(() => {
                        if (!validationActor) return currentUser;
                        if (validationActor === 'it') return currentUser;
                        if (validationActor === 'manager') return userMap.get(validationTarget.managerId) || currentUser;
                        return userMap.get(validationTarget.userId) || currentUser;
                    })()}
                    actorLabel={validationActor === 'it' ? 'Admin IT' : validationActor === 'manager' ? 'Responsable' : validationActor === 'user' ? 'Utilisateur' : undefined}
                />
            )}
        </div>
    );
};

export default PendingApprovals;