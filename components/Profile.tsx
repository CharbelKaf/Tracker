

import React from 'react';
import type { User } from '../types';
import PageHeader from './PageHeader';

interface ProfileProps {
    currentUser: User;
    onBack: () => void;
    onEdit: (userId: string) => void;
    onLogout: () => void;
    onManagePassword: (userId: string) => void;
    onManagePin: (userId: string) => void;
}

const SecurityItem: React.FC<{ icon: string; title: string; description: string; buttonLabel: string; onClick: () => void; }> = ({ icon, title, description, buttonLabel, onClick }) => (
    <div className="flex items-center gap-4">
        <div className="flex items-center justify-center size-12 rounded-full bg-gray-100 dark:bg-gray-700">
            <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-gray-300">{icon}</span>
        </div>
        <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <button onClick={onClick} className="rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
            {buttonLabel}
        </button>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ currentUser, onBack, onEdit, onLogout, onManagePassword, onManagePin }) => {
    const hasPassword = !!currentUser.password;

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            <PageHeader title="Mon Profil" onBack={onBack} />

            <main className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full pb-24">
                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <img 
                            src={currentUser.avatarUrl} 
                            alt={`Avatar de ${currentUser.name}`}
                            className="h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-700" 
                        />
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentUser.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                            <div className="mt-2 flex items-center justify-center sm:justify-start gap-4 text-sm text-gray-600 dark:text-gray-300">
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">work</span> {currentUser.department}</span>
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">badge</span> {currentUser.role}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onEdit(currentUser.id)} 
                            className="flex items-center justify-center gap-2 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            <span className="material-symbols-outlined text-base">edit</span>
                            Modifier
                        </button>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Sécurité</h3>
                    <div className="space-y-4">
                        <SecurityItem 
                            icon="password"
                            title="Mot de passe"
                            description={hasPassword ? "Votre mot de passe est défini." : "Configurez un mot de passe pour votre compte."}
                            buttonLabel={hasPassword ? "Modifier" : "Créer"}
                            onClick={() => onManagePassword(currentUser.id)}
                        />
                    </div>
                </div>

                {/* Logout */}
                <div className="pt-4">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 rounded-lg h-12 px-4 text-base font-semibold bg-white dark:bg-gray-800 text-status-danger-700 dark:text-status-danger-400 border border-gray-200 dark:border-gray-700 hover:bg-status-danger-50 dark:hover:bg-status-danger-900/30 shadow-sm"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Se déconnecter
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Profile;