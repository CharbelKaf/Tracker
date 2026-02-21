import React, { useCallback, useMemo, useRef } from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import { ViewType } from '../../types';
import { useAccessControl } from '../../hooks/useAccessControl';

interface NavigationRailProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    onMenuClick: () => void;
    compact?: boolean;
    className?: string;
}

interface RailItemProps {
    destinationId: ViewType;
    icon: string;
    label: string;
    active: boolean;
    compact?: boolean;
    onClick: () => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    tabIndex: number;
}

const RailItem = React.forwardRef<HTMLButtonElement, RailItemProps>(
    ({ destinationId, icon, label, active, compact = false, onClick, onKeyDown, tabIndex }, ref) => (
        <Button
            ref={ref}
            variant="text"
            size="sm"
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={tabIndex}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            aria-describedby={compact ? undefined : `rail-label-${destinationId}`}
            className={cn(
                compact
                    ? "!w-12 !min-h-12 !px-1 !py-1 !flex-col !items-center !justify-center !gap-0.5 !rounded-full"
                    : "!w-20 !min-h-16 !px-2 !py-1 !flex-col !items-center !justify-center !gap-1 !rounded-full",
                "!outline-none !focus-visible:ring-2 !focus-visible:ring-primary !focus-visible:ring-inset",
                "!transition-all !duration-short4 !ease-emphasized",
                active ? "!text-on-secondary-container" : "!text-on-surface-variant"
            )}
            title={label}
        >
            <span
                className={cn(
                    compact ? "w-full h-7 rounded-full inline-flex items-center justify-center" : "w-full h-8 rounded-full inline-flex items-center justify-center",
                    active ? "bg-secondary-container" : ""
                )}
            >
                <MaterialIcon name={icon} size={24} filled={active} />
            </span>
            <span
                id={`rail-label-${destinationId}`}
                className={cn("text-label-small text-center leading-tight max-w-full", compact && "hidden")}
            >
                {label}
            </span>
        </Button>
    )
);

RailItem.displayName = 'RailItem';

/**
 * MD3 Navigation Rail (medium layouts): 80dp width with icon + label destinations.
 * Includes a menu action to open the full drawer.
 */
export const NavigationRail: React.FC<NavigationRailProps> = ({
    currentView,
    onViewChange,
    onMenuClick,
    compact = false,
    className,
}) => {
    const { permissions } = useAccessControl();
    const destinationRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const allRailItems = [
        ...(permissions.canViewInventory ? [{
            id: 'dashboard' as ViewType,
            icon: 'dashboard',
            label: 'Accueil',
        }] : []),
        ...(permissions.canViewInventory ? [{
            id: 'equipment' as ViewType,
            icon: 'devices',
            label: 'Actifs',
        }] : []),
        ...(permissions.canViewApprovals ? [{
            id: 'approvals' as ViewType,
            icon: 'task_alt',
            label: 'Taches',
        }] : []),
        ...(permissions.canViewUsers ? [{
            id: 'users' as ViewType,
            icon: 'group',
            label: 'Equipe',
        }] : []),
    ];
    const railItems = compact ? allRailItems.slice(0, 3) : allRailItems;

    const destinations = useMemo(() => railItems.map((item) => ({
        ...item,
        active: currentView === item.id,
        onSelect: () => onViewChange(item.id),
    })), [currentView, onViewChange, railItems]);

    const activeIndex = Math.max(0, destinations.findIndex((item) => item.active));

    const focusDestination = useCallback((index: number) => {
        destinationRefs.current[index]?.focus();
    }, []);

    const handleRailKeyDown = useCallback((index: number, event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (destinations.length === 0) {
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                focusDestination((index + 1) % destinations.length);
                break;
            case 'ArrowUp':
                event.preventDefault();
                focusDestination((index - 1 + destinations.length) % destinations.length);
                break;
            case 'Home':
                event.preventDefault();
                focusDestination(0);
                break;
            case 'End':
                event.preventDefault();
                focusDestination(destinations.length - 1);
                break;
            default:
                break;
        }
    }, [destinations.length, focusDestination]);

    return (
        <aside
            aria-label="Navigation secondaire"
            className={cn(
                compact ? "w-16 h-full bg-surface-container border-r border-outline-variant" : "w-24 h-full bg-surface-container border-r border-outline-variant",
                compact ? "flex flex-col items-center justify-between py-2" : "flex flex-col items-center justify-between py-3",
                className
            )}
        >
            <div className={cn("flex flex-col items-center gap-2", compact && "gap-1.5")}>
                <IconButton
                    icon="menu"
                    variant="standard"
                    onClick={onMenuClick}
                    className="text-on-surface-variant"
                    aria-label="Ouvrir le menu lateral"
                    title="Menu"
                />

                <nav className={cn("flex flex-col items-center gap-1 mt-1", compact && "gap-0.5")} aria-label="Destinations principales">
                    {destinations.slice(0, railItems.length).map((item, index) => (
                        <RailItem
                            key={item.id}
                            ref={(el) => { destinationRefs.current[index] = el; }}
                            destinationId={item.id}
                            icon={item.icon}
                            label={item.label}
                            active={item.active}
                            compact={compact}
                            onClick={item.onSelect}
                            onKeyDown={(event) => handleRailKeyDown(index, event)}
                            tabIndex={index === activeIndex ? 0 : -1}
                        />
                    ))}
                </nav>
            </div>

        </aside>
    );
};



