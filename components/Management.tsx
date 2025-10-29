
import React, { useState, useMemo } from 'react';
import type { Category, Model, Equipment } from '../types';
import PageHeader, { FloatingActionButton, PageHeaderActions } from './PageHeader';
import EquipmentCategories from './EquipmentCategories';
import EquipmentModels from './EquipmentModels';

interface ManagementProps {
    categories: Category[];
    models: Model[];
    equipment: Equipment[];
    onAddCategory: () => void;
    onAddModel: () => void;
    onViewCategory: (id: string) => void;
    onSelectModel: (id: string) => void;
}

const Management: React.FC<ManagementProps> = ({
    categories, models, equipment,
    onAddCategory, onAddModel, onViewCategory, onSelectModel
}) => {
    const [activeTab, setActiveTab] = useState<'categories' | 'models'>('categories');
    
    const managementActions = useMemo(() => [
        { label: 'Ajouter une catégorie', icon: 'create_new_folder', onClick: () => onAddCategory() },
        { label: 'Ajouter un modèle', icon: 'add_box', onClick: () => onAddModel() },
        { label: 'Importer des modèles (CSV)', icon: 'upload', onClick: () => window.location.hash = '#/models/import' },
    ], [onAddCategory, onAddModel]);

    const tabBaseClasses = "flex-1 whitespace-nowrap border-b-2 py-3 text-center text-sm transition-colors";
    const activeTabClasses = "border-primary-500 text-primary-600 dark:text-primary-300 font-semibold";
    const inactiveTabClasses = "border-transparent text-secondary-500 dark:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600 hover:text-secondary-700 dark:hover:text-secondary-100 font-medium";

    return (
      <div className="flex flex-col h-screen bg-secondary-50 dark:bg-[#0f1722]">
        <PageHeader title="Gestion">
          <PageHeaderActions actions={managementActions} />
        </PageHeader>
        <div className="border-b border-secondary-200/70 dark:border-secondary-800 flex-shrink-0 backdrop-blur-sm bg-white/40 dark:bg-secondary-900/40">
          <div className="flex gap-x-4 px-4">
            <button onClick={() => setActiveTab('categories')} className={`${tabBaseClasses} ${activeTab === 'categories' ? activeTabClasses : inactiveTabClasses}`}>Catégories</button>
            <button onClick={() => setActiveTab('models')} className={`${tabBaseClasses} ${activeTab === 'models' ? activeTabClasses : inactiveTabClasses}`}>Modèles</button>
          </div>
        </div>
        <main className="flex-1 flex flex-col overflow-y-auto bg-secondary-50/80 dark:bg-[#0f1722] pb-24 lg:pb-6">
          {activeTab === 'categories' && <div className="flex-grow"><EquipmentCategories categories={categories} onViewCategory={onViewCategory} /></div>}
          {activeTab === 'models' && <div className="flex-grow"><EquipmentModels equipment={equipment} models={models} categories={categories} onSelectModel={onSelectModel} /></div>}
        </main>
        <FloatingActionButton actions={managementActions} id="fab-management" mainIcon="add" className="lg:hidden" />
      </div>
    );
};

export default Management;
