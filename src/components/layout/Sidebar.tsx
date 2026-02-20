import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import SidebarItem from './SidebarItem';
import { ViewType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAccessControl } from '../../hooks/useAccessControl';
import { GLOSSARY } from '../../constants/glossary';
import { useData } from '../../context/DataContext';
import Button from '../ui/Button';
import CloseButton from '../ui/CloseButton';
import { APP_CONFIG } from '../../config';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onSettingsClick: () => void;
    className?: string;
    isModalMode?: boolean;
    isMobileOpen?: boolean;
    closeMobileMenu?: () => void;
    hidePrimaryShortcuts?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    setIsCollapsed,
    currentView,
    onViewChange,
    onSettingsClick,
    className,
    isModalMode = true,
    isMobileOpen = false,
    closeMobileMenu,
    hidePrimaryShortcuts = false
}) => {
    const { currentUser } = useAuth();
    const { permissions } = useAccessControl();
    const { approvals, users } = useData();
    const drawerRef = useRef<HTMLElement | null>(null);
    const previousFocusedElementRef = useRef<HTMLElement | null>(null);

    const handleItemClick = (view: ViewType) => {
        onViewChange(view);
        if (closeMobileMenu) closeMobileMenu();
    };
    const showModalDrawer = isModalMode && isMobileOpen;
    const showPrimaryDrawerItems = !hidePrimaryShortcuts;

    const role = currentUser?.role;

    const relevantApprovals = useMemo(() => {
        if (!currentUser) return [];

        if (role === 'User') {
            return approvals.filter(a => a.requester === currentUser.name);
        }

        if (role === 'Manager') {
            const teamUserNames = users
                .filter(u => u.managerId === currentUser.id)
                .map(u => u.name);
            teamUserNames.push(currentUser.name);

            return approvals.filter(a => teamUserNames.includes(a.requester));
        }

        return approvals;
    }, [approvals, currentUser, users, role]);

    const ACTIVE_APPROVAL_STATUSES = new Set([
        'Pending',
        'Processing',
        'WaitingManager',
        'WaitingUser',
        'WAITING_MANAGER_APPROVAL',
        'WAITING_IT_PROCESSING',
        'WAITING_DOTATION_APPROVAL',
        'PENDING_DELIVERY',
    ]);

    const pendingCount = relevantApprovals.filter((a) => ACTIVE_APPROVAL_STATUSES.has(a.status)).length;
    const isNavSectionActive = (section: 'dashboard' | 'equipment' | 'users' | 'approvals' | 'finance' | 'management' | 'locations' | 'audit' | 'reports' | 'settings'): boolean => {
        switch (section) {
            case 'dashboard':
                return currentView === 'dashboard';
            case 'equipment':
                return ['equipment', 'equipment_details', 'add_equipment', 'edit_equipment', 'import_equipment', 'assignment_wizard', 'return_wizard'].includes(currentView);
            case 'users':
                return ['users', 'user_details', 'add_user', 'edit_user', 'import_users'].includes(currentView);
            case 'approvals':
                return ['approvals', 'new_request'].includes(currentView);
            case 'finance':
                return currentView === 'finance';
            case 'management':
                return ['management', 'category_details', 'model_details', 'import_models', 'add_category', 'add_model'].includes(currentView);
            case 'locations':
                return ['locations', 'import_locations'].includes(currentView);
            case 'audit':
                return ['audit', 'audit_details'].includes(currentView);
            case 'reports':
                return currentView === 'reports';
            case 'settings':
                return currentView === 'settings';
            default:
                return false;
        }
    };

    useEffect(() => {
        if (!showModalDrawer || !drawerRef.current) {
            return;
        }

        previousFocusedElementRef.current = document.activeElement as HTMLElement | null;
        const drawerElement = drawerRef.current;
        const previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusableSelector = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(',');

        const getFocusableElements = (): HTMLElement[] => {
            const elements = Array.from(drawerElement.querySelectorAll(focusableSelector)) as HTMLElement[];
            return elements.filter((element) => {
                const isDisabled = element.hasAttribute('disabled');
                const isAriaHidden = element.getAttribute('aria-hidden') === 'true';
                return !isDisabled && !isAriaHidden;
            });
        };

        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            drawerElement.focus();
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMobileMenu?.();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusable = getFocusableElements();
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            } else if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
            }
        };

        drawerElement.addEventListener('keydown', handleKeyDown);

        return () => {
            drawerElement.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousBodyOverflow;

            const previous = previousFocusedElementRef.current;
            if (previous) {
                requestAnimationFrame(() => previous.focus());
            }
        };
    }, [showModalDrawer, closeMobileMenu]);

    return (
        <>
            {/* Mobile Overlay (Scrim) */}
            <div
                className={cn(
                    "fixed inset-0 bg-scrim/[0.32] z-[90] expanded:hidden transition-opacity duration-medium2 ease-emphasized",
                    showModalDrawer ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={closeMobileMenu}
                aria-hidden="true"
            />

            <aside
                ref={drawerRef}
                role={showModalDrawer ? "dialog" : undefined}
                aria-modal={showModalDrawer ? true : undefined}
                aria-label={showModalDrawer ? "Menu de navigation" : undefined}
                tabIndex={showModalDrawer ? -1 : undefined}
                className={cn(
                    "fixed inset-y-0 left-0 z-[100]",
                    "expanded:static expanded:z-auto",
                    "h-full bg-surface-container-low border-r border-outline-variant flex flex-col justify-between transition-all duration-medium4 ease-emphasized",
                    showModalDrawer ? "translate-x-0 w-[85vw] max-w-[360px]" : "-translate-x-full expanded:translate-x-0",
                    isCollapsed ? "expanded:w-20" : "expanded:w-72",
                    className
                )}
            >
                <div className={cn(
                    "flex flex-col h-full overflow-y-auto custom-scrollbar transition-all duration-medium2 ease-emphasized",
                    isCollapsed && !isMobileOpen ? "p-3" : "p-4 expanded:p-page"
                )}>

                    {/* Header / Logo */}
                    <div className={cn(
                        "flex items-center mb-8 transition-all duration-medium2 min-h-10",
                        isCollapsed ? 'justify-center' : 'justify-between'
                    )}>
                        <div className={cn(
                            "flex items-center gap-2 overflow-hidden transition-all duration-medium2",
                            isCollapsed && !isMobileOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                        )}>
                            <span className="text-title-large text-on-surface whitespace-nowrap tracking-tight font-brand">
                                {APP_CONFIG.appName}
                            </span>
                        </div>

                        {isModalMode ? (
                            <CloseButton
                                onClick={closeMobileMenu}
                                className="text-on-surface-variant hover:text-error hover:bg-error-container p-2 rounded-full transition-all duration-medium2"
                            />
                        ) : (
                            <Button
                                variant="text"
                                size="sm"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="hidden expanded:flex text-on-surface-variant hover:text-primary hover:bg-primary-container/30 p-1.5 h-auto rounded-full transition-all duration-medium2 border-none shadow-none"
                                aria-label={isCollapsed ? "Déployer le menu" : "Réduire le menu"}
                                icon={<MaterialIcon name={isCollapsed ? "chevron_right" : "chevron_left"} size={24} />}
                            />
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav
                        aria-label="Sections principales"
                        className={cn(
                            "space-y-1 transition-all duration-medium2",
                            isCollapsed && !isMobileOpen && "flex flex-col items-center"
                        )}
                    >

                        {showPrimaryDrawerItems && permissions.canViewInventory && (
                            <>
                                <SidebarItem
                                    isCollapsed={isCollapsed && !isMobileOpen}
                                    icon="dashboard"
                                    label={GLOSSARY.DASHBOARD}
                                    active={isNavSectionActive('dashboard')}
                                    onClick={() => handleItemClick('dashboard')}
                                />
                                <SidebarItem
                                    isCollapsed={isCollapsed && !isMobileOpen}
                                    icon="devices"
                                    label={GLOSSARY.EQUIPMENT}
                                    active={isNavSectionActive('equipment')}
                                    onClick={() => handleItemClick('equipment')}
                                />
                            </>
                        )}

                        {showPrimaryDrawerItems && permissions.canViewUsers && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon="group"
                                label={GLOSSARY.USER_PLURAL}
                                active={isNavSectionActive('users')}
                                onClick={() => handleItemClick('users')}
                            />
                        )}

                        {showPrimaryDrawerItems && permissions.canViewApprovals && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon="task_alt"
                                label={GLOSSARY.APPROVALS}
                                active={isNavSectionActive('approvals')}
                                onClick={() => handleItemClick('approvals')}
                                badge={pendingCount > 0 ? pendingCount : undefined}
                            />
                        )}

                        {permissions.canManageInventory && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon="payments"
                                label="Finances"
                                active={isNavSectionActive('finance')}
                                onClick={() => handleItemClick('finance')}
                            />
                        )}

                        {permissions.canManageSystem && (
                            <>
                                <SidebarItem
                                    isCollapsed={isCollapsed && !isMobileOpen}
                                    icon="tune"
                                    label={GLOSSARY.MANAGEMENT}
                                    active={isNavSectionActive('management')}
                                    onClick={() => handleItemClick('management')}
                                />
                            </>
                        )}

                        {permissions.canManageLocations && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon="location_on"
                                label={GLOSSARY.LOCATIONS}
                                active={isNavSectionActive('locations')}
                                onClick={() => handleItemClick('locations')}
                            />
                        )}

                        {permissions.canManageAudit && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon="fact_check"
                                label={GLOSSARY.AUDIT}
                                active={isNavSectionActive('audit')}
                                onClick={() => handleItemClick('audit')}
                            />
                        )}

                        {permissions.canViewReports && (
                            <SidebarItem
                                isCollapsed={isCollapsed && !isMobileOpen}
                                icon="bar_chart"
                                label={GLOSSARY.REPORTS}
                                active={isNavSectionActive('reports')}
                                onClick={() => handleItemClick('reports')}
                            />
                        )}
                    </nav>

                    {/* Bottom Actions */}
                    <nav
                        aria-label="Actions secondaires"
                        className={cn(
                            "mt-auto space-y-1 pt-4",
                            isCollapsed && !isMobileOpen && "flex flex-col items-center"
                        )}
                    >
                        <SidebarItem
                            isCollapsed={isCollapsed && !isMobileOpen}
                            icon="settings"
                            label={GLOSSARY.SETTINGS}
                            active={isNavSectionActive('settings')}
                            onClick={() => {
                                onSettingsClick();
                                if (closeMobileMenu) closeMobileMenu();
                            }}
                        />
                    </nav>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;









