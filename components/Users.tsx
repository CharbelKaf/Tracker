import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { UsersSkeleton } from './skeletons';
import PageHeader, { SelectionHeader, ListItemCard, FloatingActionButton, PageHeaderActions } from './PageHeader';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from '../contexts/ToastContext';
import SmartSearchInput from './SmartSearchInput';
import { ConfirmationModal } from './Modals';
import { useFocusTrap } from './hooks/useFocusTrap';
import RoleBadge from './RoleBadge';
import DropdownMenu, { type DropdownMenuAction } from './DropdownMenu';
import FilterToolbar, { type FilterDefinition } from './FilterToolbar';
import Button from './ui/Button';

interface UsersProps {
    users: User[];
    onAdd: () => void;
    isLoading: boolean;
    canAdd: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    currentUser: User;
    selectedIds: Set<string>;
    onSelectedIdsChange: (ids: Set<string>) => void;
    onBulkDelete: (ids: string[]) => void;
}

const Highlight: React.FC<{text: string, highlight: string}> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-primary-200/70 dark:bg-primary-500/30 rounded-sm px-0.5">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};


const Users: React.FC<UsersProps> = ({ users, onAdd, isLoading, canAdd, onEdit, onDelete, currentUser, selectedIds, onSelectedIdsChange, onBulkDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [smartFilters, setSmartFilters] = useState<Record<string, any> | null>(null);
    const [isClearingSmartFilters, setIsClearingSmartFilters] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const { addToast } = useToast();
    const [popoverTargetId, setPopoverTargetId] = useState<string | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('bottom');
    const popoverRef = useRef<HTMLDivElement>(null);
    const [actionSheetUser, setActionSheetUser] = useState<User | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ ids: string[], isBulk: boolean } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const ITEM_HEIGHT = 88;
    const OVERSCAN_COUNT = 5;

    const selectionModeActive = selectedIds.size > 0;

    useFocusTrap(popoverRef, !!popoverTargetId);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPopoverTargetId(null);
            }
        };
        if (popoverTargetId) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [popoverTargetId]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPopoverTargetId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popoverRef]);
    
    useLayoutEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.offsetHeight);
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const handlePopoverOpen = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();

        if (popoverTargetId === userId) {
            setPopoverTargetId(null);
            return;
        }
        
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const popoverHeight = 100;

        const spaceBelow = window.innerHeight - rect.bottom;

        if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
            setPopoverPosition('top');
        } else {
            setPopoverPosition('bottom');
        }
        
        setPopoverTargetId(userId);
    };
    
    const handleMobileActionsOpen = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        const user = filteredUsers.find(u => u.id === userId);
        if (user) {
            setActionSheetUser(user);
        }
    };

    const departments = useMemo(() => Array.from(new Set(users.map(u => u.department).filter((d): d is string => !!d))).sort(), [users]);
    const roles = Object.values(UserRole);

    // FilterToolbar configuration
    const usersFilterDefs: FilterDefinition[] = useMemo(() => ([
        { id: 'departmentFilter', label: 'Département', type: 'select', options: departments.map(d => ({ label: d, value: d })) },
        { id: 'roleFilter', label: 'Rôle', type: 'select', options: roles.map(r => ({ label: r, value: r })) },
    ]), [departments, roles]);

    const usersFilters = useMemo(() => ({
        departmentFilter,
        roleFilter,
    }), [departmentFilter, roleFilter]);

    const hasActiveFilters = useMemo(() => (
        departmentFilter !== 'all' || roleFilter !== 'all'
    ), [departmentFilter, roleFilter]);

    const setUsersFilters = (next: Record<string, any>) => {
        setDepartmentFilter(next.departmentFilter ?? 'all');
        setRoleFilter(next.roleFilter ?? 'all');
        handleManualFilterChange();
    };

    const sortedUsers = useMemo(() => 
        [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users]);

    const filteredUsers = useMemo(() => sortedUsers.filter(user => {
        const lowerCaseTerm = searchTerm.toLowerCase();
        const matchesSearchTerm = searchTerm === '' ||
            user.name.toLowerCase().includes(lowerCaseTerm) ||
            user.department?.toLowerCase().includes(lowerCaseTerm);
        
        const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearchTerm && matchesDepartment && matchesRole;
    }), [sortedUsers, searchTerm, departmentFilter, roleFilter]);
    
     const { startIndex, visibleItems } = useMemo(() => {
        const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN_COUNT);
        const itemsToShow = containerHeight > 0 ? Math.ceil(containerHeight / ITEM_HEIGHT) + (2 * OVERSCAN_COUNT) : 20;
        const endIndex = Math.min(filteredUsers.length, startIndex + itemsToShow);

        return {
            startIndex,
            visibleItems: filteredUsers.slice(startIndex, endIndex),
        };
    }, [scrollTop, containerHeight, filteredUsers]);
    
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        onSelectedIdsChange(newSet);
    };

    const handleClearSmartFiltersClick = () => {
        setSmartFilters(null);
        setSearchTerm('');
        setDepartmentFilter('all');
        setRoleFilter('all');
    };
    
    const clearSmartFiltersWithAnimation = () => {
        if (smartFilters && !isClearingSmartFilters) {
            setIsClearingSmartFilters(true);
            setTimeout(() => {
                setSmartFilters(null);
                setIsClearingSmartFilters(false);
            }, 500);
        }
    };

    const handleManualFilterChange = () => {
        clearSmartFiltersWithAnimation();
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        clearSmartFiltersWithAnimation();
    };

    const handleNaturalLanguageSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setIsAiSearching(true);
        addToast('Gemini analyse votre recherche...', 'info');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const schema = {
                type: Type.OBJECT,
                properties: {
                    department: { type: Type.STRING, description: "Filter by user's department." },
                    role: { type: Type.STRING, description: "Filter by user's role." },
                    searchTerm: { type: Type.STRING, description: "General keywords for the user's name." }
                }
            };

            const prompt = `You are an expert search query parser for an IT asset management application. Your task is to translate the user's natural language query into a structured JSON object of filters for a list of users. Infer information when possible. For example, if the query is "all managers", you should infer the role is "${UserRole.MANAGER}".

            Here are the available filter options:
            - Departments: ${departments.join(', ')}
            - Roles: ${roles.join(', ')}

            Analyze the user's query: "${searchTerm}"

            Based on the query, populate the JSON schema. If a field is not mentioned and cannot be inferred, omit it. For 'searchTerm', include any keywords that look like a person's name.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });

            const parsedFilters = JSON.parse(response.text.trim());
            
            // Reset filters before applying new ones
            handleClearSmartFiltersClick();
            
            // Apply new filters
            setSmartFilters(parsedFilters);
            if (parsedFilters.searchTerm) setSearchTerm(parsedFilters.searchTerm);
            if (parsedFilters.department && departments.includes(parsedFilters.department)) {
                setDepartmentFilter(parsedFilters.department);
            }
            if (parsedFilters.role && roles.includes(parsedFilters.role as UserRole)) {
                setRoleFilter(parsedFilters.role);
            }
            
            addToast('Filtres intelligents appliqués !', 'success');

        } catch (error) {
            console.error("Error with Gemini user search:", error);
            addToast("Désolé, je n'ai pas pu traiter cette recherche.", 'error');
        } finally {
            setIsAiSearching(false);
        }
    };

    const userActions = canAdd ? [
        { label: 'Ajouter un utilisateur', icon: 'person_add', onClick: () => onAdd() },
        { label: 'Importer un CSV', icon: 'upload', onClick: () => window.location.hash = '#/users/import' },
        {
            label: 'Sélectionner',
            icon: 'check_circle',
            onClick: () => {
                if (filteredUsers.length > 0) {
                    toggleSelection(filteredUsers[0].id);
                }
            }
        },
    ] : [];

    const placeholderText = smartFilters
        ? "Filtres intelligents actifs. Tapez pour une nouvelle recherche."
        : "Chercher par nom ou demander à Gemini...";
        
    const actionSheetActions: DropdownMenuAction[] = useMemo(() => {
        if (!actionSheetUser || !canAdd) return [];
        const isSelf = actionSheetUser.id === currentUser.id;
        return [
            { label: 'Modifier', icon: 'edit', onClick: () => onEdit(actionSheetUser.id) },
            { 
                label: 'Supprimer', 
                icon: 'delete', 
                onClick: () => {
                    if (actionSheetUser) {
                        setDeleteConfirmation({ ids: [actionSheetUser.id], isBulk: false });
                    }
                },
                isDestructive: true, 
                disabled: isSelf, 
                disabledTooltip: "Vous ne pouvez pas vous supprimer." 
            }
        ];
    }, [actionSheetUser, currentUser.id, canAdd, onEdit, onDelete]);

    return (
        <div className="relative flex flex-col h-full bg-gray-100 dark:bg-gray-900" aria-busy={isLoading}>
            {selectionModeActive ? (
                <SelectionHeader
                    count={selectedIds.size}
                    onCancel={() => onSelectedIdsChange(new Set())}
                    onDelete={() => {
                        if (canAdd) {
                            setDeleteConfirmation({ ids: Array.from(selectedIds), isBulk: true });
                        }
                    }}
                />
            ) : (
                <PageHeader title="Utilisateurs">
                    <PageHeaderActions actions={userActions} />
                </PageHeader>
            )}
            <div className="p-4 flex-shrink-0">
                <SmartSearchInput
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onSubmit={handleNaturalLanguageSearch}
                    placeholder={placeholderText}
                    isSearching={isAiSearching}
                />
            </div>
            
            {smartFilters && (
                <div className={`px-4 pb-4 flex flex-wrap gap-2 items-center flex-shrink-0 ${isClearingSmartFilters ? 'animate-shake-and-fade-out' : 'animate-fade-in'}`}>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-2">Filtres intelligents:</span>
                    {Object.entries(smartFilters).map(([key, value]) => value && (
                        <div key={key} className="flex items-center gap-1.5 rounded-full bg-primary-100 dark:bg-primary-500/20 px-2.5 py-1 text-xs font-medium text-primary-900 dark:text-primary-300">
                            <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                            <span>{`${key}: ${value}`}</span>
                        </div>
                    ))}
                    <button 
                        onClick={handleClearSmartFiltersClick} 
                        className="flex items-center gap-1 rounded-full bg-gray-200 dark:bg-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Effacer les filtres intelligents et la recherche"
                    >
                        <span className="material-symbols-outlined !text-sm">close</span>
                        <span>Tout effacer</span>
                    </button>
                </div>
            )}
            <div className="px-4 pb-4 flex-shrink-0">
                <div className="flex items-center justify-end gap-2 mb-3 lg:hidden">
                    {hasActiveFilters && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-300">Filtres actifs</span>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={showFilters ? 'close' : 'tune'}
                        iconPosition="left"
                        onClick={() => setShowFilters(prev => !prev)}
                        aria-expanded={showFilters}
                        aria-controls="users-filters-panel"
                    >
                        {showFilters ? 'Masquer' : 'Filtres'}
                    </Button>
                </div>
                <div id="users-filters-panel" className={`${showFilters ? 'block' : 'hidden'} space-y-3 lg:block`}>
                    <FilterToolbar
                        filters={usersFilters}
                        definitions={usersFilterDefs}
                        onFiltersChange={setUsersFilters}
                        savedViewsKey="users-views"
                        onClearAll={handleManualFilterChange}
                    />
                </div>
            </div>

            <div ref={containerRef} onScroll={handleScroll} className="overflow-y-auto flex-grow px-4 pb-24 lg:pb-4">
                {isLoading ? <UsersSkeleton /> : (
                    <div className="relative" style={{ height: `${filteredUsers.length * ITEM_HEIGHT}px` }}>
                        {filteredUsers.length > 0 ? visibleItems.map((user, index) => {
                            const itemIndex = startIndex + index;
                            
                            const actions = canAdd ? [
                                { label: 'Modifier', icon: 'edit', onClick: (e: React.MouseEvent) => { e.stopPropagation(); onEdit(user.id); }, isDestructive: false },
                                { label: 'Supprimer', icon: 'delete', onClick: (e: React.MouseEvent) => { e.stopPropagation(); setDeleteConfirmation({ ids: [user.id], isBulk: false }); }, isDestructive: true, disabled: user.id === currentUser.id, disabledTooltip: "Vous ne pouvez pas vous supprimer." }
                            ] : [];
                            
                            const listItem = (
                                <ListItemCard
                                    id={user.id}
                                    imageUrl={user.avatarUrl}
                                    imageShape="round"
                                    title={<Highlight text={user.name} highlight={searchTerm} />}
                                    details={[{ icon: 'work', text: user.department || 'N/A' }]}
                                    statusBadge={<RoleBadge role={user.role} className="max-w-[140px] overflow-hidden" />}
                                    selectionModeActive={selectionModeActive}
                                    isSelected={selectedIds.has(user.id)}
                                    // FIX: Pass a function that accepts the user ID for navigation.
                                    onCardClick={(id: string) => window.location.hash = `#/users/${id}`}
                                    onLongPress={canAdd ? toggleSelection : undefined}
                                    onSelectToggle={canAdd ? () => toggleSelection(user.id) : undefined}
                                    actions={actions}
                                    isPopoverOpen={popoverTargetId === user.id}
                                    onActionsClick={handlePopoverOpen}
                                    onMobileActionsClick={(e) => handleMobileActionsOpen(e, user.id)}
                                    popoverRef={popoverRef}
                                    popoverPosition={popoverPosition}
                                    fullHeight={true}
                                />
                            );


                            return (
                                <div
                                    key={user.id}
                                    className="absolute w-full"
                                    style={{
                                        height: `${ITEM_HEIGHT}px`,
                                        transform: `translateY(${itemIndex * ITEM_HEIGHT}px)`,
                                        paddingTop: '4px',
                                        paddingBottom: '4px',
                                        zIndex: popoverTargetId === user.id ? 10 : 'auto',
                                    }}
                                >
                                    <div className="h-full">
                                        {listItem}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-10"><p className="text-gray-600 dark:text-gray-400">Aucun utilisateur trouvé.</p></div>
                        )}
                    </div>
                )}
            </div>
            
            <DropdownMenu
                isOpen={!!actionSheetUser}
                onClose={() => setActionSheetUser(null)}
                title={actionSheetUser?.name || ''}
                actions={actionSheetActions}
            />
            {!selectionModeActive && canAdd && (
              <FloatingActionButton actions={userActions} id="fab-users" mainIcon="add" className="lg:hidden" />
            )}
            <ConfirmationModal
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={() => {
                    if (deleteConfirmation) {
                        if (deleteConfirmation.isBulk) {
                            onBulkDelete(deleteConfirmation.ids);
                        } else {
                            onDelete(deleteConfirmation.ids[0]);
                        }
                        setDeleteConfirmation(null);
                    }
                }}
                title={deleteConfirmation?.isBulk ? "Supprimer les utilisateurs" : "Supprimer l'utilisateur"}
                confirmButtonText="Supprimer"
            >
                <p>Êtes-vous sûr de vouloir supprimer {deleteConfirmation?.isBulk ? `ces ${deleteConfirmation.ids.length} utilisateurs` : 'cet utilisateur'}? Cette action est irréversible.</p>
            </ConfirmationModal>
        </div>
    );
};

export default Users;