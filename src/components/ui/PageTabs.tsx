
import React, { useRef, useCallback, useId } from 'react';
import { cn } from '../../lib/utils';
import Badge from './Badge';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface PageTabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * MD3 Tabs — Primary tabs with active indicator.
 * Uses title-small type, primary active indicator.
 * Full ARIA tablist/tab pattern with ←/→/Home/End keyboard navigation.
 */
export const PageTabs: React.FC<PageTabsProps> = ({
  items,
  activeId,
  onChange,
  className
}) => {
  const baseId = useId().replace(/:/g, '');
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === activeId));

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (items.length === 0) {
      return;
    }

    let nextIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = index < items.length - 1 ? index + 1 : 0;
        break;

      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = index > 0 ? index - 1 : items.length - 1;
        break;

      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        onChange(items[index].id);
        return;

      default:
        return;
    }

    tabsRef.current[nextIndex]?.focus();
    onChange(items[nextIndex].id);
  }, [items, onChange]);

  return (
    <div className={cn("w-full border-b border-outline-variant bg-surface", className)}>
      <div
        className="flex items-center gap-0 overflow-x-auto no-scrollbar px-page-sm medium:px-page"
        role="tablist"
        aria-orientation="horizontal"
        aria-label="Navigation par onglets"
      >
        {items.map((item, index) => {
          const isActive = activeId === item.id;
          const tabId = `${baseId}-tab-${index}`;
          const panelId = `${baseId}-panel-${index}`;

          return (
            <button
              key={item.id}
              ref={el => { tabsRef.current[index] = el; }}
              role="tab"
              id={tabId}
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "group relative flex items-center gap-2 min-h-12 px-4 py-3 text-title-small transition-all duration-short4 ease-emphasized outline-none select-none whitespace-nowrap state-layer",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                isActive
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {/* Icon */}
              {item.icon && (
                <span className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"
                )}>
                  {React.isValidElement(item.icon)
                    ? React.cloneElement(item.icon as React.ReactElement<Record<string, unknown>>, { size: 18 })
                    : item.icon}
                </span>
              )}

              {/* Label */}
              <span>{item.label}</span>

              {/* Badge */}
              {item.badge !== undefined && (
                <Badge
                  variant={isActive ? 'warning' : 'neutral'}
                  className={cn("ml-1 px-1.5 py-0 h-4 min-w-[16px]", isActive ? "bg-primary text-on-primary" : "")}
                >
                  {item.badge}
                </Badge>
              )}

              {/* Active indicator — 3px bar */}
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full animate-in fade-in duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
