import React from 'react';
import type { User } from '../types';

interface UserProfileHeaderProps {
    user: User;
    onEdit?: (userId: string) => void;
    showEditButton?: boolean;
    compact?: boolean;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ user, onEdit, showEditButton, compact = false }) => {
    if (compact) {
        return (
            <div className="flex items-center gap-4">
                <img 
                    src={user.avatarUrl} 
                    alt={`Avatar de ${user.name}`}
                    className="h-12 w-12 rounded-full object-cover" 
                />
                <div>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold leading-tight">
                        {user.name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                        {user.email}
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center gap-4 text-center py-6">
            <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 border-4 border-gray-100 dark:border-gray-900 shadow-lg" 
                style={{ backgroundImage: `url("${user.avatarUrl}")` }} 
                role="img" 
                aria-label={`Avatar de ${user.name}`}
            />
            <div className="text-center">
                <p className="text-gray-900 dark:text-gray-100 text-2xl font-bold leading-tight">
                    {user.name}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                    {user.email}
                </p>
            </div>
            {showEditButton && onEdit && (
                <button 
                    onClick={() => onEdit(user.id)} 
                    className="mt-2 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Modifier le profil
                </button>
            )}
        </div>
    );
};

export default UserProfileHeader;