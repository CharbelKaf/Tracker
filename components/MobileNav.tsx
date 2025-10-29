import React from 'react';
import { motion } from 'framer-motion';
import { UserRole } from '../types';

interface MobileNavProps {
    activeHash: string;
    showFullNav: boolean;
    role: UserRole;
    onMoreClick: () => void;
    pendingApprovalsCount?: number;
}

const adminNavItems = [
    { id: 'dashboard', icon: 'grid_view', label: 'Dashboard', hash: '#/dashboard' },
    { id: 'inventory', icon: 'devices', label: 'Équipement', hash: '#/inventory' },
    { id: 'users', icon: 'group', label: 'Utilisateurs', hash: '#/users' },
    { id: 'pending-approvals', icon: 'pending_actions', label: 'Approbations', hash: '#/pending-approvals' },
];

const managerNavItems = [
    { id: 'dashboard', icon: 'grid_view', label: 'Dashboard', hash: '#/dashboard' },
    { id: 'users', icon: 'group', label: 'Mon équipe', hash: '#/users' },
    { id: 'pending-approvals', icon: 'pending_actions', label: 'Approbations', hash: '#/pending-approvals' },
];

const moreNavItemsPaths = ['management', 'locations', 'audit', 'reports'];

const MobileNav: React.FC<MobileNavProps> = ({ activeHash, showFullNav, role, onMoreClick, pendingApprovalsCount = 0 }) => {
    const currentPath = activeHash.substring(1) || '/dashboard';
    const navItems = role === UserRole.ADMIN ? adminNavItems : managerNavItems;
    const hasMoreMenu = role === UserRole.ADMIN;

    const baseButtonClasses = 'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 rounded-[var(--radius-card)] transition-colors min-w-[72px] focus-visible:outline-none focus-visible:ring-0';
    const activeClasses = 'text-primary-700 dark:text-primary-200';
    const inactiveClasses = 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/70';
    const tapAnimation = { scale: 0.94 };
    const hoverAnimation = { scale: 1.02 };
    const buttonTransition = { type: 'spring' as const, stiffness: 320, damping: 22 };

    const isViewActive = (view: string) => {
        if (view === 'dashboard') return currentPath.startsWith('/dashboard') || currentPath === '/';
        if (view === 'inventory') return currentPath.startsWith('/inventory') || currentPath.startsWith('/categories') || currentPath.startsWith('/models');
        if (view === 'users') return currentPath.startsWith('/users');
        if (view === 'pending-approvals') return currentPath.startsWith('/pending-approvals');
        if (view === 'more') return moreNavItemsPaths.some(p => currentPath.startsWith(`/${p}`));
        return currentPath.startsWith(`/${view}`);
    };

    if (!showFullNav) {
        return (
            <motion.footer
                className="fixed bottom-0 left-0 right-0 z-10 lg:hidden"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            >
                <motion.div
                    className="flex items-stretch gap-1 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 px-2 py-2 backdrop-blur-sm shadow-[var(--shadow-elev-1)]"
                    layout
                >
                    <motion.button
                        onClick={() => window.location.hash = '#/dashboard'}
                        aria-label="Dashboard"
                        className={`${baseButtonClasses} ${isViewActive('dashboard') ? activeClasses : inactiveClasses}`}
                        whileTap={tapAnimation}
                        whileHover={hoverAnimation}
                        transition={buttonTransition}
                    >
                        <span className="material-symbols-outlined text-2xl">grid_view</span>
                        <span className="text-xs font-medium">Dashboard</span>
                    </motion.button>
                    <motion.button
                        onClick={() => window.location.hash = '#/pending-approvals'}
                        aria-label="Approbations"
                        className={`${baseButtonClasses} ${isViewActive('pending-approvals') ? activeClasses : inactiveClasses}`}
                        whileTap={tapAnimation}
                        whileHover={hoverAnimation}
                        transition={buttonTransition}
                    >
                        <span className="material-symbols-outlined text-2xl">pending_actions</span>
                        <span className="text-xs font-medium">Approbations</span>
                        {pendingApprovalsCount > 0 && (
                            <span className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5 min-w-[18px]">
                                {pendingApprovalsCount}
                            </span>
                        )}
                    </motion.button>
                </motion.div>
            </motion.footer>
        );
    }

    return (
        <motion.footer
            className="fixed bottom-0 left-0 right-0 z-10 lg:hidden"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        >
            <motion.div
                className="flex items-stretch gap-1 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/95 px-2 py-2 backdrop-blur-sm shadow-[var(--shadow-elev-1)]"
                layout
            >
                {navItems.map(item => (
                    <motion.button
                        key={item.id}
                        id={`mobile-nav-${item.id}`}
                        onClick={() => window.location.hash = item.hash}
                        aria-label={item.label}
                        className={`${baseButtonClasses} ${isViewActive(item.id) ? activeClasses : inactiveClasses}`}
                        whileTap={tapAnimation}
                        whileHover={hoverAnimation}
                        transition={buttonTransition}
                    >
                        <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        <span className="text-xs font-medium">{item.label}</span>
                        {item.id === 'pending-approvals' && pendingApprovalsCount > 0 && (
                            <span className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] px-1.5 py-0.5 min-w-[18px]">
                                {pendingApprovalsCount}
                            </span>
                        )}
                    </motion.button>
                ))}
                {hasMoreMenu && (
                    <motion.button
                        onClick={onMoreClick}
                        aria-label="Plus"
                        className={`${baseButtonClasses} ${isViewActive('more') ? activeClasses : inactiveClasses}`}
                        whileTap={tapAnimation}
                        whileHover={hoverAnimation}
                        transition={buttonTransition}
                    >
                        <span className="material-symbols-outlined text-2xl">more_horiz</span>
                        <span className="text-xs font-medium">Plus</span>
                    </motion.button>
                )}
            </motion.div>
        </motion.footer>
    );
};

export default MobileNav;
