
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { Equipment, Model, Category, Assignment, User, EquipmentWithDetails } from '../types';
import { EquipmentStatus, FormAction, UserRole } from '../types';
import { InventorySkeleton } from './skeletons';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import PageHeader, { SelectionHeader, ListItemCard, FloatingActionButton, PageHeaderActions } from './PageHeader';
import { BulkUpdateModal, ConfirmationModal } from './Modals';
import QRScanner from './QRScanner';
import Tooltip from './Tooltip';
import StatusBadge from './StatusBadge';
import DropdownMenu, { type DropdownMenuAction } from './DropdownMenu';
import SmartSearchInput from './SmartSearchInput';
import FilterToolbar, { type FilterDefinition } from './FilterToolbar';
import Button from './ui/Button';
import { useFocusTrap } from './hooks/useFocusTrap';

interface InventoryProps {
    equipment: Equipment[];
    models: Model[];
    categories: Category[];
    assignments: Assignment[];
    users: User[];
    onAdd: () => void;
    onImport: () => void;
    canAdd: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    selectedIds: Set<string>;
    onSelectedIdsChange: (ids: Set<string>) => void;
    onBulkDelete: (ids: string[]) => void;
    onBulkUpdateStatus: (ids: string[], status: EquipmentStatus) => void;
    onBulkUpdateLocation: (ids: string[], location: string) => void;
    isLoading: boolean;
    currentUser: User;
}

const Highlight: React.FC<{text: string, highlight: string}> = ({ text, highlight }) => {
    if (!highlight || !highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>{parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-primary-200/70 dark:bg-primary-500/30 rounded-sm px-0.5">{part}</mark>
            ) : (
                <span key={i}>{part}</span>
            )
        )}</>
    );
};


