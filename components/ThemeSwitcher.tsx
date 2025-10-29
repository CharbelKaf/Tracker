
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Tooltip from './Tooltip';

const ThemeSwitcher: React.FC<{ isCollapsed: boolean }> = ({ isCollapsed }) => {
    const { theme, setTheme, toggleTheme } = useTheme();

    const options = [
        { name: 'light', label: 'Clair', icon: 'light_mode' },
        { name: 'dark', label: 'Sombre', icon: 'dark_mode' },
    ] as const;

    if (isCollapsed) {
        const isDark = theme === 'dark';
        return (
            <div className="px-4 py-2">
                 <Tooltip content={`Passer au thème ${isDark ? 'clair' : 'sombre'}`} align="right">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center w-full h-10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label={`Passer au thème ${isDark ? 'clair' : 'sombre'}`}
                    >
                        <span className="material-symbols-outlined">{isDark ? 'dark_mode' : 'light_mode'}</span>
                    </button>
                 </Tooltip>
            </div>
        );
    }

    return (
        <div className="px-4 py-2">
            <div className="flex items-center p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
                {options.map(option => (
                    <button
                        key={option.name}
                        onClick={() => setTheme(option.name)}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-sm transition-colors ${
                            theme === option.name
                                ? 'bg-white dark:bg-gray-800 text-primary-800 dark:text-primary-300 shadow-sm font-semibold'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                        aria-pressed={theme === option.name}
                    >
                        <span className="material-symbols-outlined !text-base">{option.icon}</span>
                        <span>{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemeSwitcher;
