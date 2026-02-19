import React from 'react';
import { cn } from '../../lib/utils';
import IconButton from '../ui/IconButton';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  hasMenu?: boolean;
  sticky?: boolean;
  /** Leading navigation icon (e.g. 'arrow_back', 'menu') */
  leadingIcon?: {
    icon: string;
    onClick: () => void;
    label?: string;
  };
  /**
   * Keeps title/subtitle visible in content on compact portrait.
   * By default the TopAppBar title is considered the single source on mobile.
   */
  showContentTitleOnCompact?: boolean;
}

/**
 * MD3 Page Header — sticky with surface tint background
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumb,
  actions,
  sticky = true,
  leadingIcon,
  showContentTitleOnCompact = false,
}) => {
  const isCompact = useMediaQuery('(max-width: 599px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const hasMobileTopBar = isCompact && !isLandscape;
  const hideContentHeader = hasMobileTopBar && !showContentTitleOnCompact;

  if (hideContentHeader && !actions) {
    return null;
  }

  return (
    <div
      className={cn(
        !hideContentHeader && sticky && 'sticky top-0 z-30',
        !hideContentHeader && 'bg-surface/95 backdrop-blur-sm',
        '-mx-page-sm px-page-sm medium:-mx-page medium:px-page',
        hideContentHeader ? 'mb-4 pt-1' : '-mt-4 pt-4 medium:-mt-6 medium:pt-6 mb-6 pb-4',
        'transition-all duration-short4'
      )}
    >
      {!hideContentHeader && breadcrumb && (
        <p className="text-label-small uppercase tracking-wider text-on-surface-variant mb-2">
          {breadcrumb}
        </p>
      )}

      <div
        className={cn(
          hideContentHeader
            ? 'flex items-center justify-end flex-wrap'
            : 'flex flex-col gap-3 medium:flex-row medium:items-start medium:justify-between'
        )}
      >
        {!hideContentHeader && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {leadingIcon && (
              <IconButton
                icon={leadingIcon.icon}
                variant="standard"
                size={24}
                onClick={leadingIcon.onClick}
                className="-ml-2 shrink-0"
                aria-label={leadingIcon.label || 'Retour'}
              />
            )}
            <div className="min-w-0">
              <h1 className="text-headline-small medium:text-headline-medium text-on-surface mb-1 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-body-medium text-on-surface-variant">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {actions && (
          <div
            className={cn(
              'flex items-center gap-2 medium:gap-3',
              hideContentHeader
                ? 'w-full ml-auto justify-end max-w-full flex-wrap'
                : 'justify-start medium:justify-end flex-wrap flex-shrink-0'
            )}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;



