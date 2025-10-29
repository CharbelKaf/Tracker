import React, { useState } from 'react';
import type { Model, Category, Equipment, Assignment, User } from '../types';
import { UserRole, FormAction, EquipmentStatus } from '../types';
import PageHeader, { PageHeaderActions } from './PageHeader';
import { ConfirmationModal } from './Modals';
import Button from './ui/Button';

interface ModelDetailsProps {
    model: Model;
    category: Category;
    equipmentItems: Equipment[];
    assignments: Assignment[];
    users: User[];
    currentUser: User;
    onBack: () => void;
    onEdit: (modelId: string) => void;
    onDelete: (modelId: string) => void;
    onSelectEquipment: (equipmentId: string) => void;
}

const ModelDetails: React.FC<ModelDetailsProps> = ({ model, category, equipmentItems, assignments, users, currentUser, onBack, onEdit, onDelete, onSelectEquipment }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const modelActions = [
        { label: 'Modifier', icon: 'edit', onClick: () => onEdit(model.id) },
        { label: 'Supprimer', icon: 'delete', onClick: () => setIsDeleteModalOpen(true), isDestructive: true },
    ];

    const latestAssignments = new Map<string, Assignment>();
    for (const assignment of assignments) {
        const existing = latestAssignments.get(assignment.equipmentId);
        if (!existing || new Date(assignment.date) > new Date(existing.date)) {
            latestAssignments.set(assignment.equipmentId, assignment);
        }
    }
    
    const getAssignedUser = (equipmentId: string): string => {
        const lastAssignment = latestAssignments.get(equipmentId);
        const equipmentItem = equipmentItems.find(e => e.id === equipmentId);
        
        if (lastAssignment && lastAssignment.action === FormAction.ASSIGN && equipmentItem?.status === EquipmentStatus.ASSIGNED) {
             const user = users.find(u => u.id === lastAssignment.userId);
             return `Attribué à: ${user?.name || 'Utilisateur inconnu'}`;
        }
        return 'Disponible';
    };

    const availableCount = equipmentItems.filter(e => e.status === EquipmentStatus.AVAILABLE).length;
    const assignedCount = equipmentItems.filter(e => e.status === EquipmentStatus.ASSIGNED).length;
    const totalCount = equipmentItems.length;


    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <PageHeader title={model.name} onBack={onBack}>
                {currentUser.role === UserRole.ADMIN && <PageHeaderActions actions={modelActions} />}
            </PageHeader>
            <main className="flex-1 overflow-y-auto pb-24 md:pb-4">
                <div className="relative overflow-hidden">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                        <img alt={model.name} className="h-full w-full object-cover" src={model.imageUrl || 'https://placehold.co/600x400/e2e8f0/a0aec0/png'} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-[2px]"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <button onClick={() => category && (window.location.hash = `#/categories/${category.id}`)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white transition-colors mb-2">
                            <span>{model.brand}</span>
                            <span className="text-white/60">•</span>
                            <span className="hover:underline">{category.name}</span>
                        </button>
                        <h1 className="text-3xl font-bold text-white drop-shadow-lg">{model.name}</h1>
                    </div>
                </div>

                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div className="surface-card surface-card-gradient rounded-2xl p-5 shadow-[var(--shadow-elev-1)] flex items-center gap-4 transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <div className="flex items-center justify-center size-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800/50 shadow-sm"><span className="material-symbols-outlined text-3xl text-gray-600 dark:text-gray-300">inventory</span></div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
                            </div>
                        </div>
                        <div className="surface-card surface-card-gradient rounded-2xl p-5 shadow-[var(--shadow-elev-1)] flex items-center gap-4 transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <div className="flex items-center justify-center size-14 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/50 dark:to-green-800/30 shadow-sm"><span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-300">check_circle</span></div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Disponibles</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{availableCount}</p>
                            </div>
                        </div>
                         <div className="surface-card surface-card-gradient rounded-2xl p-5 shadow-[var(--shadow-elev-1)] flex items-center gap-4 transition-all duration-300 hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5">
                            <div className="flex items-center justify-center size-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-800/30 shadow-sm"><span className="material-symbols-outlined text-3xl text-primary-600 dark:text-primary-300">person</span></div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Attribués</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{assignedCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 px-4">
                    {model.specifications && (
                        <div className="surface-card surface-card-gradient rounded-2xl p-6 shadow-[var(--shadow-elev-1)]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center justify-center size-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/50">
                                    <span className="material-symbols-outlined text-secondary-600 dark:text-secondary-400">description</span>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Spécifications</h2>
                            </div>
                            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{model.specifications}</p>
                        </div>
                    )}
                    
                    <div className="surface-card surface-card-gradient rounded-2xl p-6 shadow-[var(--shadow-elev-1)]">
                       <div className="flex items-center justify-between mb-5">
                           <div className="flex items-center gap-3">
                               <div className="flex items-center justify-center size-10 rounded-xl bg-primary-100 dark:bg-primary-900/50">
                                   <span className="material-symbols-outlined text-primary-600 dark:text-primary-400">devices</span>
                               </div>
                               <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Articles d'équipement ({equipmentItems.length})</h2>
                           </div>
                           {currentUser.role === UserRole.ADMIN && (
                                <Button variant="ghost" size="sm" icon="add" className="text-primary-700 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                                    onClick={() => window.location.hash = `#/equipment/new?modelId=${model.id}`}
                                >
                                    Ajouter
                                </Button>
                            )}
                       </div>
                       <div className="space-y-2 -mx-2">
                            {equipmentItems.length > 0 ? equipmentItems.map(item => (
                                <button key={item.id} onClick={() => onSelectEquipment(item.id)} className="w-full group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/50 dark:to-primary-800/30 shadow-sm transition-transform duration-300 group-hover:scale-105">
                                        <span className="material-symbols-outlined text-2xl text-primary-600 dark:text-primary-400">{category.icon || 'devices'}</span>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">N/S: {item.assetTag}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{getAssignedUser(item.id)}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-1">chevron_right</span>
                                </button>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="flex items-center justify-center size-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">inventory_2</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aucun article</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Ajoutez des équipements de ce modèle</p>
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
                    onDelete(model.id);
                    setIsDeleteModalOpen(false);
                }}
                title={`Supprimer "${model.name}"`}
                confirmButtonText="Supprimer"
            >
                <p>Êtes-vous sûr de vouloir supprimer ce modèle ? Tous les équipements associés devront être réassignés.</p>
            </ConfirmationModal>
        </div>
    );
};

export default ModelDetails;
