import React from 'react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import MaterialIcon from '../ui/MaterialIcon';

interface TopAppBarAction {
  icon: string;
  onClick: () => void;
  label: string;
}

interface TopAppBarProps {
  title: string;
  leadingAction?: TopAppBarAction;
  trailingActions?: TopAppBarAction[];
  className?: string;
  titleClassName?: string;
}

/**
 * MD3 Top App Bar (small).
 * Height: 64dp, leading navigation icon + title + up to 3 trailing actions.
 */
export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  leadingAction,
  trailingActions = [],
  className,
  titleClassName,
}) => {
  return (
    <header
      role="banner"
      className={cn(
        "h-16 bg-surface-container-low border-b border-outline-variant shadow-elevation-1",
        "flex items-center justify-between px-2",
        className
      )}
    >
      <div className="flex items-center min-w-0 flex-1">
        {leadingAction && (
          <Button
            variant="text"
            size="sm"
            onClick={leadingAction.onClick}
            aria-label={leadingAction.label}
            title={leadingAction.label}
            className="!w-12 !h-12 !min-h-12 !min-w-12 !p-0"
            icon={<MaterialIcon name={leadingAction.icon} size={24} />}
          />
        )}
        <div className={cn("text-title-large text-on-surface truncate ml-1 flex-1", titleClassName)} role="heading" aria-level={2}>
          {title}
        </div>
      </div>

      {trailingActions.length > 0 && (
        <div className="flex items-center">
          {trailingActions.slice(0, 3).map((action) => (
            <Button
              key={`${action.icon}-${action.label}`}
              variant="text"
              size="sm"
              onClick={action.onClick}
              aria-label={action.label}
              title={action.label}
              className="!w-12 !h-12 !min-h-12 !min-w-12 !p-0"
              icon={<MaterialIcon name={action.icon} size={24} />}
            />
          ))}
        </div>
      )}
    </header>
  );
};

export default TopAppBar;


