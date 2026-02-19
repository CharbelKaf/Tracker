import React from 'react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';

export interface SubSidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  badge?: string | number;
}

interface SubSidebarProps {
  title?: string;
  items: SubSidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SubSidebar: React.FC<SubSidebarProps> = ({
  title,
  items,
  activeId,
  onSelect,
  className,
  action,
  footer
}) => {
  return (
    <div className={cn("w-64 flex-shrink-0 bg-surface border-r border-outline-variant flex flex-col h-full", className)}>
      {/* Header - Only render if title or action exists */}
      {(title || action) && (
        <div className="p-6 border-b border-outline-variant">
          {title && <h2 className={cn("text-title-large text-on-surface tracking-tight", action ? "mb-4" : "mb-0")}>{title}</h2>}
          {action}
        </div>
      )}

      {/* Navigation List */}
      <div className={cn("flex-1 overflow-y-auto", (title || action) ? "py-2" : "py-6")}>
        <nav className="space-y-1 px-3">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <Button
                key={item.id}
                type="button"
                variant={isActive ? 'tonal' : 'text'}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "w-full !rounded-full !px-3 !py-3 !justify-start !items-center gap-3 !text-left transition-all duration-short4 ease-emphasized group relative border border-transparent state-layer",
                  isActive
                    ? "!bg-secondary-container !text-on-secondary-container"
                    : "!text-on-surface-variant hover:!bg-on-surface/[0.08]"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 p-2 rounded-full transition-colors duration-short4",
                  isActive ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant group-hover:text-primary"
                )}>
                  {React.isValidElement<{ size?: number }>(item.icon)
                    ? React.cloneElement(item.icon, { size: 18 })
                    : item.icon}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-label-large">{item.label}</span>
                </div>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Footer - Only render if footer prop is provided */}
      {footer && (
        <div className="p-4 border-t border-outline-variant bg-surface-container-low">
          {footer}
        </div>
      )}
    </div>
  );
};
