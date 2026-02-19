import React from 'react';
import { cn } from '../../lib/utils';

export interface ListItemProps {
  headline: React.ReactNode;
  supportingText?: React.ReactNode;
  secondarySupportingText?: React.ReactNode;
  trailingText?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  lines?: 1 | 2 | 3;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * MD3 List item primitive.
 * Heights:
 * - 1 line: 56dp
 * - 2 lines: 72dp
 * - 3 lines: 88dp
 */
const ListItem: React.FC<ListItemProps> = ({
  headline,
  supportingText,
  secondarySupportingText,
  trailingText,
  leading,
  trailing,
  lines = 1,
  selected = false,
  disabled = false,
  onClick,
  className,
}) => {
  const minHeightClass = lines === 1 ? 'min-h-14' : lines === 2 ? 'min-h-[72px]' : 'min-h-[88px]';
  const verticalPaddingClass = lines === 1 ? 'py-2' : lines === 2 ? 'py-3' : 'py-4';
  const interactive = !!onClick && !disabled;
  const interactiveBaseClasses = cn(
    'w-full text-left px-4 flex items-center gap-4 outline-none transition-[color,background-color,opacity] duration-short3 ease-emphasized',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
    minHeightClass,
    verticalPaddingClass,
    selected ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface text-on-surface',
    interactive && !selected && 'hover:bg-on-surface/[0.08] state-layer cursor-pointer',
    disabled && 'opacity-[0.38] cursor-not-allowed'
  );

  const content = (
    <>
      {leading && (
        <div className={cn('shrink-0', selected ? 'text-on-secondary-container' : 'text-on-surface-variant')}>
          {leading}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-body-large truncate">{headline}</div>
        {supportingText && (
          <div className={cn('text-body-medium truncate', selected ? 'text-on-secondary-container/90' : 'text-on-surface-variant')}>
            {supportingText}
          </div>
        )}
        {lines === 3 && secondarySupportingText && (
          <div className={cn('text-body-medium truncate', selected ? 'text-on-secondary-container/80' : 'text-on-surface-variant/80')}>
            {secondarySupportingText}
          </div>
        )}
      </div>

      {(trailingText || trailing) && (
        <div className={cn('shrink-0 flex items-center gap-2 text-body-small', selected ? 'text-on-secondary-container/90' : 'text-on-surface-variant')}>
          {trailingText && <span>{trailingText}</span>}
          {trailing}
        </div>
      )}
    </>
  );

  return (
    <li className={cn('border-b border-outline-variant/50 last:border-b-0 bg-surface', className)}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-disabled={disabled || undefined}
          className={interactiveBaseClasses}
        >
          {content}
        </button>
      ) : (
        <div
          aria-disabled={disabled || undefined}
          className={interactiveBaseClasses}
        >
          {content}
        </div>
      )}
    </li>
  );
};

export default ListItem;
