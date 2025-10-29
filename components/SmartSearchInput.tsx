
import React from 'react';
import Tooltip from './Tooltip';

interface SmartSearchInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    placeholder: string;
    isSearching: boolean;
    showAiButton?: boolean;
    formClassName?: string;
}

const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
    value,
    onChange,
    onSubmit,
    placeholder,
    isSearching,
    showAiButton = true,
    formClassName,
}) => {
    return (
        <form onSubmit={onSubmit} className={formClassName || "flex-1"}>
            <label className="relative flex h-12 w-full items-center">
                <span className="material-symbols-outlined absolute left-4 text-gray-500 dark:text-gray-400">search</span>
                <input
                    className="form-input w-full rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 pl-12 pr-12 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={placeholder}
                    type="search"
                    value={value}
                    onChange={onChange}
                />
                {showAiButton && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Tooltip content="Posez une question en langage naturel." align="right">
                            <button type="submit" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-800 dark:text-primary-300 transition-colors hover:bg-primary-200 dark:hover:bg-primary-500/30" aria-label="Lancer la recherche intelligente avec Gemini">
                                {isSearching ? (
                                    <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
                                ) : (
                                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                )}
            </label>
        </form>
    );
};

export default SmartSearchInput;
