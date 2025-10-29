



import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { Assignment, Equipment, User, Model, Category, AuditLogEntry, AuditAction, EditHistoryEntry, ChangeDetail, EntityType } from '../types';
import { FormAction, UserRole, EquipmentStatus, AssignmentStatus } from '../types';
import { DashboardSkeleton } from './skeletons';
import PageHeader, { PageHeaderActions, ListItemCard } from './PageHeader';
import Tooltip from './Tooltip';

interface DashboardProps {
  currentUser: User;
  assignments: Assignment[];
  equipment: Equipment[];
  users: User[];
  models: Model[];
  categories: Category[];
  auditLog: AuditLogEntry[];
  editHistory: EditHistoryEntry[];
  onAddEquipment: () => void;
  onShowPendingApprovals: () => void;
  isLoading: boolean;
  onOpenSettings: () => void;
}

// Widget Configuration Types
interface WidgetDefinition {
    component: React.ComponentType<any>;
    props: Record<string, any>;
    roles: UserRole[];
    className: string;
}

interface WidgetConfig {
    id: string;
    visible: boolean;
}


const WidgetCard: React.FC<{ title: string; subtitle?: React.ReactNode; children: React.ReactNode; className?: string; onShowMore?: () => void; }> = ({ title, subtitle, children, className = '', onShowMore }) => (
    <div className={`surface-card surface-card-gradient flex flex-col h-full p-5 ${className}`}>
        <div className="flex justify-between items-start mb-4 flex-shrink-0">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                    {title}
                </h2>
                {subtitle && <p className="text-sm text-secondary-500 dark:text-secondary-300">{subtitle}</p>}
            </div>
            {onShowMore && (
                <button
                    type="button"
                    onClick={onShowMore}
                    aria-label="Voir plus"
                    className="inline-flex items-center justify-center size-9 rounded-full text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                </button>
            )}
        </div>
        <div className="flex-grow overflow-hidden">
            {children}
        </div>
    </div>
);

