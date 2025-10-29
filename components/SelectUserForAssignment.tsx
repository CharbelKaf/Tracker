

import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import PageHeader, { ListItemCard } from './PageHeader';
import SmartSearchInput from './SmartSearchInput';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from '../contexts/ToastContext';

interface SelectUserForAssignmentProps {
    users: User[];
    onSelect: (userId: string) => void;
    onBack: () => void;
}
const SelectUserForAssignment: React.FC<SelectUserForAssignmentProps> = ({ users, onSelect, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [smartFilters, setSmartFilters] = useState<Record<string, any> | null>(null);
    const [isClearingSmartFilters, setIsClearingSmartFilters] = useState(false);
    const { addToast } = useToast();

    const sortedUsers = useMemo(() =>
        [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users]);

    const filteredUsers = useMemo(() => sortedUsers.filter(user => {
        const lowerCaseTerm = searchTerm.toLowerCase();
        const matchesSearchTerm = searchTerm === '' ||
            user.name.toLowerCase().includes(lowerCaseTerm);
        
        const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;

        return matchesSearchTerm && matchesDepartment;
    }), [sortedUsers, searchTerm, departmentFilter]);

    const handleNaturalLanguageSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setIsAiSearching(true);
        addToast('Gemini analyse votre recherche...', 'info');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
            const schema = {
                type: Type.OBJECT,
                properties: {
                    department: { type: Type.STRING, description: "Filter by user's department." },
                    searchTerm: { type: Type.STRING, description: "General keywords for the user's name." }
                }
            };
            const prompt = `Parse the user's query to find a user. Available departments: ${departments.join(', ')}. Query: "${searchTerm}"`;
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: schema },
            });
            const parsedFilters = JSON.parse(response.text.trim());
            handleClearSmartFiltersClick();
            setSmartFilters(parsedFilters);
            if (parsedFilters.searchTerm) setSearchTerm(parsedFilters.searchTerm);
            if (parsedFilters.department && departments.includes(parsedFilters.department as string)) {
                setDepartmentFilter(parsedFilters.department);
            }
            addToast('Filtres intelligents appliqués !', 'success');
        } catch (error) {
            console.error("Error with Gemini user search:", error);
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
        setDepartmentFilter('all');
    };

    const placeholderText = smartFilters
        ? "Filtres intelligents actifs. Tapez pour une nouvelle recherche."
        : "Rechercher ou demander à Gemini...";

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
            <PageHeader title="Attribuer à..." onBack={onBack} />
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
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <div key={user.id} className="h-20">
                         <ListItemCard
                            id={user.id}
                            imageUrl={user.avatarUrl}
                            imageShape="round"
                            title={user.name}
                            details={[{ icon: 'work', text: user.department || 'N/A' }]}
                            statusBadge={<span className="material-symbols-outlined text-gray-400 dark:text-gray-500">chevron_right</span>}
                            // FIX: Pass the onSelect function in a lambda to ensure correct type inference.
                            onCardClick={(id) => onSelect(id)}
                            fullHeight={true}
                        />
                    </div>
                )) : (
                     <div className="text-center py-10"><p className="text-gray-600 dark:text-gray-400">Aucun utilisateur trouvé.</p></div>
                )}
            </main>
        </div>
    );
};

export default SelectUserForAssignment;