const Inventory: React.FC<InventoryProps> = ({ equipment, models, categories, assignments, users, onAdd, onImport, canAdd, onEdit, onDelete, selectedIds, onSelectedIdsChange, onBulkDelete, onBulkUpdateStatus, onBulkUpdateLocation, isLoading, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    // Debounced search term to avoid filtering on every keystroke
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [locationFilter, setLocationFilter] = useState<string>('all');
    const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
    const [warrantyFilter, setWarrantyFilter] = useState<boolean>(false);
    const [popoverTargetId, setPopoverTargetId] = useState<string | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('bottom');
    const popoverRef = useRef<HTMLDivElement>(null);
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [smartFilters, setSmartFilters] = useState<Record<string, any> | null>(null);
    const [isClearingSmartFilters, setIsClearingSmartFilters] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const { addToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [actionSheetItem, setActionSheetItem] = useState<EquipmentWithDetails | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ ids: string[], isBulk: boolean } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    
    
    const ITEM_HEIGHT = 88; // Adjusted height for new card design
    const OVERSCAN_COUNT = 5;
    
    const placeholderText = smartFilters
        ? "Filtres intelligents actifs. Tapez pour une nouvelle recherche."
        : "Filtrer ou demander à Gemini...";
    
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
        const applyFilterFromHash = () => {
            const hash = window.location.hash;
            const [base, query] = hash.split('?');
            
            if (base === '#/inventory') { 
                const params = new URLSearchParams(query || '');
                const categoryId = params.get('category');
                
                if (categoryId && categories.some(c => c.id === categoryId)) {
                    setTypeFilter(categoryId);
                } else if (!query) {
                    setTypeFilter('all');
                }
            }
        };

        applyFilterFromHash();

        window.addEventListener('hashchange', applyFilterFromHash);
        return () => {
            window.removeEventListener('hashchange', applyFilterFromHash);
        };
    }, [categories]);

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

    const handlePopoverOpen = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();

        if (popoverTargetId === itemId) {
            setPopoverTargetId(null);
            return;
        }
        
        const button = e.currentTarget;
        const buttonRect = button.getBoundingClientRect();
        const popoverHeight = 100; // Estimated height of the popover

        const scrollContainer = containerRef.current;
        const containerRect = scrollContainer 
            ? scrollContainer.getBoundingClientRect() 
            : { top: 0, bottom: window.innerHeight }; // Fallback to viewport

        const spaceBelow = containerRect.bottom - buttonRect.bottom;
        const spaceAbove = buttonRect.top - containerRect.top;

        if (spaceBelow < popoverHeight && spaceAbove > popoverHeight) {
            setPopoverPosition('top');
        } else {
            setPopoverPosition('bottom');
        }
        
        setPopoverTargetId(itemId);
    };
    
    const handleMobileActionsOpen = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        const item = filteredEquipment.find(eq => eq.id === itemId);
        if (item) {
            setActionSheetItem(item);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const equipmentWithDetails: EquipmentWithDetails[] = useMemo(() => equipment.map(e => {
        const model = models.find(m => m.id === e.modelId);
        const category = model ? categories.find(c => c.id === model.categoryId) : null;
        return { ...e, model, category };
    }), [equipment, models, categories]);

    const assignedUserMap = useMemo(() => {
        const map = new Map<string, string>();
        const userMap = new Map(users.map(u => [u.id, u.name]));
        if (assignments) {
            const latestAssignments = new Map<string, Assignment>();
            for (const assignment of assignments) {
                const existing = latestAssignments.get(assignment.equipmentId);
                if (!existing || new Date(assignment.date) > new Date(existing.date)) {
                    latestAssignments.set(assignment.equipmentId, assignment);
                }
            }
            for (const eq of equipment) {
                if (eq.status === EquipmentStatus.ASSIGNED) {
                    const lastAssignment = latestAssignments.get(eq.id);
                    if (lastAssignment && lastAssignment.action === FormAction.ASSIGN) {
                         const userName = userMap.get(lastAssignment.userId);
                        if (userName) {
                            map.set(eq.id, userName);
                        }
                    }
                }
            }
        }
        return map;
    }, [assignments, equipment, users]);

    const filteredEquipment = useMemo(() => equipmentWithDetails.filter(item => {
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchesType = typeFilter === 'all' || item.category?.id === typeFilter;
        const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
        
        const lowerCaseTerm = debouncedSearchTerm.toLowerCase();
        const matchesSearchTerm = debouncedSearchTerm === '' ||
            (item.model && item.model.name.toLowerCase().includes(lowerCaseTerm)) ||
            item.assetTag.toLowerCase().includes(lowerCaseTerm) ||
            (item.name && item.name.toLowerCase().includes(lowerCaseTerm));

        const assignedUserName = assignedUserMap.get(item.id);
        const user = assignedUserName ? users.find(u => u.name === assignedUserName) : null;
        const assignedEmpty = !assignedToFilter || assignedToFilter === 'all' || assignedToFilter.trim() === '';
        const lowerCaseAssignedToFilter = (assignedToFilter || '').toLowerCase();
        const matchesAssignedTo = assignedEmpty || (user && (
            user.name.toLowerCase().includes(lowerCaseAssignedToFilter) ||
            (user.department && user.department.toLowerCase().includes(lowerCaseAssignedToFilter))
        ));
        
        const currentYear = new Date().getFullYear();
        const matchesWarranty = !warrantyFilter || (item.warrantyEndDate && new Date(item.warrantyEndDate).getFullYear() === currentYear);

        return matchesStatus && matchesType && matchesLocation && matchesSearchTerm && matchesAssignedTo && matchesWarranty;
    }), [equipmentWithDetails, debouncedSearchTerm, statusFilter, typeFilter, locationFilter, assignedToFilter, warrantyFilter, assignedUserMap, users]);
    
    const { startIndex, visibleItems } = useMemo(() => {
        const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN_COUNT);
        const itemsToShow = containerHeight > 0 ? Math.ceil(containerHeight / ITEM_HEIGHT) + (2 * OVERSCAN_COUNT) : 20;
        const endIndex = Math.min(filteredEquipment.length, startIndex + itemsToShow);

        return {
            startIndex,
            visibleItems: filteredEquipment.slice(startIndex, endIndex),
        };
    }, [scrollTop, containerHeight, filteredEquipment]);


    const locations = useMemo(() => Array.from(new Set(equipment.map(e => e.location).filter(Boolean))), [equipment]);

    const hasActiveFilters = useMemo(() => (
        typeFilter !== 'all' ||
        statusFilter !== 'all' ||
        locationFilter !== 'all' ||
        (assignedToFilter !== 'all' && assignedToFilter.trim() !== '') ||
        warrantyFilter
    ), [typeFilter, statusFilter, locationFilter, assignedToFilter, warrantyFilter]);

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
        setStatusFilter('all');
        setTypeFilter('all');
        setAssignedToFilter('all');
        setWarrantyFilter(false);
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
                    status: { type: Type.STRING, description: "Filter by equipment status." },
                    category: { type: Type.STRING, description: "Filter by equipment category name." },
                    location: { type: Type.STRING, description: "Filter by physical location/site." },
                    assignedTo: { type: Type.STRING, description: "Filter by the name of the assigned user or a department/team name." },
                    warrantyExpiresThisYear: { type: Type.BOOLEAN, description: "Set to true if filtering for warranties expiring this year." },
                    searchTerm: { type: Type.STRING, description: "General keywords, model names, or asset tags from the query." }
                }
            };

            const prompt = `You are an expert search query parser for an IT asset management application. Your task is to translate the user's natural language query into a structured JSON object of filters. Infer as much information as possible. For example, if the query is "all macbooks", you should infer that the category is "Laptop" and the searchTerm could be "macbook".

            Here are the available filter options:
            - Statuses: ${Object.values(EquipmentStatus).join(', ')}
            - Categories: ${categories.map(c => c.name).join(', ')}
            - Locations: ${locations.join(', ')}
            - Users or Departments: ${users.map(u => u.name).join(', ')}, Marketing, Engineering, etc.

            Analyze the user's query: "${searchTerm}"

            Based on the query, populate the JSON schema. If a field is not mentioned and cannot be inferred, omit it. For 'warrantyExpiresThisYear', set it to true only if the user explicitly asks for warranties expiring in the current year. For 'assignedTo', extract a user's name or a department/team name. For 'searchTerm', include any remaining specific keywords, model names, or asset tags.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });

            const parsedFilters = JSON.parse(response.text.trim());
            
            // Reset all filters before applying new ones
            setSearchTerm('');
            setStatusFilter('all');
            setTypeFilter('all');
            setLocationFilter('all');
            setAssignedToFilter('all');
            setWarrantyFilter(false);

            // Apply new filters
            setSmartFilters(parsedFilters);
            if (parsedFilters.searchTerm) setSearchTerm(parsedFilters.searchTerm);
            if (parsedFilters.status && Object.values(EquipmentStatus).includes(parsedFilters.status as EquipmentStatus)) {
                setStatusFilter(parsedFilters.status);
            }
            if (parsedFilters.category) {
                const foundCategory = categories.find(c => c.name.toLowerCase() === parsedFilters.category.toLowerCase());
                if (foundCategory) setTypeFilter(foundCategory.id);
            }
            if (parsedFilters.location && locations.includes(parsedFilters.location)) {
                setLocationFilter(parsedFilters.location);
            }
            if (parsedFilters.assignedTo) setAssignedToFilter(parsedFilters.assignedTo);
            if (parsedFilters.warrantyExpiresThisYear) setWarrantyFilter(true);

            addToast('Filtres intelligents appliqués !', 'success');
        } catch (error) {
            console.error("Error with Gemini search:", error);
            addToast("Désolé, je n'ai pas pu traiter cette recherche.", 'error');
        } finally {
            setIsAiSearching(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        clearSmartFiltersWithAnimation();
    };

    const handleScanSuccess = (text: string) => {
        setIsScanning(false);
        const eq = equipment.find(e => e.assetTag === text);
        if (eq) {
            window.location.hash = `#/equipment/${eq.id}`;
        } else {
            addToast('Équipement non trouvé', 'error');
        }
    };

    const inventoryActions = [
        { label: 'Ajouter manuellement', icon: 'edit_note', onClick: () => onAdd() },
        { label: 'Scanner un équipement', icon: 'qr_code_scanner', onClick: () => setIsScanning(true) },
        { label: 'Importer un CSV', icon: 'upload', onClick: () => onImport() },
        ...(canAdd ? [{ label: 'Sélectionner', icon: 'check_circle', onClick: () => {
            if (filteredEquipment.length > 0) {
                toggleSelection(filteredEquipment[0].id);
            }
        }}] : []),
    ];

    const actionSheetActions: DropdownMenuAction[] = useMemo(() => {
        if (!actionSheetItem) return [];
        const isDeletable = actionSheetItem.status !== EquipmentStatus.ASSIGNED && actionSheetItem.status !== EquipmentStatus.PENDING_VALIDATION;
        return [
            { label: 'Modifier', icon: 'edit', onClick: () => onEdit(actionSheetItem.id) },
            { 
                label: 'Supprimer', 
                icon: 'delete', 
                onClick: () => {
                    if (actionSheetItem) {
                        setDeleteConfirmation({ ids: [actionSheetItem.id], isBulk: false });
                    }
                },
                isDestructive: true, 
                disabled: !isDeletable, 
                disabledTooltip: "L'équipement attribué ou en attente ne peut être supprimé." 
            }
        ];
    }, [actionSheetItem, onEdit, onDelete]);

    return (
        <div className="relative flex flex-col h-full bg-gray-100 dark:bg-gray-900">
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
                <PageHeader title="Équipement">
                    <PageHeaderActions actions={inventoryActions} />
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
            
            {/* FilterToolbar: unified filters with chips & saved views */}
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
                        aria-controls="inventory-filters-panel"
                    >
                        {showFilters ? 'Masquer' : 'Filtres'}
                    </Button>
                </div>
                <div id="inventory-filters-panel" className={`${showFilters ? 'block' : 'hidden'} space-y-3 lg:block`}>
                    <FilterToolbar
                        filters={{ typeFilter, statusFilter, locationFilter, assignedToFilter: assignedToFilter === 'all' ? '' : assignedToFilter, warrantyFilter }}
                        definitions={(
                            [
                                { id: 'typeFilter', label: 'Type', type: 'select', options: categories.map(c => ({ label: c.name, value: c.id })) },
                                { id: 'statusFilter', label: 'Statut', type: 'select', options: Object.values(EquipmentStatus).map(s => ({ label: s, value: s })) },
                                { id: 'locationFilter', label: 'Emplacement', type: 'select', options: locations.map(l => ({ label: l, value: l })) },
                                { id: 'assignedToFilter', label: 'Attribué à', type: 'text', placeholder: 'Utilisateur ou département' },
                                { id: 'warrantyFilter', label: 'Garantie (cette année)', type: 'boolean' },
                            ] as FilterDefinition[]
                        )}
                        onFiltersChange={(next) => {
                            setTypeFilter(next.typeFilter ?? 'all');
                            setStatusFilter(next.statusFilter ?? 'all');
                            setLocationFilter(next.locationFilter ?? 'all');
                            setAssignedToFilter((next.assignedToFilter ?? '').trim() === '' ? 'all' : next.assignedToFilter);
                            setWarrantyFilter(!!next.warrantyFilter);
                            handleManualFilterChange();
                        }}
                        savedViewsKey="inventory-views"
                        onClearAll={handleManualFilterChange}
                    />
                </div>
            </div>
            
            <div ref={containerRef} onScroll={handleScroll} className="overflow-y-auto flex-grow px-4 pb-24 md:pb-4">
                {isLoading ? <InventorySkeleton /> : (
                    <div className="relative" style={{ height: `${filteredEquipment.length * ITEM_HEIGHT}px` }}>
                        {filteredEquipment.length > 0 ? visibleItems.map((item, index) => {
                            const itemIndex = startIndex + index;
                            
                            const actions = [
                                { label: 'Modifier', icon: 'edit', onClick: (e: React.MouseEvent) => { e.stopPropagation(); onEdit(item.id); }, isDestructive: false },
                                { label: 'Supprimer', icon: 'delete', onClick: (e: React.MouseEvent) => { e.stopPropagation(); setDeleteConfirmation({ ids: [item.id], isBulk: false }); }, isDestructive: true, disabled: item.status === EquipmentStatus.ASSIGNED || item.status === EquipmentStatus.PENDING_VALIDATION, disabledTooltip: "L'équipement attribué ou en attente ne peut être supprimé." }
                            ];

                            const details = [
                                { icon: 'tag', text: item.assetTag },
                            ];
                            if (item.status === EquipmentStatus.ASSIGNED && assignedUserMap.get(item.id)) {
                                details.push({ icon: 'person', text: assignedUserMap.get(item.id)! });
                            }
                            
                            const statusLabel = item.status === EquipmentStatus.PENDING_VALIDATION ? 'En attente' : item.status;
                            const listItem = (
                                <ListItemCard
                                    id={item.id}
                                    imageUrl={item.model?.imageUrl}
                                    title={<Highlight text={item.name || item.model?.name || 'Modèle inconnu'} highlight={searchTerm} />}
                                    details={details}
                                    statusBadge={<StatusBadge status={item.status} label={statusLabel} className="max-w-[140px] overflow-hidden" />}
                                    selectionModeActive={selectionModeActive}
                                    isSelected={selectedIds.has(item.id)}
                                    // FIX: Explicitly typed the 'id' parameter to prevent it from being inferred as 'unknown'.
                                    onCardClick={(id: string) => window.location.hash = `#/equipment/${id}`}
                                    onLongPress={canAdd ? toggleSelection : undefined}
                                    onSelectToggle={canAdd ? () => toggleSelection(item.id) : undefined}
                                    actions={canAdd ? actions : undefined}
                                    isPopoverOpen={popoverTargetId === item.id}
                                    onActionsClick={handlePopoverOpen}
                                    onMobileActionsClick={(e) => handleMobileActionsOpen(e, item.id)}
                                    popoverRef={popoverRef}
                                    popoverPosition={popoverPosition}
                                    fullHeight={true}
                                />
                            );


                            return (
                                <div
                                    key={item.id}
                                    className="absolute w-full"
                                    style={{
                                        height: `${ITEM_HEIGHT}px`,
                                        transform: `translateY(${itemIndex * ITEM_HEIGHT}px)`,
                                        paddingTop: '4px',
                                        paddingBottom: '4px',
                                        zIndex: popoverTargetId === item.id ? 10 : 'auto',
                                    }}
                                >
                                    <div className="h-full">
                                        {listItem}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-10"><p className="text-gray-600 dark:text-gray-400">Aucun équipement trouvé.</p><p className="text-gray-500 dark:text-gray-500 text-sm">Essayez d'ajuster votre recherche ou vos filtres.</p></div>
                        )}
                    </div>
                )}
            </div>

            {isScanning && (
                <QRScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setIsScanning(false)}
                />
            )}
            <DropdownMenu
                isOpen={!!actionSheetItem}
                onClose={() => setActionSheetItem(null)}
                title={actionSheetItem?.name || actionSheetItem?.model?.name || actionSheetItem?.assetTag || ''}
                actions={actionSheetActions}
            />
            {!selectionModeActive && canAdd && (
                <FloatingActionButton actions={inventoryActions} id="fab-inventory" mainIcon="add" className="lg:hidden" />
            )}
            <ConfirmationModal
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={() => {
                    if (deleteConfirmation) {
                        if (deleteConfirmation.isBulk) {
                            onBulkDelete(deleteConfirmation.ids);
                            onSelectedIdsChange(new Set());
                        } else {
                            onDelete(deleteConfirmation.ids[0]);
                        }
                        setDeleteConfirmation(null);
                    }
                }}
                title={deleteConfirmation?.isBulk ? "Supprimer les équipements" : "Supprimer l'équipement"}
                confirmButtonText="Supprimer"
            >
                <p>Êtes-vous sûr de vouloir supprimer {deleteConfirmation?.isBulk ? `ces ${deleteConfirmation.ids.length} équipements` : 'cet équipement'}? Cette action est irréversible.</p>
            </ConfirmationModal>
        </div>
    );
};

export default Inventory;