const PendingApprovalsCard: React.FC<{ count: number, onClick: () => void }> = ({ count, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="group relative w-full overflow-hidden text-left surface-card surface-card-gradient p-4 transition-all hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5"
    >
        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-primary-400 to-status-warning-400" />
        <div className="ml-4 flex items-center gap-4">
            <div className="flex shrink-0 items-center justify-center size-12 rounded-full bg-status-warning-200/80 dark:bg-status-warning-900/50 backdrop-blur">
                <span className="material-symbols-outlined text-3xl text-status-warning-800 dark:text-status-warning-300">pending_actions</span>
            </div>
            <div className="flex-1">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Approbations en attente</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-300">{count} article(s) requiert/requièrent votre attention.</p>
            </div>
            <span className="material-symbols-outlined text-secondary-500 dark:text-secondary-200 transition-transform group-hover:translate-x-1">chevron_right</span>
        </div>
    </button>
);

const AdminStats: React.FC<{ equipment: Equipment[]; }> = ({ equipment }) => {
    const assignedCount = equipment.filter(e => e.status === EquipmentStatus.ASSIGNED).length;
    const availableCount = equipment.filter(e => e.status === EquipmentStatus.AVAILABLE).length;
    const repairCount = equipment.filter(e => e.status === EquipmentStatus.IN_REPAIR).length;
    const pendingValidationCount = equipment.filter(e => e.status === EquipmentStatus.PENDING_VALIDATION).length;

    return (
        <WidgetCard title="Statut des équipements">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-transparent p-3 text-center">
                    <p className="text-secondary-600 dark:text-secondary-200 text-sm font-medium leading-normal">Attribué</p>
                    <p className="text-gray-900 dark:text-gray-100 text-3xl font-semibold">{assignedCount}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-transparent p-3 text-center">
                    <p className="text-secondary-600 dark:text-secondary-200 text-sm font-medium leading-normal">Disponible</p>
                    <p className="text-gray-900 dark:text-gray-100 text-3xl font-semibold">{availableCount}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-transparent p-3 text-center">
                    <p className="text-secondary-600 dark:text-secondary-200 text-sm font-medium leading-normal">En attente</p>
                    <p className="text-gray-900 dark:text-gray-100 text-3xl font-semibold">{pendingValidationCount}</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-transparent p-3 text-center">
                    <p className="text-secondary-600 dark:text-secondary-200 text-sm font-medium leading-normal">En réparation</p>
                    <p className="text-gray-900 dark:text-gray-100 text-3xl font-semibold">{repairCount}</p>
                </div>
            </div>
        </WidgetCard>
    );
};

type ChartType = 'bar' | 'donut' | 'list';

interface CategoryChartWidgetProps {
    equipment: Equipment[];
    models: Model[];
    categories: Category[];
    onCategoryClick: (categoryId: string) => void;
    onShowMore: () => void;
    chartType: ChartType;
    onChartTypeChange: () => void;
}

const CategoryChartWidget: React.FC<CategoryChartWidgetProps> = ({ equipment, models, categories, onCategoryClick, onShowMore, chartType, onChartTypeChange }) => {
    const { data, total } = useMemo(() => {
        const categoryCounts: {[key: string]: number} = {};
        const modelCategoryMap: Map<string, string> = new Map(models.map(m => [m.id, m.categoryId]));

        for(const item of equipment) {
            const categoryId = modelCategoryMap.get(item.modelId);
            if(categoryId) {
                categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
            }
        }
        const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
        
        const chartData = Object.entries(categoryCounts)
            .map(([categoryId, count]) => ({
                category: categories.find(c => c.id === categoryId),
                count,
                percentage: total > 0 ? (count / total) * 100 : 0
            }))
            .filter((item): item is { category: Category; count: number; percentage: number } => !!item.category)
            .sort((a,b) => b.count - a.count);
        
        const MAX_VISIBLE_CATEGORIES = 5;
        let finalData = chartData;

        if (chartData.length > MAX_VISIBLE_CATEGORIES) {
            const topCategories = chartData.slice(0, MAX_VISIBLE_CATEGORIES);
            const otherCategories = chartData.slice(MAX_VISIBLE_CATEGORIES);
            
            const otherCount = otherCategories.reduce((sum, item) => sum + item.count, 0);
            const otherPercentage = otherCategories.reduce((sum, item) => sum + item.percentage, 0);
            
            const otherCategory = {
                category: { id: 'other', name: 'Autres', icon: 'devices_other' },
                count: otherCount,
                percentage: otherPercentage
            };
            
            finalData = [...topCategories, otherCategory];
        }

        return { data: finalData, total };
    }, [equipment, models, categories]);

    const COLORS = ['#FFCA18', '#6366F1', '#10B981', '#F97316', '#EF4444', '#8B5CF6'];
    
    const getNextChartIcon = () => {
        if (chartType === 'bar') return 'donut_small';
        if (chartType === 'donut') return 'view_list';
        return 'bar_chart';
    };

    const renderBarChart = () => (
        <div className="space-y-3 pr-2 h-full overflow-y-auto">
            {data.map((item, i) => (
                <div
                    key={item.category.id}
                    onClick={() => item.category.id !== 'other' && onCategoryClick(item.category.id)}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && item.category.id !== 'other') onCategoryClick(item.category.id)}}
                    role="button"
                    tabIndex={item.category.id !== 'other' ? 0 : -1}
                    className={`w-full text-left group rounded-md p-1 ${item.category.id !== 'other' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
                    aria-label={`${item.category.name}: ${item.count} articles, ${item.percentage.toFixed(0)}%`}
                >
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{item.category.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">{item.count} ({item.percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                            className="h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${item.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderDonutChart = () => {
        const radius = 80;
        const strokeWidth = 25;
        const pathRadius = radius - strokeWidth; // This is the radius of the path for stroking.
        const circumference = 2 * Math.PI * pathRadius;
        let accumulatedPercentage = 0;

        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 200 200" className="transform -rotate-90">
                        <circle cx="100" cy="100" r={pathRadius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} className="dark:stroke-gray-700" />
                        {data.map((item, index) => {
                            const arcLength = (item.percentage / 100) * circumference;
                            const offset = (accumulatedPercentage / 100) * circumference;
                            accumulatedPercentage += item.percentage;
                            
                            return (
                                <circle
                                    key={item.category.id}
                                    cx="100"
                                    cy="100"
                                    r={pathRadius}
                                    fill="none"
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${arcLength} ${circumference}`}
                                    strokeDashoffset={-offset}
                                    className="transition-all duration-500 ease-out"
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">{total}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">articles</span>
                    </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 w-full px-4 text-sm">
                    {data.map((item, index) => (
                        <div key={item.category.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center min-w-0">
                                <span className="size-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span className="text-gray-700 dark:text-gray-300 truncate">{item.category.name}</span>
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">{item.count} ({item.percentage.toFixed(0)}%)</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderListView = () => (
        <div className="space-y-2 pr-2 h-full overflow-y-auto">
            {data.map((item, i) => (
                <div
                    key={item.category.id}
                    onClick={() => item.category.id !== 'other' && onCategoryClick(item.category.id)}
                    className={`flex justify-between items-center p-2 rounded-md ${item.category.id !== 'other' ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : 'cursor-default'}`}
                >
                    <div className="flex items-center">
                        <span className="size-2 rounded-full mr-3" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{item.category.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{item.count} ({item.percentage.toFixed(0)}%)</span>
                </div>
            ))}
        </div>
    );
    
    return (
        <WidgetCard title="Équipements par catégorie" subtitle={`(${total} articles)`} className="h-full" onShowMore={onShowMore}>
            {data.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400 h-full">Aucun équipement à afficher.</div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex-grow min-h-0 animate-fade-in" key={chartType}>
                        {chartType === 'bar' && renderBarChart()}
                        {chartType === 'donut' && renderDonutChart()}
                        {chartType === 'list' && renderListView()}
                    </div>
                    <div className="flex-shrink-0 pt-4">
                        <Tooltip content="Changer le type de graphique" align="right">
                           <button 
                                onClick={onChartTypeChange} 
                                className="flex items-center justify-center size-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                aria-label="Changer le type de graphique"
                            >
                               <span className="material-symbols-outlined !text-base">{getNextChartIcon()}</span>
                           </button>
                        </Tooltip>
                    </div>
                </div>
            )}
        </WidgetCard>
    );
};

const ExpiringWarranties: React.FC<{equipment: Equipment[], models: Model[], onSelectEquipment: (id: string) => void, onShowMore: () => void}> = ({ equipment, models, onSelectEquipment, onShowMore }) => {
    const expiringSoon = useMemo(() => {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        
        return equipment
            .filter(e => e.warrantyEndDate)
            .map(e => ({...e, warrantyEndDate: new Date(e.warrantyEndDate!)}))
            .filter(e => e.warrantyEndDate > now && e.warrantyEndDate <= thirtyDaysFromNow)
            .sort((a,b) => a.warrantyEndDate.getTime() - b.warrantyEndDate.getTime());

    }, [equipment]);

    const modelMap: Map<string, Model> = new Map(models.map(m => [m.id, m]));
    const now = new Date();
    
    return (
        <WidgetCard title="Garanties expirant bientôt" onShowMore={onShowMore}>
            {expiringSoon.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400 h-full">Aucune garantie n'expire bientôt.</div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-2 max-h-40">
                    {expiringSoon.map(item => {
                        const daysLeft = Math.ceil((item.warrantyEndDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                        const isUrgent = daysLeft <= 7;
                        return (
                            <button type="button" key={item.id} onClick={() => onSelectEquipment(item.id)} className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                               <div className={`flex items-center justify-center size-10 rounded-full ${isUrgent ? 'bg-status-danger-100 dark:bg-status-danger-900/50' : 'bg-status-warning-100 dark:bg-status-warning-900/50'}`}>
                                    <span className={`material-symbols-outlined ${isUrgent ? 'text-status-danger-700 dark:text-status-danger-400' : 'text-status-warning-700 dark:text-status-warning-400'}`}>shield</span>
                               </div>
                               <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{modelMap.get(item.modelId)?.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.assetTag}</p>
                               </div>
                               <div className={`text-sm font-semibold ${isUrgent ? 'text-status-danger-700 dark:text-status-danger-400' : 'text-status-warning-700 dark:text-status-warning-400'}`}>{daysLeft} jours</div>
                            </button>
                        )
                    })}
                </div>
            )}
        </WidgetCard>
    )
}

const InRepairAlerts: React.FC<{equipment: Equipment[], models: Model[], onSelectEquipment: (id: string) => void, onShowMore: () => void}> = ({ equipment, models, onSelectEquipment, onShowMore }) => {
    const inRepair = useMemo(() => {
        return equipment.filter(e => e.status === EquipmentStatus.IN_REPAIR);
    }, [equipment]);

    const modelMap: Map<string, Model> = new Map(models.map(m => [m.id, m]));
    
    return (
        <WidgetCard title="Articles en réparation" subtitle={`(${inRepair.length} articles)`} onShowMore={onShowMore}>
             {inRepair.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400 h-full">Aucun article en réparation.</div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-2 max-h-40">
                    {inRepair.map(item => (
                        <button type="button" key={item.id} onClick={() => onSelectEquipment(item.id)} className="w-full text-left flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                            <div className="flex items-center justify-center size-10 rounded-full bg-status-warning-100 dark:bg-status-warning-900/50">
                                <span className="material-symbols-outlined text-status-warning-700 dark:text-status-warning-400">build</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{modelMap.get(item.modelId)?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.assetTag}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </WidgetCard>
    );
};


const ManagerTeamView: React.FC<{
  teamMembers: User[];
  assignments: Assignment[];
  equipment: Equipment[];
  models: Model[];
  categories: Category[];
  onSelectUser: (userId: string) => void;
  onShowMore: () => void;
}> = ({ teamMembers, assignments, equipment, models, categories, onSelectUser, onShowMore }) => {
    
    const equipmentMap: Map<string, Equipment> = new Map(equipment.map(e => [e.id, e]));
    const modelMap: Map<string, Model> = new Map(models.map(m => [m.id, m]));
    const categoryMap: Map<string, Category> = new Map(categories.map(c => [c.id, c]));

    const getMemberEquipment = (userId: string) => {
        const latestAssignments = new Map<string, Assignment>();
        for (const assignment of assignments) {
            if (assignment.userId !== userId) continue;
            const existing = latestAssignments.get(assignment.equipmentId);
            if (!existing || new Date(assignment.date) > new Date(existing.date)) {
                latestAssignments.set(assignment.equipmentId, assignment);
            }
        }

        return Array.from(latestAssignments.values())
            .filter(a => a.action === FormAction.ASSIGN && a.status === AssignmentStatus.APPROVED)
            .map(a => equipmentMap.get(a.equipmentId))
            .filter((e): e is Equipment => e !== undefined);
    };

    return (
        <WidgetCard title="Mon équipe" onShowMore={onShowMore}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembers.map((member: User) => {
                    const memberEquipment = getMemberEquipment(member.id);
                    return (
                        <button type="button" key={member.id} onClick={() => onSelectUser(member.id)} className="w-full text-left bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 cursor-pointer hover:ring-2 hover:ring-primary-300 dark:hover:ring-primary-500 transition-all border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4 mb-3">
                                <img src={member.avatarUrl} alt={member.name} className="size-12 rounded-full" />
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800 dark:text-gray-100">{member.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.department}</p>
                                </div>
                            </div>
                             <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Équipement attribué</h4>
                                {memberEquipment.length > 0 ? (
                                    <ul className="space-y-2">
                                        {memberEquipment.map(item => {
                                            const model: Model | undefined = modelMap.get(item.modelId);
                                            const category: Category | undefined | null = model ? categoryMap.get(model.categoryId) : null;
                                            return (
                                                <li key={item.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <span className="material-symbols-outlined text-base text-gray-400 dark:text-gray-500">{category?.icon || 'devices'}</span>
                                                    <span>{model?.name || item.assetTag}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucun équipement attribué.</p>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </WidgetCard>
    )
}

const RecentActivity: React.FC<{
    currentUser: User;
    assignments: Assignment[];
    auditLog: AuditLogEntry[];
    users: User[];
    equipment: Equipment[];
    models: Model[];
    categories: Category[];
    onShowMore: () => void;
}> = ({ currentUser, assignments, auditLog, users, equipment, models, categories, onShowMore }) => {

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const userMapByName = useMemo(() => new Map(users.map(u => [u.name, u])), [users]);
    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);
    const modelMap = useMemo(() => new Map(models.map(m => [m.id, m])), [models]);
    
    const combinedActivity = useMemo(() => {
        const assignmentActivities = assignments.map(a => {
            const actor = users.find(u => u.role === UserRole.ADMIN);
            const targetUser = userMap.get(a.userId);
            const equipmentItem = equipmentMap.get(a.equipmentId);
            const model = equipmentItem ? modelMap.get(equipmentItem.modelId) : null;
            
            return {
                id: `assign-${a.id}`,
                date: new Date(a.date),
                actor: actor,
                type: a.action === FormAction.ASSIGN ? 'ASSIGN' : 'RETURN',
                targetUser: targetUser,
                targetName: model?.name || 'équipement',
                targetId: equipmentItem?.id,
                targetType: 'equipment' as EntityType,
            };
        });

        const auditActivities = auditLog.map(log => {
            const actor = userMapByName.get(log.user);
            let targetId: string | null = null;
            let targetUser: User | undefined;
            
            if (log.entityType === 'equipment') {
                const foundEquipment = equipment.find(e => e.assetTag && log.entityName.includes(e.assetTag));

                if (foundEquipment) {
                    targetId = foundEquipment.id;
                    const latestAssignment = assignments
                        .filter(a => a.equipmentId === foundEquipment.id && a.action === FormAction.ASSIGN && a.status === AssignmentStatus.APPROVED)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    if (latestAssignment) {
                        targetUser = userMap.get(latestAssignment.userId);
                    }
                }
            } else if (log.entityType === 'user') {
                 const foundUser = users.find(u => u.name === log.entityName);
                 if(foundUser) {
                     targetId = foundUser.id;
                     targetUser = foundUser;
                 }
            } else if (log.entityType === 'category') {
                const foundCategory = categories.find(c => c.name === log.entityName);
                if (foundCategory) {
                    targetId = foundCategory.id;
                }
            } else if (log.entityType === 'model') {
                const foundModel = models.find(m => m.name === log.entityName);
                if (foundModel) {
                    targetId = foundModel.id;
                }
            }

            return {
                id: `audit-${log.id}`,
                date: new Date(log.timestamp),
                actor: actor,
                type: log.action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
                targetUser,
                targetName: log.entityName,
                targetId: targetId,
                targetType: log.entityType,
            };
        });
        
        const allActivities = [...assignmentActivities, ...auditActivities];
        
        const filtered = allActivities.filter(activity => {
            if (!activity.actor) return false;
            if (currentUser.role === UserRole.ADMIN) return true;
            if (currentUser.role === UserRole.MANAGER) {
                const isTeamMember = activity.targetUser?.managerId === currentUser.id;
                return activity.actor.id === currentUser.id || isTeamMember || (activity.targetType !== 'equipment' && activity.targetType !== 'user');
            }
            if (currentUser.role === UserRole.EMPLOYEE) {
                return activity.targetUser?.id === currentUser.id;
            }
            return false;
        });

        return filtered
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 4);

    }, [assignments, auditLog, users, equipment, models, currentUser, userMap, userMapByName, equipmentMap, modelMap, categories]);

    const handleActivityClick = (activity: any) => {
        if (!activity.targetId) return;

        let path = '';
        switch (activity.targetType) {
            case 'equipment':
                path = `#/equipment/${activity.targetId}`;
                break;
            case 'user':
                path = `#/users/${activity.targetId}`;
                break;
            case 'category':
                path = `#/categories/${activity.targetId}`;
                break;
            case 'model':
                path = `#/models/${activity.targetId}`;
                break;
            default:
                return;
        }
        window.location.hash = path;
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'ASSIGN': return { icon: 'person_add', color: 'primary', isPrimary: true };
            case 'RETURN': return { icon: 'undo', color: 'action', isPrimary: false };
            case 'CREATE': return { icon: 'add_circle', color: 'success', isPrimary: false };
            case 'UPDATE': return { icon: 'edit', color: 'info', isPrimary: false };
            case 'DELETE': return { icon: 'delete', color: 'danger', isPrimary: false };
            default: return { icon: 'info', color: 'gray', isPrimary: false };
        }
    };
    
    const renderActivityText = (activity: any) => {
        const isCurrentUserActor = currentUser.id === activity.actor.id;
        const actorName = isCurrentUserActor ? 'Vous' : activity.actor.name;
        const actorText = <span className="font-bold">{actorName}</span>;
        const verb = isCurrentUserActor ? 'avez' : 'a';
        const targetName = <span className="font-bold">{activity.targetName}</span>;

        switch (activity.type) {
            case 'ASSIGN':
                const targetUserName = activity.targetUser ? activity.targetUser.name : 'un utilisateur';
                const targetUserText = <span className="font-bold">{targetUserName}</span>;
                return <>{actorText} {verb} attribué {targetName} à {targetUserText}.</>;
            case 'RETURN':
                const returningUserName = activity.targetUser ? activity.targetUser.name : 'un utilisateur';
                const returningUserText = <span className="font-bold">{returningUserName}</span>;
                return <>{actorText} {verb} enregistré le retour de {targetName} par {returningUserText}.</>;
            case 'CREATE':
                return <>{actorText} {verb} créé {activity.targetType} {targetName}.</>;
            case 'UPDATE':
                return <>{actorText} {verb} mis à jour {activity.targetType} {targetName}.</>;
            case 'DELETE':
                return <>{actorText} {verb} supprimé {activity.targetType} {targetName}.</>;
            default:
                return 'Activité inconnue.';
        }
    };


    return (
        <WidgetCard title="Activité récente" onShowMore={onShowMore}>
            <div className="relative pl-4 pt-2">
                <div className="absolute left-8 top-5 bottom-5 w-1 rounded-full bg-gradient-to-b from-primary-200/50 via-secondary-200/30 to-transparent dark:from-primary-500/30 dark:via-secondary-500/20 dark:to-transparent" />
                <ul className="space-y-3">
                    {combinedActivity.length > 0 ? combinedActivity.map((activity) => {
                        const { icon, color, isPrimary } = getActivityIcon(activity.type);
                        let bgColor, iconColor;
                        if (color === 'gray') {
                            bgColor = 'bg-gray-100 dark:bg-gray-700';
                            iconColor = 'text-gray-500 dark:text-gray-400';
                        } else if (isPrimary) {
                            bgColor = 'bg-primary-100 dark:bg-primary-900/50';
                            iconColor = 'text-primary-600 dark:text-primary-400';
                        } else {
                            bgColor = `bg-status-${color}-100 dark:bg-status-${color}-900/50`;
                            iconColor = `text-status-${color}-600 dark:text-status-${color}-400`;
                        }

                        return (
                            <li key={activity.id}>
                                <button
                                    type="button"
                                    onClick={() => handleActivityClick(activity)}
                                    disabled={!activity.targetId}
                                    className="group w-full text-left relative flex items-start gap-4 p-3 -m-2 rounded-xl transition-all duration-300 ease-[var(--ease-fluid)] hover:bg-white/60 dark:hover:bg-gray-800/60 hover:backdrop-blur-sm hover:shadow-[var(--shadow-elev-1)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent disabled:hover:transform-none"
                                    aria-label={`Voir les détails de: ${activity.targetName}`}
                                >
                                    <div className="absolute left-2 top-3 flex items-center">
                                        <div className="relative">
                                            <img src={activity.actor.avatarUrl} alt={activity.actor.name} className="size-10 rounded-full ring-4 ring-white dark:ring-gray-800 shadow-[var(--shadow-elev-1)] transition-transform duration-300 group-hover:scale-105" />
                                            <div className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center size-6 rounded-full ${bgColor} ring-2 ring-white dark:ring-gray-800 shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                                                <span className={`material-symbols-outlined !text-sm ${iconColor}`}>{icon}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-14 pt-1 min-h-[4rem] flex-1">
                                        <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                                            {renderActivityText(activity)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="material-symbols-outlined !text-xs text-gray-400 dark:text-gray-500">schedule</span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(activity.date).toLocaleString('fr-FR', { 
                                                    day: 'numeric', 
                                                    month: 'short', 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        );
                    }) : (
                        <li className="relative flex items-start gap-4 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center justify-center size-12 rounded-full bg-gray-100 dark:bg-gray-700">
                                <span className="material-symbols-outlined text-2xl text-gray-400 dark:text-gray-500">inbox</span>
                            </div>
                            <div className="flex-1 pt-2">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aucune activité récente</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Les événements apparaîtront ici</p>
                            </div>
                        </li>
                    )}
                </ul>
            </div>
        </WidgetCard>
    );
};

const QuickActions: React.FC<{ onAssign: () => void; onReturn: () => void; }> = ({ onAssign, onReturn }) => (
    <WidgetCard title="Actions rapides">
        <div className="grid grid-cols-2 gap-4">
            <button onClick={onAssign} className="flex flex-col items-center justify-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 transition-colors hover:bg-primary-50 dark:hover:bg-primary-500/10">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300">
                    <span className="material-symbols-outlined text-3xl">person_add</span>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Attribuer</p>
            </button>
            <button onClick={onReturn} className="flex flex-col items-center justify-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 p-4 transition-colors hover:bg-status-action-50 dark:hover:bg-status-action-500/10">
                <div className="flex size-12 items-center justify-center rounded-full bg-status-action-100 dark:bg-status-action-900/50 text-status-action-700 dark:text-status-action-300">
                    <span className="material-symbols-outlined text-3xl">undo</span>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Retourner</p>
            </button>
        </div>
    </WidgetCard>
);

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { currentUser, assignments, equipment, users, models, categories, auditLog, onShowPendingApprovals, isLoading, onOpenSettings } = props;
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [widgetConfig, setWidgetConfig] = useState<WidgetConfig[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const touchDragIdRef = useRef<string | null>(null);
    const touchOverIdRef = useRef<string | null>(null);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const headerMenuRef = useRef<HTMLDivElement>(null);
    const [categoryChartType, setCategoryChartType] = useState<ChartType>('bar');
    const savedConfigRef = useRef<WidgetConfig[] | null>(null);
    const dashboardConfigLoadKeyRef = useRef<string | null>(null);
    const touchPreviewRef = useRef<HTMLDivElement | null>(null);
    const touchScrollIntervalRef = useRef<number | null>(null);
    const bodyOverflowRef = useRef<string>('');


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
                setIsHeaderMenuOpen(false);
            }
        };
        if (isHeaderMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isHeaderMenuOpen]);

    const closeMenu = useCallback(() => setIsHeaderMenuOpen(false), []);

    const saveConfig = useCallback((newConfig: WidgetConfig[]) => {
        setWidgetConfig(newConfig);
        localStorage.setItem(`dashboardConfig_${currentUser.id}`, JSON.stringify(newConfig));
        savedConfigRef.current = newConfig;
    }, [currentUser.id]);

    const handleEnterEditMode = useCallback(() => {
        savedConfigRef.current = widgetConfig;
        setIsEditMode(true);
        setDraggingId(null);
        setDragOverId(null);
        closeMenu();
    }, [widgetConfig, closeMenu]);

    const handleCancelEdit = useCallback(() => {
        if (savedConfigRef.current && savedConfigRef.current.length > 0) {
            setWidgetConfig(savedConfigRef.current);
        }
        setIsEditMode(false);
        setDraggingId(null);
        setDragOverId(null);
        closeMenu();
    }, [closeMenu]);

    const handleSaveEdit = useCallback(() => {
        // Sauvegarder la configuration dans localStorage (saveConfig met aussi à jour savedConfigRef)
        saveConfig(widgetConfig);
        setIsEditMode(false);
        setDraggingId(null);
        setDragOverId(null);
        closeMenu();
    }, [widgetConfig, saveConfig, closeMenu]);
    
    useEffect(() => {
        const savedType = localStorage.getItem(`categoryChartType_${currentUser.id}`);
        if (savedType === 'bar' || savedType === 'donut' || savedType === 'list') {
            setCategoryChartType(savedType as ChartType);
        }
    }, [currentUser.id]);

    const handleCategoryChartTypeChange = useCallback(() => {
        const types: ChartType[] = ['bar', 'donut', 'list'];
        setCategoryChartType(prev => {
            const currentIndex = types.indexOf(prev);
            const nextType = types[(currentIndex + 1) % types.length];
            localStorage.setItem(`categoryChartType_${currentUser.id}`, nextType);
            return nextType;
        });
    }, [currentUser.id]);

    const teamMembers = useMemo(() => {
        if (currentUser.role !== UserRole.MANAGER) return [];
        return users.filter(u => u.managerId === currentUser.id);
    }, [currentUser.role, users]);

    const pendingApprovalsCount = useMemo(() => {
        return assignments.filter(a => {
            const eq = equipment.find(e => e.id === a.equipmentId);
            if (eq?.status !== EquipmentStatus.PENDING_VALIDATION || a.status !== AssignmentStatus.PENDING || !a.validation) return false;
            if (a.action === FormAction.ASSIGN) {
                if (currentUser.id === a.managerId && !a.validation.manager) return true;
                if (currentUser.id === a.userId && a.validation.manager && !a.validation.user) return true;
            } else { // RETURN
                if (currentUser.id === a.userId && !a.validation.user) return true;
                if (currentUser.id === a.managerId && a.validation.user && !a.validation.manager) return true;
            }
            return false;
        }).length;
    }, [assignments, equipment, currentUser]);


    const allWidgets: WidgetDefinition[] = useMemo(() => [
        {
            component: AdminStats,
            props: { equipment },
            roles: [UserRole.ADMIN],
            className: 'col-span-1 md:col-span-2',
        },
        {
            component: QuickActions,
            props: { onAssign: () => window.location.hash = '#/assign', onReturn: () => window.location.hash = '#/return' },
            roles: [UserRole.ADMIN],
            className: 'col-span-1',
        },
        {
            component: CategoryChartWidget,
            props: { 
                equipment, 
                models, 
                categories, 
                onCategoryClick: (categoryId: string) => window.location.hash = `#/inventory?category=${categoryId}`,
                onShowMore: () => window.location.hash = '#/management',
                chartType: categoryChartType,
                onChartTypeChange: handleCategoryChartTypeChange,
            },
            roles: [UserRole.ADMIN, UserRole.MANAGER],
            className: 'col-span-1 md:col-span-2 lg:col-span-1',
        },
        {
            component: ExpiringWarranties,
            props: { 
                equipment, 
                models, 
                onSelectEquipment: (id: string) => window.location.hash = `#/equipment/${id}`,
                onShowMore: () => window.location.hash = '#/inventory'
            },
            roles: [UserRole.ADMIN, UserRole.MANAGER],
            className: 'col-span-1 md:col-span-2 lg:col-span-1',
        },
        {
            component: InRepairAlerts,
            props: { 
                equipment, 
                models, 
                onSelectEquipment: (id: string) => window.location.hash = `#/equipment/${id}`,
                onShowMore: () => window.location.hash = '#/inventory'
            },
            roles: [UserRole.ADMIN, UserRole.MANAGER],
            className: 'col-span-1 md:col-span-2 lg:col-span-1',
        },
        {
            component: ManagerTeamView,
            props: {
                teamMembers,
                assignments,
                equipment,
                models,
                categories,
                onSelectUser: (userId: string) => window.location.hash = `#/users/${userId}`,
                onShowMore: () => window.location.hash = '#/users',
            },
            roles: [UserRole.MANAGER],
            className: 'col-span-1 md:col-span-3',
        },
        {
            component: RecentActivity,
            props: {
                currentUser,
                assignments,
                auditLog,
                users,
                equipment,
                models,
                categories,
                onShowMore: () => {}, // No 'show more' for now. Could lead to a dedicated activity page.
            },
            roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE],
            className: 'col-span-1 md:col-span-3',
        }
    ], [equipment, models, categories, categoryChartType, handleCategoryChartTypeChange, teamMembers, assignments, currentUser, auditLog, users]);
    
    const getWidgetId = useCallback((widget: WidgetDefinition) => {
        // This creates a stable ID even if the order of allWidgets changes
        return widget.component.name;
    }, []);

    useEffect(() => {
        const storageKey = `dashboardConfig_${currentUser.id}`;
        let savedConfig: WidgetConfig[] | null = null;
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                savedConfig = JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to parse dashboard config:", e);
        }

        const roleWidgets = allWidgets.filter(w => w.roles.includes(currentUser.role));
        const roleWidgetIds = roleWidgets.map(getWidgetId);

        if (savedConfig && Array.isArray(savedConfig)) {
            // Filter out widgets from saved config that are no longer available or not for this role
            const validSavedConfig = savedConfig.filter(c => roleWidgetIds.includes(c.id));
            
            // Find new widgets for this role that are not in the saved config
            const newWidgets = roleWidgets.filter(w => !validSavedConfig.some(c => c.id === getWidgetId(w)));

            const finalConfig = [
                ...validSavedConfig,
                ...newWidgets.map(w => ({ id: getWidgetId(w), visible: true }))
            ];
            
            // Ensure the order reflects the saved order, but with new items at the end
            const orderedFinalConfig = [...finalConfig].sort((a, b) => {
                 const aIndex = savedConfig?.findIndex(c => c.id === a.id) ?? -1;
                 const bIndex = savedConfig?.findIndex(c => c.id === b.id) ?? -1;
                 if (aIndex === -1 && bIndex === -1) return 0; // both new
                 if (aIndex === -1) return 1; // a is new
                 if (bIndex === -1) return -1; // b is new
                 return aIndex - bIndex;
            });
            
            savedConfigRef.current = orderedFinalConfig;
            setWidgetConfig(orderedFinalConfig);

        } else {
            // Create default config if nothing is saved
            const defaultConfig = roleWidgets.map(w => ({ id: getWidgetId(w), visible: true }));
            savedConfigRef.current = defaultConfig;
            setWidgetConfig(defaultConfig);
        }
    }, [currentUser.id, currentUser.role, allWidgets, getWidgetId]);

    const orderedWidgets = useMemo(() => {
        return widgetConfig
            .map(config => {
                const widgetDef = allWidgets.find(w => getWidgetId(w) === config.id);
                if (!widgetDef) return null;
                return { config, widget: widgetDef };
            })
            .filter((item): item is { config: WidgetConfig; widget: WidgetDefinition } => item !== null);
    }, [widgetConfig, allWidgets, getWidgetId]);

    const visibleWidgets = useMemo(
        () => orderedWidgets.filter(({ config }) => config.visible),
        [orderedWidgets]
    );

    const widgetsToRender = isEditMode ? orderedWidgets : visibleWidgets;
    
    const toggleWidgetVisibility = (widgetId: string) => {
        const newConfig = widgetConfig.map(c => 
            c.id === widgetId ? { ...c, visible: !c.visible } : c
        );
        // Ne sauvegarder que temporairement dans l'état React
        // La sauvegarde persistante se fait seulement lors du clic sur "Sauvegarder"
        setWidgetConfig(newConfig);
    };

    const handleDragStart = (e: React.DragEvent<HTMLElement>, id: string) => {
        setDraggingId(id);
        setDragOverId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', id);
        
        // Make drag image semi-transparent
        if (e.dataTransfer.setDragImage && e.currentTarget) {
            const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
            dragImage.style.opacity = '0.5';
            e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
        }
    };

    const reorderWidgets = (dragId: string, dropId: string) => {
        if (!dragId || !dropId || dragId === dropId) {
            return;
        }

        const visibleIds = visibleWidgets.map(({ widget }) => getWidgetId(widget));
        const draggedIndex = visibleIds.indexOf(dragId);
        const dropIndex = visibleIds.indexOf(dropId);

        if (draggedIndex === -1 || dropIndex === -1) {
            return;
        }

        const newVisibleIds = [...visibleIds];
        const [removed] = newVisibleIds.splice(draggedIndex, 1);
        newVisibleIds.splice(dropIndex, 0, removed);

        const newConfig = [...widgetConfig].sort((a, b) => {
            const aIndex = newVisibleIds.indexOf(a.id);
            const bIndex = newVisibleIds.indexOf(b.id);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });

        // Ne sauvegarder que temporairement dans l'état React
        // La sauvegarde persistante se fait seulement lors du clic sur "Sauvegarder"
        setWidgetConfig(newConfig);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dropId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (dragOverId !== dropId) {
            setDragOverId(dropId);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropId: string) => {
        e.preventDefault();
        if (!draggingId) return;

        reorderWidgets(draggingId, dropId);
        setDraggingId(null);
        setDragOverId(null);
        
        // Vibration feedback on mobile
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    };

    type TouchLike = { clientX: number; clientY: number };

    const createTouchPreview = (source: HTMLElement) => {
        const rect = source.getBoundingClientRect();
        const preview = document.createElement('div');
        preview.className = 'pointer-events-none fixed inset-0 z-[60] flex items-center justify-center';
        const clone = source.cloneNode(true) as HTMLElement;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.opacity = '0.92';
        clone.style.boxShadow = '0 35px 60px -15px rgba(15, 23, 42, 0.45)';
        clone.style.borderRadius = '1rem';
        clone.style.overflow = 'hidden';
        clone.classList.add('bg-white', 'dark:bg-gray-800');
        clone.style.transform = 'scale(1.02)';
        clone.style.pointerEvents = 'none';

        const innerWrapper = document.createElement('div');
        innerWrapper.style.position = 'absolute';
        innerWrapper.style.left = `${rect.left}px`;
        innerWrapper.style.top = `${rect.top}px`;
        innerWrapper.style.width = `${rect.width}px`;
        innerWrapper.style.height = `${rect.height}px`;
        innerWrapper.style.transform = 'translate(-50%, -50%)';

        innerWrapper.appendChild(clone);
        preview.appendChild(innerWrapper);
        document.body.appendChild(preview);
        touchPreviewRef.current = preview;

        bodyOverflowRef.current = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return innerWrapper;
    };

    const updateTouchPreviewPosition = (touch: TouchLike) => {
        const container = touchPreviewRef.current;
        if (!container) return;
        const innerWrapper = container.firstElementChild as HTMLElement | null;
        if (!innerWrapper) return;
        innerWrapper.style.left = `${touch.clientX}px`;
        innerWrapper.style.top = `${touch.clientY}px`;
    };

    const startAutoscroll = (touch: TouchLike) => {
        const scrollContainer = document.scrollingElement || document.documentElement;
        const threshold = 80;
        const speed = 20;

        if (touchScrollIntervalRef.current) {
            window.clearInterval(touchScrollIntervalRef.current);
            touchScrollIntervalRef.current = null;
        }

        if (touch.clientY < threshold) {
            touchScrollIntervalRef.current = window.setInterval(() => {
                scrollContainer.scrollBy({ top: -speed, behavior: 'auto' });
            }, 16);
        } else if (window.innerHeight - touch.clientY < threshold) {
            touchScrollIntervalRef.current = window.setInterval(() => {
                scrollContainer.scrollBy({ top: speed, behavior: 'auto' });
            }, 16);
        }
    };

    const stopAutoscroll = () => {
        if (touchScrollIntervalRef.current) {
            window.clearInterval(touchScrollIntervalRef.current);
            touchScrollIntervalRef.current = null;
        }
    };

    const cleanupTouchDrag = () => {
        stopAutoscroll();
        if (touchPreviewRef.current) {
            touchPreviewRef.current.remove();
            touchPreviewRef.current = null;
        }
        document.body.style.overflow = bodyOverflowRef.current;
        bodyOverflowRef.current = '';
    };

    const handleTouchStartDrag = (id: string, widgetRoot: HTMLElement | null) => {
        touchDragIdRef.current = id;
        touchOverIdRef.current = id;
        setDraggingId(id);
        setDragOverId(id);
        
        // Vibration feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }

        if (widgetRoot) {
            const widgetContent = widgetRoot.querySelector('[data-widget-content]') as HTMLElement | null;
            if (widgetContent) {
                createTouchPreview(widgetContent);
            }
        }
    };

    const handleTouchMoveDrag = (e: React.TouchEvent<HTMLElement>) => {
        if (!touchDragIdRef.current) return;
        const touch = e.touches[0];
        if (!touch) return;

        const { clientX, clientY } = touch;
        updateTouchPreviewPosition({ clientX, clientY });
        startAutoscroll({ clientX, clientY });

        const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
        const container = element?.closest<HTMLElement>('[data-widget-id]');
        if (container?.dataset.widgetId) {
            const newOverId = container.dataset.widgetId;
            if (touchOverIdRef.current !== newOverId) {
                touchOverIdRef.current = newOverId;
                setDragOverId(newOverId);
                
                // Light vibration on hover change
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            }
        }
    };

    const handleTouchEndDrag = () => {
        cleanupTouchDrag();
        const dragId = touchDragIdRef.current;
        const dropId = touchOverIdRef.current;
        if (dragId && dropId) {
            reorderWidgets(dragId, dropId);
            
            // Confirmation vibration
            if ('vibrate' in navigator) {
                navigator.vibrate([30, 20, 30]);
            }
        }

        touchDragIdRef.current = null;
        touchOverIdRef.current = null;
        setDraggingId(null);
        setDragOverId(null);
    };

    useEffect(() => () => {
        cleanupTouchDrag();
    }, []);
    
     const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverId(null);
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }
    
    const standardHeaderActions = [
        { label: 'Réorganiser', icon: 'edit', onClick: () => handleEnterEditMode() },
        { label: 'Paramètres', icon: 'settings', onClick: onOpenSettings },
    ];

    const editModeHeaderActions = [
        { label: 'Annuler', icon: 'close', onClick: () => handleCancelEdit() },
        { label: 'Sauvegarder', icon: 'check', onClick: () => handleSaveEdit() },
    ];

    const pageHeaderActions = isEditMode ? editModeHeaderActions : standardHeaderActions;
    
    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            <PageHeader 
                title="Tableau de bord" 
                subtitle={`Bienvenue, ${currentUser.name}`}
            >
                <PageHeaderActions actions={pageHeaderActions} />
            </PageHeader>
            <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 md:p-6 space-y-6">
                {isEditMode && (
                    <div className="surface-card surface-card-gradient rounded-2xl p-4 border-l-4 border-primary-500 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 rounded-full bg-primary-100 dark:bg-primary-900/40">
                                <span className="material-symbols-outlined text-primary-600 dark:text-primary-300">info</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">Mode réorganisation</p>
                                <p className="text-sm text-secondary-600 dark:text-secondary-400">Glissez-déposez les widgets pour les réorganiser. Cliquez sur l'icône œil pour les masquer/afficher.</p>
                            </div>
                        </div>
                    </div>
                )}
                {pendingApprovalsCount > 0 && <PendingApprovalsCard count={pendingApprovalsCount} onClick={onShowPendingApprovals} />}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {widgetsToRender.map(({ config, widget }) => {
                        const WidgetComponent = widget.component;
                        const widgetId = getWidgetId(widget);
                        const isVisible = config.visible;
                        return (
                            <div
                                key={widgetId}
                                draggable={isEditMode && config.visible}
                                onDragStart={(e) => handleDragStart(e, widgetId)}
                                onDragOver={(e) => handleDragOver(e, widgetId)}
                                onDrop={(e) => handleDrop(e, widgetId)}
                                onDragEnd={handleDragEnd}
                                data-widget-id={widgetId}
                                className={`${widget.className} transition-all duration-300 ${
                                    isEditMode ? 'relative rounded-xl p-1 touch-none cursor-grab' : ''
                                } ${
                                    draggingId === widgetId ? 'opacity-30 scale-95 cursor-grabbing' : ''
                                } ${
                                    dragOverId === widgetId && draggingId !== widgetId && isEditMode 
                                        ? 'ring-4 ring-primary-400 ring-opacity-50 scale-105 shadow-2xl' 
                                        : ''
                                }`}
                            >
                                {isEditMode && (
                                    <div className={`pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed transition-all duration-300 ${
                                        dragOverId === widgetId && draggingId !== widgetId
                                            ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-900/20'
                                            : 'border-primary-400'
                                    }`}>
                                        {dragOverId === widgetId && draggingId !== widgetId && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                                                    Déposer ici
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={`${isEditMode ? 'relative rounded-xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden' : ''}`} data-widget-content>
                                    {isEditMode && (
                                        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-2 bg-gray-100/90 dark:bg-gray-800/80 backdrop-blur-sm z-10">
                                            <button
                                                type="button"
                                                draggable={isEditMode && isVisible}
                                                onDragStart={(e) => {
                                                    e.stopPropagation();
                                                    handleDragStart(e, widgetId);
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    handleTouchStartDrag(widgetId, e.currentTarget.closest('[data-widget-id]'));
                                                }}
                                                onTouchMove={(e) => {
                                                    e.stopPropagation();
                                                    handleTouchMoveDrag(e);
                                                }}
                                                onTouchEnd={(e) => {
                                                    e.stopPropagation();
                                                    handleTouchEndDrag();
                                                }}
                                                onTouchCancel={() => handleTouchEndDrag()}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-all hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing"
                                                aria-label="Déplacer ce widget"
                                            >
                                                <span className="material-symbols-outlined text-lg leading-none">drag_indicator</span>
                                                <span className="text-xs font-semibold">Déplacer</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleWidgetVisibility(config.id)}
                                                className={`flex items-center justify-center size-8 rounded-full transition-colors ${isVisible ? 'bg-gray-100 text-gray-700 hover:bg-gray-200/90 dark:bg-gray-700/70 dark:text-gray-100 dark:hover:bg-gray-600/70' : 'bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-200 dark:hover:bg-primary-800/40'}`}
                                                aria-label={isVisible ? 'Masquer ce widget' : 'Afficher ce widget'}
                                            >
                                                <span className="material-symbols-outlined text-base leading-none">{isVisible ? 'visibility' : 'visibility_off'}</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className={isEditMode ? 'pt-12' : ''}>
                                        <WidgetComponent {...widget.props} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
