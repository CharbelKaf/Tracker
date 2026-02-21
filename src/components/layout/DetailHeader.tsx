import React from 'react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import MaterialIcon from '../ui/MaterialIcon';

interface DetailHeaderProps {
  onBack: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  pretitle?: React.ReactNode;
  leadingVisual?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Shared detail page header with back action, identity block and optional tabs.
 */
export const DetailHeader: React.FC<DetailHeaderProps> = ({
  onBack,
  title,
  subtitle,
  pretitle,
  leadingVisual,
  actions,
  tabs,
  className,
  contentClassName,
}) => {
  return (
    <div className={cn("bg-surface px-page-sm py-6 medium:px-page border-b border-outline-variant", className)}>
      <Button
        variant="text"
        onClick={onBack}
        className="mb-4 text-on-surface-variant hover:text-on-surface px-0 hover:bg-transparent border-none shadow-none active:scale-90 transition-transform duration-short4"
        icon={<MaterialIcon name="arrow_back" size={18} />}
      >
        Retour
      </Button>

      <div
        className={cn(
          "flex flex-col large:flex-row justify-between gap-6",
          tabs ? "large:items-end" : "large:items-center",
          contentClassName
        )}
      >
        <div className={cn("min-w-0", leadingVisual && "flex items-center gap-6")}>
          {leadingVisual && <div className="shrink-0">{leadingVisual}</div>}
          <div className="min-w-0">
            {pretitle && <div className="mb-2">{pretitle}</div>}
            <h1 className="text-headline-medium medium:text-display-small font-bold text-on-surface tracking-tight break-words">
              {title}
            </h1>
            {subtitle && (
              <div className="text-on-surface-variant text-sm mt-1">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {tabs && (
        <div className="mt-10 -mb-6 large:-mb-6">
          {tabs}
        </div>
      )}
    </div>
  );
};


