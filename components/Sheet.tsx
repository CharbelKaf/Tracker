import React, { useRef, ReactNode } from 'react';
import { useFocusTrap } from './hooks/useFocusTrap';

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

interface SheetItemProps {
    icon: string;
    label: string;
    onClick?: () => void;
    rightElement?: ReactNode;
    badge?: boolean;
    isDestructive?: boolean;
}

interface SectionHeaderProps {
    title: string;
}

export const SheetItem: React.FC<SheetItemProps> = ({ 
    icon, 
    label, 
    onClick, 
    rightElement, 
    badge, 
    isDestructive 
}) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors ${
            isDestructive ? 'text-status-danger-600 dark:text-status-danger-400' : 'text-gray-900 dark:text-gray-100'
        }`}
    >
        <span className={`material-symbols-outlined text-2xl ${isDestructive ? '' : 'text-gray-600 dark:text-gray-400'}`}>
            {icon}
        </span>
        <span className="flex-1 text-left text-base">{label}</span>
        {badge && <span className="size-2 rounded-full bg-primary-500"></span>}
        {rightElement}
        {onClick && !rightElement && (
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">chevron_right</span>
        )}
    </button>
);

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
    <h2 className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {title}
    </h2>
);

const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
            style={{animationDuration: '150ms'}}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
        >
            <div
                ref={modalRef}
                className="h-full w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg md:max-w-lg md:mx-auto md:mt-16 md:rounded-xl md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/60 dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex items-center gap-3 h-14 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="flex size-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" 
                        aria-label="Retour"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 id="sheet-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                </header>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Sheet;
