import React from 'react';
import { cn } from '../../lib/utils';

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  badge?: string | number;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  badge,
  className
}) => {
  return (
    <h3 className={cn(
      "text-label-large text-on-surface-variant uppercase tracking-widest flex items-center gap-2 mb-4",
      className
    )}>
      {icon && <span className="shrink-0">{icon}</span>}
      {title}
      {badge !== undefined && (
        <span className="bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded-xs text-label-small">
          {badge}
        </span>
      )}
    </h3>
  );
};

export default SectionHeader;