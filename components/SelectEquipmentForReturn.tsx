

import React, { useState, useMemo } from 'react';
import type { Equipment, Assignment, Model, Category, User } from '../types';
import { EquipmentStatus, FormAction } from '../types';
import PageHeader, { ListItemCard } from './PageHeader';
import SmartSearchInput from './SmartSearchInput';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from '../contexts/ToastContext';

interface SelectEquipmentForReturnProps {
    equipment: Equipment[];
    assignments: Assignment[];
    models: Model[];
    categories: Category[];
    users: User[];
    onSelect: (equipmentId: string) => void;
    onBack: () => void;
}
const SelectEquipmentForReturn: React.FC<SelectEquipmentForReturnProps> = ({ equipment, assignments, models, categories, users, onSelect, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [assignedToFilter, setAssignedToFilter] = useState('all');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [smartFilters, setSmartFilters] = useState<Record<string, any> | null>(null);
    const [isClearingSmartFilters, setIsClearingSmartFilters] = useState(false);
    const { addToast } = useToast();

    const equipmentWithDetails = useMemo(() => {
        const latestAssignments = new Map<string, Assignment>();
        for (const assignment of assignments) {
            const existing = latestAssignments.get(assignment.equipmentId);
            if (!existing || new Date(assignment.date) > new Date(existing.date)) {
                latestAssignments.set(assignment.equipmentId, assignment);
            }
        }
        const userMap = new Map(users.map(u => [u.id, u.name]));

        return equipment
            .filter(e => e.status === EquipmentStatus.ASSIGNED)
            .map(item => {
                const model = models.find(m => m.id === item.modelId);
                const category = model ? categories.find(c => c.id === model.categoryId) : null;
                const lastAssignment = latestAssignments.get(item.id);
                const assignedTo = (lastAssignment && lastAssignment.action === FormAction.ASSIGN) ? userMap.get(lastAssignment.userId) : undefined;
                return { ...item, model, category, assignedTo };
            }).filter((item): item is typeof item & { assignedTo: string } => !!item.assignedTo); 

    }, [equipment, assignments, models, categories, users]);

    const filteredEquipment = useMemo(() => equipmentWithDetails.filter(item => {
        const lowerCaseTerm = searchTerm.toLowerCase();
        const matchesSearchTerm = searchTerm === '' ||
            item.assetTag.toLowerCase().includes(lowerCaseTerm) ||
            (item.model && item.model.name.toLowerCase().includes(lowerCaseTerm));
            
        const matchesCategory = categoryFilter === 'all' || (item.category && item.category.id === categoryFilter);

        const matchesAssignedTo = assignedToFilter === 'all' || 
            (item.assignedTo && item.assignedTo.toLowerCase().includes(assignedToFilter.toLowerCase()));

        return matchesSearchTerm && matchesCategory && matchesAssignedTo;
    }), [equipmentWithDetails, searchTerm, categoryFilter, assignedToFilter]);

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
                    assignedTo: { type: Type.STRING, description: "Filter by the name of the assigned user." },
                    searchTerm: { type: Type.STRING, description: "General keywords, model names, or asset tags from the query." }
                }
            };
            const prompt = `You are a search query parser for an IT asset management app. The user is looking for an ASSIGNED piece of equipment to return. Parse their query into a structured JSON object. Available categories: ${categories.map(c => c.name).join(', ')}. Assigned users: ${users.map(u => u.name).join(', ')}. Query: "${searchTerm}"`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });

            const parsedFilters = JSON.parse(response.text.trim());
            handleClearSmartFiltersClick();
            setSmartFilters(parsedFilters);
            if (parsedFilters.searchTerm) setSearchTerm(parsedFilters.searchTerm);
            if (parsedFilters.assignedTo) setAssignedToFilter(parsedFilters.assignedTo);
            if (parsedFilters.category) {
                const foundCategory = categories.find(c => c.name.toLowerCase() === parsedFilters.category.toLowerCase());
                if (foundCategory) setCategoryFilter(foundCategory.id);
            }
            addToast('Filtres intelligents appliqués !', 'success');
        } catch (error) {
            console.error("Error with Gemini search:", error);
            addToast("Désolé, je n'ai pas pu traiter cette recherche.", 'error');
        } finally {
            setIsAiSearching(false);
        }
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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        clearSmartFiltersWithAnimation();
    };

    const handleClearSmartFiltersClick = () => {
        setSmartFilters(null);
        setSearchTerm('');
        setCategoryFilter('all');
        setAssignedToFilter('all');
    };
    
    const placeholderText = smartFilters
        ? "Filtres intelligents actifs. Tapez pour une nouvelle recherche."
        : "Rechercher ou demander à Gemini...";

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            <PageHeader title="Retourner un équipement" onBack={onBack} />
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
                <div className={`px-4 pb-2 flex flex-wrap gap-2 items-center flex-shrink-0 ${isClearingSmartFilters ? 'animate-shake-and-fade-out' : 'animate-fade-in'}`}>
                    {Object.entries(smartFilters).map(([key, value]) => value && (
                        <div key={key} className="flex items-center gap-1.5 rounded-full bg-primary-100 dark:bg-primary-500/20 px-2.5 py-1 text-xs font-medium text-primary-900 dark:text-primary-300">
                            <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                            <span>{`${key}: ${value}`}</span>
                        </div>
                    ))}
                    <button 
                        onClick={handleClearSmartFiltersClick} 
                        className="flex items-center gap-1 rounded-full bg-gray-200 dark:bg-gray-700 px-2.5 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        title="Effacer les filtres intelligents"
                    >
                        <span className="material-symbols-outlined !text-sm">close</span>
                        <span>Effacer</span>
                    </button>
                </div>
            )}
            <main className="flex-1 overflow-y-auto p-4 pt-0 pb-24 space-y-2">
                 {filteredEquipment.length > 0 ? filteredEquipment.map(item => (
                    <div key={item.id} className="h-20">
                         <ListItemCard
                            id={item.id}
                            imageUrl={item.model?.imageUrl}
                            title={item.model?.name}
                            details={[
                                { icon: 'tag', text: item.assetTag },
                                { icon: 'person', text: <>Attribué à: <span className="font-medium">{item.assignedTo}</span></> }
                            ]}
                            statusBadge={<span className="material-symbols-outlined text-gray-400 dark:text-gray-500">chevron_right</span>}
                            // FIX: Pass the onSelect function in a lambda to ensure correct type inference.
                            onCardClick={(id) => onSelect(id)}
                            fullHeight={true}
                        />
                    </div>
                )) : (
                     <div className="text-center py-10"><p className="text-gray-600 dark:text-gray-400">Aucun équipement trouvé.</p></div>
                )}
            </main>
        </div>
    );
};

export default SelectEquipmentForReturn;