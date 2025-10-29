import React from 'react';
import type { Assignment, User, ValidationActor } from '../types';
import { FormAction, UserRole } from '../types';

interface ActorEligibility {
  canAct: boolean;
  highlight: boolean;
}

interface ValidationStepperProps {
  assignment: Assignment;
  currentUser: User;
  userMap: Map<string, User>;
  manager: ActorEligibility;
  user: ActorEligibility;
  canManage: boolean;
  canAdminTriggerManager: boolean;
  canAdminTriggerUser: boolean;
  onActorClick: (actor: ValidationActor) => void;
}

const roleMeta: Record<ValidationActor, { label: string; icon: string; color: string; badge?: string }> = {
  it: { label: 'Admin IT', icon: 'shield_person', color: 'text-blue-600 dark:text-blue-400', badge: 'IT' },
  manager: { label: 'Responsable', icon: 'workspace_premium', color: 'text-violet-600 dark:text-violet-400', badge: 'Manager' },
  user: { label: 'Utilisateur', icon: 'person', color: 'text-emerald-600 dark:text-emerald-400', badge: 'Employé' },
};

const ValidationStepper: React.FC<ValidationStepperProps> = ({
  assignment,
  currentUser,
  userMap,
  manager,
  user,
  canManage,
  canAdminTriggerManager,
  canAdminTriggerUser,
  onActorClick,
}) => {
  const order: ValidationActor[] = assignment.action === FormAction.ASSIGN ? ['it', 'manager', 'user'] : ['it', 'user', 'manager'];
  const { validation, validatedBy, validatedAt } = assignment;
  const v = validation as Record<ValidationActor, boolean>;
  const vb = (validatedBy || {}) as Partial<Record<ValidationActor, string>>;
  const va = (validatedAt || {}) as Partial<Record<ValidationActor, string>>;
  const canActMap: Record<ValidationActor, boolean> = {
    it: currentUser.role === UserRole.ADMIN && !v.it,
    manager: (manager.canAct || canAdminTriggerManager) && !v.manager,
    user: (user.canAct || canAdminTriggerUser) && !v.user,
  };

  const waitingMap: Record<ValidationActor, boolean> = (() => {
    if (assignment.action === FormAction.ASSIGN) {
      return {
        it: false,
        manager: !v.it,
        user: !(v.it && v.manager),
      };
    } else {
      // RETURN order: IT -> USER -> MANAGER
      return {
        it: false,
        user: !v.it,
        manager: !(v.it && v.user),
      } as Record<ValidationActor, boolean>;
    }
  })();

  const tooltipMap: Partial<Record<ValidationActor, string>> = (() => {
    const base: Partial<Record<ValidationActor, string>> = {
      it: !v.it && currentUser.role !== UserRole.ADMIN ? 'Action réservée à l’Admin IT' : undefined,
    };
    if (assignment.action === FormAction.ASSIGN) {
      return {
        ...base,
        manager: !v.manager && !(manager.canAct || canAdminTriggerManager) ? 'En attente de la validation IT' : undefined,
        user: !v.user && !(v.it && v.manager) ? 'En attente de l’étape précédente' : undefined,
      };
    } else {
      return {
        ...base,
        user: !v.user && !canAdminTriggerUser ? 'En attente de la validation IT' : undefined,
        manager: !v.manager && !(v.it && v.user) ? 'En attente de l’étape précédente' : undefined,
      };
    }
  })();

  return (
    <div className="w-full overflow-x-auto">
      <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {order.map((actor) => {
          const meta = roleMeta[actor];
          const isDone = Boolean(v[actor]);
          const isCurrent = !isDone && canActMap[actor] && !waitingMap[actor];
          const disabled = !canActMap[actor] || waitingMap[actor];
          const validatorId = vb[actor];
          const validatorName = validatorId ? (userMap.get(validatorId)?.name) : undefined;
          const validatedAtIso = va[actor];
          const dateLabel = validatedAtIso ? new Date(validatedAtIso).toLocaleDateString() : undefined;

          const baseContainer = 'flex items-center justify-between rounded-lg border p-3 md:p-4 transition-colors';
          const stateClasses = isDone
            ? 'bg-status-success-50/50 dark:bg-status-success-900/20 border-status-success-200 dark:border-status-success-700'
            : isCurrent
            ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
            : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700';
          const containerClasses = `${baseContainer} ${stateClasses}`;

          const content = (
            <>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDone ? 'bg-status-success-100 dark:bg-status-success-900/20' : isCurrent ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                  <span className={`material-symbols-outlined ${isDone ? 'text-status-success-600 dark:text-status-success-400' : isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{isDone ? 'check_circle' : meta.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{meta.label}</p>
                    {meta.badge && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{meta.badge}</span>
                    )}
                    {isDone && validatorId && userMap.get(validatorId)?.avatarUrl && (
                      <img
                        alt={userMap.get(validatorId)?.name || ''}
                        src={userMap.get(validatorId)!.avatarUrl}
                        className="ml-1 h-4 w-4 rounded-full object-cover"
                      />
                    )}
                  </div>
                  <p className={`text-xs font-medium ${isDone ? 'text-status-success-700 dark:text-status-success-400' : isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isDone
                      ? (validatorName ? `Validé par ${validatorName}${dateLabel ? ` le ${dateLabel}` : ''}` : 'Validé')
                      : waitingMap[actor]
                        ? 'En attente'
                        : canActMap[actor]
                          ? 'Action requise'
                          : 'En attente'}
                  </p>
                </div>
              </div>
            </>
          );

          const element = canActMap[actor] && !disabled ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => onActorClick(actor)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onActorClick(actor);
                }
              }}
              className={`${containerClasses} cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              {content}
            </div>
          ) : (
            <div className={containerClasses}>{content}</div>
          );

          return (
            <li key={actor}>
              {tooltipMap[actor] ? (
                <div className="group relative">
                  {element}
                  <div className="absolute hidden md:block left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap rounded-md bg-gray-800 px-3 py-1.5 text-center text-xs font-semibold text-white group-hover:block z-40">
                    {tooltipMap[actor]}
                  </div>
                </div>
              ) : (
                element
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default ValidationStepper;
