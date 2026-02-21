import React from 'react';
import MaterialIcon from './MaterialIcon';
import { cn } from '../../lib/utils';

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick?: () => void;
  filterActive?: boolean;
  resultCount?: number;
  placeholder?: string;
  className?: string;
}

/**
 * MD3 Search Bar.
 * Uses surface-container-high background, full rounded shape, and MD3 tokens.
 */
export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  onSearchChange,
  onFilterClick,
  filterActive,
  resultCount,
  placeholder = "Rechercher...",
  className
}) => {
  const [localFilterActive, setLocalFilterActive] = React.useState(false);
  const hasCount = resultCount !== undefined;
  const isExternallyControlled = typeof filterActive === 'boolean';
  const isFilterActive = isExternallyControlled ? filterActive : localFilterActive;
  // Always reserve one fixed slot for filter icon to keep all bars consistent.
  const controlCount = (searchValue ? 1 : 0) + (hasCount ? 1 : 0) + 1;
  const trailingSpaceClass = controlCount >= 3
    ? 'pr-44 medium:pr-48'
    : controlCount === 2
      ? 'pr-32 medium:pr-36'
      : 'pr-16 medium:pr-20';

  const handleFilterAction = () => {
    if (onFilterClick) {
      onFilterClick();
    }
    if (!isExternallyControlled) {
      setLocalFilterActive((prev) => !prev);
    }
  };

  return (
    <div role="search" className={cn("bg-surface-container-high rounded-full shadow-elevation-1 transition-shadow duration-short4 hover:shadow-elevation-2 focus-within:shadow-elevation-2", className)}>
      <div className="relative group flex items-center min-h-14">
        {/* Leading icon */}
        <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
          <MaterialIcon name="search" size={20} className="text-on-surface-variant group-focus-within:text-primary transition-colors duration-short4" />
        </div>

        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={cn(
            "w-full h-14 bg-transparent text-on-surface rounded-full py-0 pl-12 focus:outline-none placeholder-on-surface-variant text-body-large",
            trailingSpaceClass
          )}
        />

        <div className="absolute right-2 inset-y-0 flex items-center gap-1.5">
          {/* Clear button (shows when text entered) */}
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="h-12 w-12 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/[0.08] transition-colors duration-short4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Effacer la recherche"
            >
              <MaterialIcon name="close" size={18} />
            </button>
          )}

          {/* Result count chip */}
          {hasCount && (
            <span className="hidden medium:inline-flex h-8 min-w-8 items-center justify-center px-2 rounded-sm bg-surface-container-highest text-label-small text-on-surface-variant border border-outline-variant whitespace-nowrap">
              {resultCount}
            </span>
          )}

          {/* Trailing filter button (always visible for consistency) */}
          <button
            type="button"
            onClick={handleFilterAction}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFilterAction();
              }
            }}
            className={cn(
              "h-12 w-12 rounded-full transition-all duration-short4 ease-emphasized flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 state-layer",
              isFilterActive
                ? "bg-secondary-container text-on-secondary-container shadow-elevation-1"
                : "bg-primary-container text-on-primary-container hover:shadow-elevation-1"
            )}
            aria-label={isFilterActive ? "Masquer les filtres" : "Afficher les filtres"}
            aria-pressed={isFilterActive}
          >
            <MaterialIcon name="tune" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

