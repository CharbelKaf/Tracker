
import React from 'react';
import type { Category } from '../types';

interface EquipmentCategoriesProps {
    categories: Category[];
    onViewCategory: (categoryId: string) => void;
}

const CategoryIcon: React.FC<{ iconName?: string }> = ({ iconName }) => {
    return <span className="material-symbols-outlined">{iconName || 'device_unknown'}</span>;
};


const EquipmentCategories: React.FC<EquipmentCategoriesProps> = ({ categories, onViewCategory }) => {
    return (
        <div className="px-4 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-4">Catégories</h2>
            <div className="space-y-3">
                {categories.map(category => (
                    <button 
                        key={category.id} 
                        type="button"
                        onClick={() => onViewCategory(category.id)}
                        className="w-full flex items-center gap-4 surface-card surface-card-gradient p-4 cursor-pointer transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400"
                    >
                        <div className="flex items-center justify-center rounded-lg bg-secondary-100/90 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-200 shrink-0 size-12">
                            <CategoryIcon iconName={category.icon} />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-gray-900 dark:text-gray-100 text-base font-medium">{category.name}</p>
                        </div>
                        <div className="flex items-center justify-center size-8 rounded-full text-secondary-500 dark:text-secondary-200 transition-transform group-hover:translate-x-1">
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EquipmentCategories;
