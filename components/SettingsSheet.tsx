import React from 'react';
import type { User } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import Sheet, { SheetItem, SectionHeader } from './Sheet';

interface SettingsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    onLogout: () => void;
}


const SettingsSheet: React.FC<SettingsSheetProps> = ({ isOpen, onClose, currentUser, onLogout }) => {
    const { theme, setTheme } = useTheme();
    const isDarkTheme = theme === 'dark';

    const handleNavigate = (hash: string) => {
        window.location.hash = hash;
        onClose();
    };

    const toggleTheme = () => {
        setTheme(isDarkTheme ? 'light' : 'dark');
    };

    return (
        <Sheet isOpen={isOpen} onClose={onClose} title="Paramètres">
            {/* Section: Général */}
            <SectionHeader title="Général" />
            <div className="bg-white dark:bg-gray-800">
                <SheetItem 
                    icon="dark_mode" 
                    label="Apparence" 
                    rightElement={
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {isDarkTheme ? 'Sombre' : 'Clair'}
                            </span>
                            <div
                                role="switch"
                                aria-checked={isDarkTheme}
                                tabIndex={0}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    toggleTheme();
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        toggleTheme();
                                    }
                                }}
                                className={`relative flex h-6 w-12 cursor-pointer items-center rounded-full transition-colors duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 ${isDarkTheme ? 'bg-secondary-600 dark:bg-secondary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span
                                    className={`absolute left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-out ${isDarkTheme ? 'translate-x-6' : 'translate-x-0'}`}
                                />
                            </div>
                        </div>
                    }
                />
                <SheetItem icon="storage" label="Données et stockage" onClick={() => handleNavigate('#/settings/data')} />
            </div>

            {/* Section: Compte */}
            <SectionHeader title="Compte" />
            <div className="bg-white dark:bg-gray-800">
                <SheetItem 
                    icon="account_circle" 
                    label="Profil" 
                    onClick={() => handleNavigate('#/profile')} 
                />
                <SheetItem icon="security" label="Confidentialité" onClick={() => {}} />
            </div>

            {/* Section: Aide */}
            <SectionHeader title="Aide" />
            <div className="bg-white dark:bg-gray-800">
                <SheetItem icon="help" label="Aide et commentaires" onClick={() => handleNavigate('#/settings/help')} />
                <SheetItem 
                    icon="lightbulb" 
                    label="Nouveautés" 
                    onClick={() => handleNavigate('#/settings/whats-new')} 
                    badge 
                />
                <SheetItem icon="info" label="À propos" onClick={() => handleNavigate('#/settings/about')} />
            </div>

            {/* Section: Déconnexion */}
            <div className="mt-4 bg-white dark:bg-gray-800">
                <SheetItem 
                    icon="logout" 
                    label="Se déconnecter" 
                    onClick={() => {
                        onLogout();
                        onClose();
                    }}
                    isDestructive
                />
            </div>
        </Sheet>
    );
};

export default SettingsSheet;