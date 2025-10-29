import React, { useState } from 'react';
import type { Category, Model, Equipment, User } from '../types';
import { UserRole } from '../types';
import PageHeader, { PageHeaderActions } from './PageHeader';
import { ConfirmationModal } from './Modals';
import StatusBadge from './StatusBadge';
import Button from './ui/Button';

interface CategoryDetailsProps {
    category: Category;
    models: Model[];
    equipment: Equipment[];
    users: User[];
    currentUser: User;
    onBack: () => void;
    onEdit: (categoryId: string) => void;
    onDelete: (categoryId: string) => void;
    onSelectEquipment: (equipmentId: string) => void;
    onSelectModel: (modelId: string) => void;
}

const CategoryDetails: React.FC<CategoryDetailsProps> = ({ category, models, equipment, currentUser, onBack, onEdit, onDelete, onSelectEquipment, onSelectModel }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const categoryActions = [
        { label: 'Modifier', icon: 'edit', onClick: () => onEdit(category.id) },
        { label: 'Supprimer', icon: 'delete', onClick: () => setIsDeleteModalOpen(true), isDestructive: true },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <PageHeader title={category.name} onBack={onBack}>
                {currentUser.role === UserRole.ADMIN && <PageHeaderActions actions={categoryActions} />}
            </PageHeader>
            <main className="flex-1 overflow-y-auto pb-24 md:pb-4">
                <div className="relative overflow-hidden">
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary-100 via-primary-50 to-amber-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900">
                        {/* Icon as background watermark */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary-300/20 dark:text-primary-400/10" style={{ fontSize: '14rem' }}>{category.icon || 'devices'}</span>
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
                        <p className="text-sm font-semibold text-white uppercase tracking-wide mb-2 drop-shadow-lg">Catégorie d'équipement</p>
                        <h1 className="text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">{category.name}</h1>
                    </div>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="surface-card surface-card-gradient rounded-2xl p-5 shadow-[var(--shadow-elev-1)] flex items-center gap-4 transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <div className="flex items-center justify-center size-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/50 dark:to-blue-800/30 shadow-sm">
                                <span className="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-300">category</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Modèles</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{models.length}</p>
                            </div>
                        </div>
                        <div className="surface-card surface-card-gradient rounded-2xl p-5 shadow-[var(--shadow-elev-1)] flex items-center gap-4 transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <div className="flex items-center justify-center size-14 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/30 shadow-sm">
                                <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-300">devices</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Équipements</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{equipment.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 px-4">
                    {category.description && (
                        <div className="surface-card surface-card-gradient rounded-2xl p-6 shadow-[var(--shadow-elev-1)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/50">
                                    <span className="material-symbols-outlined text-secondary-600 dark:text-secondary-400">description</span>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Description</h2>
                            </div>
                            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{category.description}</p>
                        </div>
                    )}
                    <div className="surface-card surface-card-gradient rounded-2xl p-6 shadow-[var(--shadow-elev-1)]">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">category</span>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Modèles ({models.length})</h2>
                            </div>
                            {currentUser.role === UserRole.ADMIN && (
                                <Button variant="ghost" size="sm" icon="add_box" className="text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                                    onClick={() => window.location.hash = `#/models/new?categoryId=${category.id}`}
                                >
                                    Ajouter
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2 -mx-2">
                            {models.length > 0 ? models.map(model => (
                                <button key={model.id} onClick={() => onSelectModel(model.id)} className="w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer">
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{model.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{model.brand}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-1">chevron_right</span>
                                </button>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="flex items-center justify-center size-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">category</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aucun modèle</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Ajoutez des modèles à cette catégorie</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="surface-card surface-card-gradient rounded-2xl p-6 shadow-[var(--shadow-elev-1)]">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex items-center justify-center size-10 rounded-xl bg-green-100 dark:bg-green-900/50">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-400">devices</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Équipement ({equipment.length})</h2>
                        </div>
                        <div className="space-y-2 -mx-2">
                             {equipment.length > 0 ? equipment.map(item => (
                                <button key={item.id} onClick={() => onSelectEquipment(item.id)} className="w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer">
                                    <div className="text-left flex-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{item.name || item.assetTag}</p>
                                        <div className="mt-1.5">
                                            <StatusBadge status={item.status} />
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-1">chevron_right</span>
                                </button>
                             )) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="flex items-center justify-center size-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">devices_other</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aucun équipement</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Les équipements de cette catégorie apparaîtront ici</p>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </main>
            
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    onDelete(category.id);
                    setIsDeleteModalOpen(false);
                }}
                title={`Supprimer "${category.name}"`}
                confirmButtonText="Supprimer"
            >
                <p>Êtes-vous sûr de vouloir supprimer cette catégorie ? Tous les modèles et équipements associés devront être réassignés.</p>
            </ConfirmationModal>
        </div>
    );
};

export default CategoryDetails;
