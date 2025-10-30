import React from 'react';
import { UserRole } from '../types';
import { useFocusTrap } from './hooks/useFocusTrap';

interface MoreMenuSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (hash: string) => void;
    role: UserRole;
}

const adminNavItems = [
    { hash: '#/management', label: 'Gestion', icon: 'category' },
    { hash: '#/locations', label: 'Emplacements', icon: 'pin_drop' },
    { hash: '#/audit', label: 'Audit', icon: 'checklist' },
    { hash: '#/reports', label: 'Rapports', icon: 'summarize' },
];

const managerNavItems: typeof adminNavItems = [];

const MoreMenuSheet: React.FC<MoreMenuSheetProps> = ({ isOpen, onClose, onNavigate, role }) => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);
    const navItems = role === UserRole.ADMIN ? adminNavItems : managerNavItems;

    if (!isOpen || navItems.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-menu-title"
        >
            <div
                ref={modalRef}
                className="surface-card surface-card-gradient rounded-t-3xl w-full pb-6 animate-slide-up shadow-2xl border-t-2 border-white/60 dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center py-4">
                    <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary-300 via-primary-400 to-primary-300 dark:from-primary-700 dark:via-primary-600 dark:to-primary-700 shadow-sm"></div>
                </div>
                <h2 id="more-menu-title" className="text-xl font-bold text-white text-center mb-6 tracking-tight">
                    Plus d'options
                </h2>
                <div className="grid grid-cols-4 gap-3 px-6">
                    {navItems.map((item) => (
                        <button
                            key={item.hash}
                            onClick={() => { onNavigate(item.hash); onClose(); }}
                            className="flex flex-col items-center justify-center p-2 rounded-xl min-h-[84px] transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-3xl text-white mb-2 drop-shadow-lg">{item.icon}</span>
                            <span className="text-xs font-semibold text-center text-white drop-shadow-md">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MoreMenuSheet;
