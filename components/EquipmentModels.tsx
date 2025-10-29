import React, { useState, useMemo } from 'react';
import type { Equipment, Model, Category } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from '../contexts/ToastContext';
import SmartSearchInput from './SmartSearchInput';

interface EquipmentModelsProps {
    equipment: Equipment[];
    models: Model[];
    categories: Category[];
    onSelectModel: (modelId: string) => void;
}

const EquipmentModels: React.FC<EquipmentModelsProps> = ({ equipment, models, categories, onSelectModel }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [smartFilters, setSmartFilters] = useState<Record<string, any> | null>(null);
    const [isClearingSmartFilters, setIsClearingSmartFilters] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [brandFilter, setBrandFilter] = useState('all');
    const { addToast } = useToast();

    const modelsWithCount = useMemo(() => {
        const equipmentCounts = equipment.reduce((acc, item) => {
            acc[item.modelId] = (acc[item.modelId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return models.map(model => ({
            ...model,
            category: categories.find(c => c.id === model.categoryId),
            count: equipmentCounts[model.id] || 0,
        })).filter(m => m.count > 0).sort((a,b) => a.name.localeCompare(b.name));

    }, [equipment, models, categories]);

    const handleClearSmartFiltersClick = () => {
        setSmartFilters(null);
        setSearchTerm('');
        setCategoryFilter('all');
        setBrandFilter('all');
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
                    category: { type: Type.STRING, description: "Filter by equipment category name." },
                    brand: { type: Type.STRING, description: "Filter by brand name." },
                    searchTerm: { type: Type.STRING, description: "General keywords for the model name." }
                }
            };

            const brands = Array.from(new Set(models.map(m => m.brand))).join(', ');
            const prompt = `You are an expert search query parser for an IT asset management application. Your task is to translate the user's natural language query into a structured JSON object of filters for a list of equipment models.

            Here are the available filter options:
            - Categories: ${categories.map(c => c.name).join(', ')}
            - Brands: ${brands}

            Analyze the user's query: "${searchTerm}"

            Based on the query, populate the JSON schema. If a field is not mentioned, omit it. For 'searchTerm', include any keywords that look like a model's name.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });

            const parsedFilters = JSON.parse(response.text.trim());
            
            handleClearSmartFiltersClick();
            
            setSmartFilters(parsedFilters);
            if (parsedFilters.searchTerm) setSearchTerm(parsedFilters.searchTerm);
            if (parsedFilters.brand) setBrandFilter(parsedFilters.brand);
            if (parsedFilters.category) {
                const foundCategory = categories.find(c => c.name.toLowerCase() === parsedFilters.category.toLowerCase());
                if (foundCategory) setCategoryFilter(foundCategory.id);
            }
            
            addToast('Filtres intelligents appliqués !', 'success');
        } catch (error) {
            console.error("Error with Gemini model search:", error);
            addToast("Désolé, je n'ai pas pu traiter cette recherche.", 'error');
        } finally {
            setIsAiSearching(false);
        }
    };

    const filteredModels = useMemo(() => {
        return modelsWithCount.filter(model => {
            const lowerCaseSearch = searchTerm.toLowerCase();
            const lowerCaseBrand = brandFilter.toLowerCase();

            const matchesSearch = searchTerm === '' ||
                model.name.toLowerCase().includes(lowerCaseSearch) ||
                (model.category && model.category.name.toLowerCase().includes(lowerCaseSearch));
            
            const matchesCategory = categoryFilter === 'all' || model.categoryId === categoryFilter;

            const matchesBrand = brandFilter === 'all' || model.brand.toLowerCase().includes(lowerCaseBrand);

            return matchesSearch && matchesCategory && matchesBrand;
        });
    }, [modelsWithCount, searchTerm, categoryFilter, brandFilter]);

    const placeholderText = smartFilters
        ? "Filtres intelligents actifs. Tapez pour une nouvelle recherche."
        : "Rechercher des modèles ou demander à Gemini...";

    const brands = useMemo(() => Array.from(new Set(models.map(m => m.brand))).sort(), [models]);

    return (
        <div className="p-4">
            <div className="mb-4">
                <SmartSearchInput
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onSubmit={handleNaturalLanguageSearch}
                    placeholder={placeholderText}
                    isSearching={isAiSearching}
                />
            </div>

            {smartFilters && (
                <div className={`pb-4 flex flex-wrap gap-2 items-center ${isClearingSmartFilters ? 'animate-shake-and-fade-out' : 'animate-fade-in'}`}>
                    {Object.entries(smartFilters).map(([key, value]) => value && (
                        <div key={key} className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-900">
                            <span>{`${key}: ${value}`}</span>
                        </div>
                    ))}
                    <button onClick={handleClearSmartFiltersClick} className="text-xs text-gray-500 hover:underline">Effacer</button>
                </div>
            )}
            
            <div className="flex gap-3 pb-4 overflow-x-auto">
                 <div className="relative">
                    <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); handleManualFilterChange(); }} className="shrink-0 appearance-none rounded-md border border-secondary-200 dark:border-secondary-700 bg-white/90 dark:bg-secondary-900/60 py-2 pl-4 pr-10 text-sm font-medium text-secondary-700 dark:text-secondary-100 focus:border-primary-500 focus:ring-primary-500 cursor-pointer shadow-[var(--shadow-elev-1)]">
                         <option value="all">Toutes les catégories</option>
                         {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                     </select>
                     <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500 dark:text-secondary-200 !text-base">expand_more</span>
                 </div>
                 <div className="relative">
                    <select value={brandFilter} onChange={e => { setBrandFilter(e.target.value); handleManualFilterChange(); }} className="shrink-0 appearance-none rounded-md border border-secondary-200 dark:border-secondary-700 bg-white/90 dark:bg-secondary-900/60 py-2 pl-4 pr-10 text-sm font-medium text-secondary-700 dark:text-secondary-100 focus:border-primary-500 focus:ring-primary-500 cursor-pointer shadow-[var(--shadow-elev-1)]">
                         <option value="all">Toutes les marques</option>
                         {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                     </select>
                     <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary-500 dark:text-secondary-200 !text-base">expand_more</span>
                 </div>
            </div>

            <div className="space-y-3">
                {filteredModels.length > 0 ? filteredModels.map(modelData => (
                    <button key={modelData.id} type="button" onClick={() => onSelectModel(modelData.id)} className="group w-full flex items-center gap-4 surface-card surface-card-gradient p-4 rounded-xl transition-transform hover:-translate-y-0.5 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16 shrink-0 ring-1 ring-secondary-200/60 dark:ring-secondary-800/60" style={{ backgroundImage: `url('${modelData.imageUrl || 'https://placehold.co/64x64/e2e8f0/a0aec0/png'}')` }}></div>
                        <div className="flex-1 text-left">
                            <p className="text-gray-900 dark:text-gray-100 text-base font-semibold">{modelData.name}</p>
                            <p className="text-secondary-600 dark:text-secondary-200 text-sm">{modelData.category?.name}</p>
                        </div>
                        <div className="text-center pr-2">
                             <p className="text-primary-600 dark:text-primary-300 text-xl font-semibold">{modelData.count}</p>
                             <p className="text-secondary-500 dark:text-secondary-200 text-xs uppercase tracking-wide">Unités</p>
                        </div>
                        <span className="material-symbols-outlined p-2 text-secondary-500 dark:text-secondary-200 transition-transform group-hover:translate-x-1">chevron_right</span>
                    </button>
                )) : (
                    <div className="text-center py-10">
                        <p className="text-gray-600 dark:text-gray-400">Aucun modèle trouvé.</p>
                        <p className="text-gray-500 text-sm">Essayez d'ajuster votre recherche.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EquipmentModels;