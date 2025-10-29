

import React, { useMemo, useState, useEffect } from 'react';
import type { Country, Site, Department, AuditAction, EntityType } from '../types';
import PageHeader, { FloatingActionButton, PageHeaderActions } from './PageHeader';
import Button from './ui/Button';
import { ConfirmationModal, LocationEditModal, LocationEditModalInfo } from './Modals';

interface LocationsProps {
    countries: Country[];
    sites: Site[];
    departments: Department[];
    dispatch: React.Dispatch<any>;
    logAuditEvent: (action: AuditAction, entityType: EntityType, entityName: string) => void;
}

const Locations: React.FC<LocationsProps> = ({ countries, sites, departments, dispatch, logAuditEvent }) => {
    const [modalInfo, setModalInfo] = useState<LocationEditModalInfo | null>(null);
    const [confirmation, setConfirmation] = useState<any>(null);
    const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

    const handleSaveLocation = async (entityType: 'country' | 'site' | 'department', data: any) => {
        // Simulating async save
        await new Promise(resolve => setTimeout(resolve, 500));
        const { id, name, parentId } = data;
        let actionType: string = '';
        let payload: any = { id, name };
        let entityTypeName: EntityType = 'location';
        
        switch (entityType) {
            case 'country': actionType = 'SAVE_COUNTRY'; break;
            case 'site': actionType = 'SAVE_SITE'; payload.countryId = parentId; break;
            case 'department': actionType = 'SAVE_DEPARTMENT'; payload.siteId = parentId; break;
        }

        dispatch({ type: actionType, payload });
        logAuditEvent(id ? 'update' : 'create', entityTypeName, name);
    };

    const handleDeleteLocation = (entityType: 'country' | 'site' | 'department', entity: Country | Site | Department) => {
        let actionType = '';
        let childrenCheck: boolean = false;
        let childrenName: string = '';

        switch (entityType) {
            case 'country':
                actionType = 'DELETE_COUNTRY';
                childrenCheck = sites.some(s => s.countryId === entity.id);
                childrenName = 'sites';
                break;
            case 'site':
                actionType = 'DELETE_SITE';
                childrenCheck = departments.some(d => d.siteId === entity.id);
                childrenName = 'services';
                break;
            case 'department':
                actionType = 'DELETE_DEPARTMENT';
                break;
        }
        
        if (childrenCheck) {
            setConfirmation({
                title: 'Suppression impossible',
                children: `Vous ne pouvez pas supprimer ce ${entityType} car il contient des ${childrenName}.`,
                onConfirm: () => setConfirmation(null),
                onClose: () => setConfirmation(null),
                confirmButtonText: 'OK',
                confirmButtonVariant: 'primary',
                icon: 'error',
                iconBgColor: 'bg-yellow-100',
                iconColor: 'text-yellow-600',
            });
            return;
        }

        setConfirmation({
            title: `Supprimer ${entity.name}`,
            children: <>Êtes-vous sûr de vouloir supprimer <strong>{entity.name}</strong>? Cette action est irréversible.</>,
            onConfirm: () => {
                dispatch({ type: actionType, payload: entity.id });
                logAuditEvent('delete', 'location', entity.name);
                setConfirmation(null);
            },
            onClose: () => setConfirmation(null),
        });
    };
    
    const fabActions = [
        { label: 'Ajouter un pays', icon: 'public', onClick: () => setModalInfo({ entityType: 'country' }) },
        { label: 'Importer des localisations', icon: 'upload', onClick: () => window.location.hash = '#/locations/import' },
    ];

    const sortedCountries = useMemo(
        () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
        [countries]
    );

    const sortedSites = useMemo(
        () => [...sites].sort((a, b) => a.name.localeCompare(b.name)),
        [sites]
    );

    const sortedDepartments = useMemo(
        () => [...departments].sort((a, b) => a.name.localeCompare(b.name)),
        [departments]
    );

    const selectedCountry = sortedCountries.find(country => country.id === selectedCountryId) || null;
    const sitesForCountry = selectedCountry
        ? sortedSites.filter(site => site.countryId === selectedCountry.id)
        : [];

    const selectedSite = sitesForCountry.find(site => site.id === selectedSiteId) || null;
    const departmentsForSite = selectedSite
        ? sortedDepartments.filter(dept => dept.siteId === selectedSite.id)
        : [];

    const selectedDepartment = departmentsForSite.find(dept => dept.id === selectedDepartmentId) || null;

    useEffect(() => {
        if (!selectedCountryId && sortedCountries.length > 0) {
            setSelectedCountryId(sortedCountries[0].id);
        }
    }, [sortedCountries, selectedCountryId]);

    useEffect(() => {
        if (selectedCountry) {
            if (!selectedSite || !sitesForCountry.some(site => site.id === selectedSite.id)) {
                setSelectedSiteId(sitesForCountry[0]?.id ?? null);
            }
        } else {
            setSelectedSiteId(null);
        }
    }, [selectedCountry, sitesForCountry, selectedSite]);

    useEffect(() => {
        if (selectedSite) {
            if (!selectedDepartment || !departmentsForSite.some(dept => dept.id === selectedDepartment.id)) {
                setSelectedDepartmentId(departmentsForSite[0]?.id ?? null);
            }
        } else {
            setSelectedDepartmentId(null);
        }
    }, [selectedSite, departmentsForSite, selectedDepartment]);

    const details = useMemo(() => {
        if (selectedDepartment) {
            return {
                title: selectedDepartment.name,
                type: 'Service',
                metrics: [
                    { label: 'Site', value: selectedSite?.name || '—' },
                    { label: 'Pays', value: selectedCountry?.name || '—' },
                ],
                entityType: 'department' as const,
                entity: selectedDepartment,
            };
        }
        if (selectedSite) {
            return {
                title: selectedSite.name,
                type: 'Site',
                metrics: [
                    { label: 'Pays', value: selectedCountry?.name || '—' },
                    { label: 'Services', value: departmentsForSite.length.toString() },
                ],
                entityType: 'site' as const,
                entity: selectedSite,
            };
        }
        if (selectedCountry) {
            return {
                title: selectedCountry.name,
                type: 'Pays',
                metrics: [
                    { label: 'Sites', value: sitesForCountry.length.toString() },
                    { label: 'Services', value: sortedDepartments.filter(dept => sitesForCountry.some(site => site.id === dept.siteId)).length.toString() },
                ],
                entityType: 'country' as const,
                entity: selectedCountry,
            };
        }
        return null;
    }, [selectedCountry, selectedSite, selectedDepartment, sitesForCountry, departmentsForSite, sortedDepartments]);

    const ExplorerList: React.FC<{
        title: string;
        icon: string;
        items: { id: string; name: string }[];
        selectedId: string | null;
        onSelect: (id: string) => void;
        onAdd?: () => void;
        onEdit?: (item: { id: string; name: string }) => void;
        onDelete?: (item: { id: string; name: string }) => void;
        addLabel?: string;
        disabledAdd?: boolean;
    }> = ({ title, icon, items, selectedId, onSelect, onAdd, onEdit, onDelete, addLabel, disabledAdd }) => (
        <div className="surface-card surface-card-gradient rounded-2xl p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary-600 dark:text-secondary-200">{icon}</span>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight uppercase">{title}</h2>
                </div>
                {onAdd && (
                    <Button
                        size="sm"
                        variant="ghost"
                        icon="add"
                        onClick={onAdd}
                        disabled={disabledAdd}
                        className="border border-secondary-200 dark:border-secondary-800 hover:bg-secondary-100/60 dark:hover:bg-secondary-900/50"
                    >
                        {addLabel}
                    </Button>
                )}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {items.length === 0 && (
                    <p className="text-sm text-secondary-600 dark:text-secondary-300 italic">Aucun élément</p>
                )}
                {items.map(item => {
                    const isSelected = item.id === selectedId;
                    return (
                        <div
                            key={item.id}
                            className={`group flex items-center justify-between gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'border-secondary-300/80 dark:border-secondary-700/70 bg-secondary-100/80 dark:bg-secondary-900/45 text-secondary-800 dark:text-secondary-100 shadow-[var(--shadow-elev-2)]' : 'border-transparent hover:bg-secondary-100/50 dark:hover:bg-secondary-900/40 text-gray-900 dark:text-gray-100'}`}
                            onClick={() => onSelect(item.id)}
                        >
                            <span className="text-sm font-medium truncate">{item.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onEdit && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                        className="size-9 flex items-center justify-center rounded-full text-secondary-500 hover:text-secondary-800 dark:text-secondary-200 dark:hover:text-secondary-100"
                                        aria-label={`Modifier ${item.name}`}
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                        className="size-9 flex items-center justify-center rounded-full text-status-danger-500 hover:text-status-danger-400 dark:text-status-danger-300 hover:bg-status-danger-500/10"
                                        aria-label={`Supprimer ${item.name}`}
                                    >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
      <div className="flex flex-col h-screen bg-secondary-50 dark:bg-[#0f1722]">
        <PageHeader title="Emplacements">
          <PageHeaderActions actions={fabActions} />
        </PageHeader>
        <main className="flex-1 overflow-y-auto p-4 pb-28 lg:pb-6">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ExplorerList
                        title="Pays"
                        icon="public"
                        items={sortedCountries}
                        selectedId={selectedCountryId}
                        onSelect={(id) => {
                            setSelectedCountryId(id);
                            setSelectedSiteId(null);
                            setSelectedDepartmentId(null);
                        }}
                        onAdd={() => setModalInfo({ entityType: 'country' })}
                        onEdit={(item) => setModalInfo({ entityType: 'country', entity: item })}
                        onDelete={(item) => handleDeleteLocation('country', item as Country)}
                        addLabel="Pays"
                    />
                    <ExplorerList
                        title="Sites"
                        icon="domain"
                        items={sitesForCountry}
                        selectedId={selectedSiteId}
                        onSelect={(id) => {
                            setSelectedSiteId(id);
                            setSelectedDepartmentId(null);
                        }}
                        onAdd={() => selectedCountry && setModalInfo({ entityType: 'site', parentId: selectedCountry.id })}
                        onEdit={(item) => setModalInfo({ entityType: 'site', entity: item })}
                        onDelete={(item) => handleDeleteLocation('site', item as Site)}
                        addLabel="Site"
                        disabledAdd={!selectedCountry}
                    />
                    <ExplorerList
                        title="Services"
                        icon="meeting_room"
                        items={departmentsForSite}
                        selectedId={selectedDepartmentId}
                        onSelect={(id) => setSelectedDepartmentId(id)}
                        onAdd={() => selectedSite && setModalInfo({ entityType: 'department', parentId: selectedSite.id })}
                        onEdit={(item) => setModalInfo({ entityType: 'department', entity: item })}
                        onDelete={(item) => handleDeleteLocation('department', item as Department)}
                        addLabel="Service"
                        disabledAdd={!selectedSite}
                    />
                </div>
                <aside className="lg:w-80 xl:w-96 surface-card surface-card-gradient rounded-2xl p-5 h-full">
                    {details ? (
                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-200">{details.type}</h3>
                                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{details.title}</p>
                            </div>
                            <div className="space-y-2">
                                {details.metrics.map(metric => (
                                    <div key={metric.label} className="flex justify-between text-sm text-secondary-600 dark:text-secondary-200">
                                        <span>{metric.label}</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{metric.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon="edit"
                                    onClick={() => setModalInfo({ entityType: details.entityType, entity: details.entity })}
                                    className="flex-1"
                                >
                                    Modifier
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon="delete"
                                    onClick={() => handleDeleteLocation(details.entityType, details.entity)}
                                    className="flex-1 border border-secondary-200 dark:border-secondary-700"
                                >
                                    Supprimer
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-secondary-600 dark:text-secondary-200">
                            Sélectionnez un élément pour voir ses détails.
                        </div>
                    )}
                </aside>
            </div>
        </main>
        {modalInfo && <LocationEditModal info={modalInfo} countries={countries} sites={sites} onClose={() => setModalInfo(null)} onSave={handleSaveLocation} />}
        {confirmation && <ConfirmationModal isOpen={true} {...confirmation} />}
        <FloatingActionButton actions={fabActions} id="fab-locations" mainIcon="add" className="lg:hidden" />
      </div>
    );
};

export default Locations;