import React, { useState, useMemo } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import Button from '../../../components/ui/Button';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { PageTabs } from '../../../components/ui/PageTabs';
import { DetailHeader } from '../../../components/layout/DetailHeader';

interface AuditDetailsPageProps {
    onBack: () => void;
}

const AuditDetailsPage: React.FC<AuditDetailsPageProps> = ({ onBack }) => {
    const { equipment } = useData();
    const [activeTab, setActiveTab] = useState<'todo' | 'scanned' | 'missing'>('todo');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Mock filtering for demo based on status or type - Memoized
    const auditItems = useMemo(() => {
        return equipment.filter(item =>
            item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            item.assetId.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [equipment, debouncedSearch]);

    // Mock progress calculation
    const totalItems = auditItems.length;
    const scannedItems = Math.floor(totalItems * 0.35); // 35% scanned simulation
    const missingItems = Math.floor(totalItems * 0.1);  // 10% missing simulation
    const remainingItems = totalItems - scannedItems - missingItems;

    const progressPercentage = totalItems > 0 ? Math.round((scannedItems / totalItems) * 100) : 0;

    return (
        <div className="flex flex-col h-full bg-surface-container-low">

            {/* Header */}
            <DetailHeader
                onBack={onBack}
                pretitle={(
                    <div className="flex items-center gap-3">
                        <span className="bg-primary text-on-primary text-xs font-bold px-2 py-1 rounded">EN COURS</span>
                        <span className="text-on-surface-variant text-sm font-medium">Q1 2026</span>
                    </div>
                )}
                title="Audit : Bureau Paris"
                subtitle="Marketing Europe • Alice Admin"
                actions={(
                    <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-card border border-outline-variant min-w-[300px]">
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-on-surface-variant uppercase">Avancement</span>
                                <span className="font-bold text-on-surface">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-outline-variant h-2.5 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}
                tabs={(
                    <PageTabs
                        activeId={activeTab}
                        onChange={(tabId) => setActiveTab(tabId as 'todo' | 'scanned' | 'missing')}
                        items={[
                            { id: 'todo', label: 'À scanner', badge: remainingItems },
                            { id: 'scanned', label: 'Scannés', badge: scannedItems },
                            { id: 'missing', label: 'Manquants', badge: missingItems }
                        ]}
                    />
                )}
            />

            {/* Content */}
            <div className="p-page-sm medium:p-page overflow-y-auto">
                {/* Standardized Harmonized Search Filter Bar */}
                <div className="mb-6">
                    <SearchFilterBar
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        placeholder="Rechercher un équipement par nom ou asset ID..."
                        resultCount={auditItems.length}
                    />
                </div>

                {/* List */}
                <div className="space-y-3">
                    {auditItems.map((item, index) => {
                        // Mocking status logic for display based on index
                        const mockStatus = index % 3 === 0 ? 'scanned' : index % 7 === 0 ? 'missing' : 'todo';

                        if (activeTab === 'scanned' && mockStatus !== 'scanned') return null;
                        if (activeTab === 'missing' && mockStatus !== 'missing') return null;
                        if (activeTab === 'todo' && mockStatus !== 'todo') return null;

                        return (
                            <div key={item.id} className="bg-surface p-card-compact rounded-card shadow-elevation-1 border border-transparent hover:border-outline-variant transition-all flex flex-col medium:flex-row items-center gap-4 group">
                                <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center text-on-surface-variant shrink-0">
                                    {item.type === 'Laptop' ? <MaterialIcon name="laptop" size={20} /> :
                                        item.type === 'Phone' ? <MaterialIcon name="smartphone" size={20} /> : <MaterialIcon name="monitor" size={20} />}
                                </div>

                                <div className="flex-1 min-w-0 text-center medium:text-left">
                                    <h4 className="font-bold text-on-surface">{item.name}</h4>
                                    <div className="flex items-center justify-center medium:justify-start gap-2 text-sm text-on-surface-variant">
                                        <span className="font-mono">{item.assetId}</span>
                                        <span>•</span>
                                        <span>{item.model}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full medium:w-auto justify-between medium:justify-end">
                                    {item.user ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg">
                                            <div className="w-6 h-6 bg-outline-variant rounded-full flex items-center justify-center text-label-small font-bold">
                                                {item.user.name?.[0]}
                                            </div>
                                            <span className="text-xs font-medium text-on-surface-variant truncate max-w-[100px]">{item.user.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-on-surface-variant italic px-3">Non assigné</div>
                                    )}

                                    {mockStatus === 'scanned' && (
                                        <div className="flex items-center gap-2 text-tertiary bg-tertiary-container px-3 py-1.5 rounded-lg font-bold text-xs">
                                            <MaterialIcon name="check_circle" size={16} /> VÉRIFIÉ
                                        </div>
                                    )}
                                    {mockStatus === 'missing' && (
                                        <div className="flex items-center gap-2 text-error bg-error-container px-3 py-1.5 rounded-lg font-bold text-xs">
                                            <MaterialIcon name="cancel" size={16} /> MANQUANT
                                        </div>
                                    )}
                                    {mockStatus === 'todo' && (
                                        <Button
                                            variant="filled"
                                            size="sm"
                                            className="bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface/90 border-none"
                                            icon={<MaterialIcon name="document_scanner" size={14} />}
                                        >
                                            SCANNER
                                        </Button>
                                    )}

                                    <Button variant="outlined" size="sm" className="px-2 text-outline hover:text-on-surface">
                                        <MaterialIcon name="more_vert" size={18} />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {auditItems.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-on-surface-variant">Aucun équipement ne correspond à votre recherche.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditDetailsPage;




