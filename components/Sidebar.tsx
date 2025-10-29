

import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import Tooltip from './Tooltip';

interface SidebarProps {
  currentUser: User;
  activeHash: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  pendingApprovalsCount?: number;
}

interface NavLinkProps {
    icon: string;
    label: string;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: () => void;
    id?: string;
    badgeCount?: number;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, isActive, isCollapsed, onClick, id, badgeCount }) => (
    <Tooltip content={label} align="right" disabled={!isCollapsed}>
        <button 
            id={id}
            onClick={onClick} 
            className={`flex items-center w-full px-4 py-3 text-left rounded-lg text-sm font-semibold transition-colors ${
                isActive 
                ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-900 dark:text-primary-300' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
            } ${isCollapsed ? 'justify-center' : ''}`}
            aria-label={label}
        >
            <span className={`material-symbols-outlined pointer-events-none ${!isCollapsed ? 'mr-3' : ''}`}>{icon}</span>
            {!isCollapsed && (
                <span className="pointer-events-none transition-opacity duration-200 whitespace-nowrap flex-1 flex items-center">
                    {label}
                </span>
            )}
            {!isCollapsed && !!badgeCount && badgeCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] px-2 py-0.5 min-w-[20px]">
                    {badgeCount}
                </span>
            )}
        </button>
    </Tooltip>
);

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeHash, isCollapsed, onToggle, onOpenSettings, onLogout, pendingApprovalsCount = 0 }) => {
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isManager = currentUser.role === UserRole.MANAGER;
    const currentPath = activeHash.substring(1) || '/dashboard';
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);


    return (
        <aside className={`hidden lg:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <button 
                onClick={onToggle} 
                className={`flex items-center w-full h-16 flex-shrink-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}
                aria-label={isCollapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
            >
                {!isCollapsed && (
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-opacity duration-200 whitespace-nowrap truncate">
                        Neemba Tracker
                    </h1>
                )}
                <span className="material-symbols-outlined text-gray-500 transition-transform duration-300">
                    {isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
                </span>
            </button>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                <NavLink icon="grid_view" label="Dashboard" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/dashboard') || currentPath === '/'} onClick={() => window.location.hash = '#/dashboard'} />
                {isAdmin && (
                    <>
                        <NavLink id="nav-equipment" icon="devices" label="Équipement" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/inventory') || currentPath.startsWith('/categories') || currentPath.startsWith('/models')} onClick={() => window.location.hash = '#/inventory'} />
                        <NavLink id="nav-users" icon="group" label="Utilisateurs" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/users')} onClick={() => window.location.hash = '#/users'} />
                        <NavLink id="nav-approvals" icon="pending_actions" label="Approbations" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/pending-approvals')} onClick={() => window.location.hash = '#/pending-approvals'} badgeCount={pendingApprovalsCount} />
                        <NavLink id="nav-management" icon="category" label="Gestion" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/management')} onClick={() => window.location.hash = '#/management'} />
                        <NavLink id="nav-locations" icon="pin_drop" label="Emplacements" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/locations')} onClick={() => window.location.hash = '#/locations'} />
                        <NavLink id="nav-audit" icon="checklist" label="Audit" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/audit')} onClick={() => window.location.hash = '#/audit'} />
                        <NavLink id="nav-reports" icon="summarize" label="Rapports" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/reports')} onClick={() => window.location.hash = '#/reports'} />
                    </>
                )}
                {isManager && (
                    <>
                        <NavLink id="nav-team" icon="group" label="Mon équipe" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/users')} onClick={() => window.location.hash = '#/users'} />
                        <NavLink id="nav-approvals" icon="pending_actions" label="Approbations" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/pending-approvals')} onClick={() => window.location.hash = '#/pending-approvals'} badgeCount={pendingApprovalsCount} />
                    </>
                )}
                {!isAdmin && !isManager && (
                    <>
                        <NavLink id="nav-approvals" icon="pending_actions" label="Approbations" isCollapsed={isCollapsed} isActive={currentPath.startsWith('/pending-approvals')} onClick={() => window.location.hash = '#/pending-approvals'} badgeCount={pendingApprovalsCount} />
                    </>
                )}
            </nav>

            <div className="mt-auto">
                <div className="p-2">
                    <Tooltip content="Paramètres" align="right" disabled={!isCollapsed}>
                        <button
                            onClick={onOpenSettings}
                            className={`flex items-center w-full p-2 rounded-lg text-sm font-semibold transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 ${isCollapsed ? 'justify-center' : ''}`}
                            aria-label="Paramètres"
                        >
                            <span className={`material-symbols-outlined pointer-events-none ${!isCollapsed ? 'mr-3' : ''}`}>settings</span>
                            {!isCollapsed && <span className="pointer-events-none transition-opacity duration-200 whitespace-nowrap">Paramètres</span>}
                        </button>
                    </Tooltip>
                </div>
                <div ref={userMenuRef} className="relative p-2">
                    {isUserMenuOpen && (
                        <div
                            className={`absolute bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 p-2 animate-fade-in ${
                                isCollapsed ? 'left-1/2 -translate-x-1/2' : 'left-2'
                            }`}
                            style={{ animationDuration: '150ms' }}
                        >
                            <div className="flex items-center gap-3 p-2">
                                <img src={currentUser.avatarUrl} alt={currentUser.name} className="size-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{currentUser.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                                </div>
                            </div>
                            <hr className="my-1 border-gray-200 dark:border-gray-600" />
                            <a href="#/profile" onClick={() => setIsUserMenuOpen(false)} className="block w-full text-left px-2 py-1.5 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Mon profil</a>
                            <button onClick={onLogout} className="block w-full text-left px-2 py-1.5 rounded-md text-sm text-status-danger-700 dark:text-status-danger-400 hover:bg-gray-100 dark:hover:bg-gray-700">Se déconnecter</button>
                            <hr className="my-1 border-gray-200 dark:border-gray-600" />
                            <div className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
                                <a href="#" className="hover:underline">Confidentialité</a> • <a href="#" className="hover:underline">Termes</a>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setIsUserMenuOpen(p => !p)}
                        className={`flex items-center w-full rounded-lg transition-colors p-2 ${
                            isUserMenuOpen ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        aria-haspopup="true"
                        aria-expanded={isUserMenuOpen}
                        aria-label="Menu utilisateur"
                    >
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="size-8 rounded-full flex-shrink-0" />
                        {!isCollapsed && (
                            <span className="ml-3 font-semibold text-sm text-gray-700 dark:text-gray-300 truncate transition-opacity">{currentUser.name}</span>
                        )}
                    </button>
                </div>
            </div>

        </aside>
    );
};

export default Sidebar;