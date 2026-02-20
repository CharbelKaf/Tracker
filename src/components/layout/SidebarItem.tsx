import React from 'react';
import { cn } from '../../lib/utils';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';

interface SidebarItemProps {
    /** Material Symbols icon name */
    icon: string;
    label: string;
    active?: boolean;
    badge?: string | number;
    isCollapsed?: boolean;
    onClick?: () => void;
    className?: string;
}

/**
 * MD3 Navigation Drawer Item.
 * Active state uses secondaryContainer-style indicator with filled icon.
 */
const SidebarItem: React.FC<SidebarItemProps> = ({
    icon,
    label,
    active,
    badge,
    isCollapsed = false,
    onClick,
    className,
}) => {
    const badgeCount = typeof badge === 'number' ? badge : (badge ? parseInt(badge as string) : 0);

    return (
        <Button
            variant="text"
            size="sm"
            onClick={onClick}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            title={isCollapsed ? label : undefined}
            className={cn(
                "group relative !cursor-pointer !transition-all !duration-medium2 !ease-emphasized !flex !items-center !overflow-hidden",
                // MD3 Active indicator shape: stadium (full rounded)
                "!rounded-full",
                // Accessibility
                "!outline-none !focus-visible:ring-2 !focus-visible:ring-primary !focus-visible:ring-inset",
                // Horizontal spacing
                isCollapsed
                    ? "!w-12 !h-12 !min-h-12 !min-w-12 !self-center !mx-auto !px-0 !py-0 !justify-center !gap-0"
                    : "!w-full !min-h-12 !px-4 !py-3 !justify-start",
                // MD3 Active: secondaryContainer background, onSecondaryContainer text
                active
                    ? "!bg-secondary-container !text-on-secondary-container !ring-1 !ring-secondary/35 !shadow-elevation-1"
                    : "!text-on-surface-variant",
                className
            )}
        >
            {/* Icon — filled when active (MD3 spec) */}
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                <MaterialIcon
                    name={icon}
                    size={24}
                    filled={active || false}
                    weight={active ? 600 : 400}
                />
            </span>

            {/* Label — MD3 Label Large */}
            {!isCollapsed && (
                <span className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-medium2 ease-emphasized text-label-large w-auto opacity-100 ml-3",
                    active ? "font-semibold" : "font-medium"
                )}>
                    {label}
                </span>
            )}

            {/* Badge */}
            {badge && badgeCount > 0 && (
                <span className={cn(
                    "flex items-center justify-center bg-error text-on-error rounded-full shadow-elevation-1 transition-all duration-medium2",
                    isCollapsed
                        ? "absolute top-1 right-1 min-w-[18px] h-[18px] text-[9px] p-0.5 leading-none z-10 text-label-small"
                        : "ml-auto w-auto min-w-[20px] h-5 px-1.5 text-label-small"
                )}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                </span>
            )}

            {/* Tooltip (collapsed desktop) */}
            {isCollapsed && (
                <div className="hidden large:block absolute left-full ml-3 px-3 py-2 bg-inverse-surface text-inverse-on-surface text-label-medium rounded-xs opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none transition-all duration-short4 ease-emphasized whitespace-nowrap z-50 shadow-elevation-2 translate-x-[-10px] group-hover:translate-x-0 group-focus-visible:translate-x-0">
                    {label}
                </div>
            )}
        </Button>
    );
};

export default SidebarItem;

