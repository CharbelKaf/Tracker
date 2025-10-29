import React, { useMemo, useState, useEffect, useRef, useCallback, useMemo as useMemoAlias, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusTrap } from './hooks/useFocusTrap';
import Tooltip from './Tooltip';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, onBack, children }) => {
  return (
    <header className="sticky top-0 z-40 flex h-auto min-h-16 flex-shrink-0 items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 bg-white/85 dark:bg-gray-800/85 px-4 py-2 md:px-6 backdrop-blur-sm shadow-[var(--shadow-elev-1)]">
      <div className="flex flex-1 basis-0 items-center justify-start">
        {onBack && (
          <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Retour">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
      </div>
      <div className="flex flex-col items-center justify-center px-2 min-w-0 max-w-full text-center">
        <h1 className="text-balance text-center text-lg font-bold leading-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-balance text-center text-xs leading-snug text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex flex-1 basis-0 justify-end items-center gap-2">
        {children}
      </div>
    </header>
  );
};

export default PageHeader;

// --- Additional Components ---

export const SelectionHeader: React.FC<{
  count: number;
  onCancel: () => void;
  onDelete: () => void;
}> = ({ count, onCancel, onDelete }) => (
  <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between gap-2 border-b border-gray-700 bg-gray-900 text-white px-4 md:px-6 shadow-[var(--shadow-elev-2)]">
    <div className="flex items-center gap-2">
      <button onClick={onCancel} className="flex size-10 items-center justify-center rounded-full text-white hover:bg-gray-700" aria-label="Annuler la sélection">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <span className="text-xl font-bold">{count}</span>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={onDelete} className="flex size-10 items-center justify-center rounded-full text-white hover:bg-gray-700" aria-label="Supprimer la sélection">
        <span className="material-symbols-outlined">delete</span>
      </button>
    </div>
  </header>
);


// Action type used by various components
interface Action {
    label: string;
    icon: string;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
    title?: string;
    isDestructive?: boolean;
    disabledTooltip?: string;
}

// PageHeaderActions for desktop header buttons
export const PageHeaderActions: React.FC<{
    actions: Action[];
    hideOnMobile?: boolean;
}> = ({ actions, hideOnMobile = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useFocusTrap(menuRef, isOpen);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);


    if (!actions || actions.length === 0) {
        return null;
    }

    return (
      <div className={`${hideOnMobile ? 'hidden lg:inline-flex' : 'inline-flex'}`} ref={menuRef}>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(p => !p)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    aria-label="Plus d'options"
                >
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
                {isOpen && (
                    <div
                        className="absolute top-full right-0 mt-2 w-56 origin-top-right rounded-[var(--radius-card)] bg-white dark:bg-gray-800 shadow-[var(--shadow-elev-3)] ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-20 animate-fade-in"
                        style={{ animationDuration: '100ms' }}
                        role="menu"
                        aria-orientation="vertical"
                    >
                         <div className="py-1">
                            {actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => { action.onClick(e); setIsOpen(false); }}
                                    disabled={action.disabled}
                                    title={action.disabled ? action.title : action.label}
                                    className={`w-full text-left flex items-center px-4 py-2 text-sm ${
                                        action.isDestructive ? 'text-status-danger-700 dark:text-status-danger-400' : 'text-gray-700 dark:text-gray-200'
                                    } hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    role="menuitem"
                                >
                                    <span className="material-symbols-outlined mr-3">{action.icon}</span>
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
      </div>
    );
};

// PageFooter for form pages
export const PageFooter: React.FC<{ children: React.ReactNode; contentClassName?: string }> = ({ children, contentClassName }) => (
    <footer className="sticky bottom-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 border-t border-gray-200 dark:border-gray-700 lg:static">
        <div className={`flex justify-end gap-4 ${contentClassName || 'max-w-full'}`}>
            {children}
        </div>
    </footer>
);

// Detail views components
export const DetailSection: React.FC<{ title: string; icon: string; children: React.ReactNode; className?: string }> = ({ title, icon, children, className }) => (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-[var(--radius-card)] shadow-[var(--shadow-elev-1)] ${className || ''}`}>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">{icon}</span>
            {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {children}
        </div>
    </div>
);

export const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => {
    const resolvedValue = (() => {
        if (value === undefined || value === null) {
            return 'N/A';
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed.length > 0 ? trimmed : 'N/A';
        }

        if (typeof value === 'number') {
            return value;
        }

        return value;
    })();

    const isPrimitive = typeof resolvedValue === 'string' || typeof resolvedValue === 'number';

    return (
        <div className="py-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            {isPrimitive ? (
                <p className="text-base text-gray-900 dark:text-gray-100">{resolvedValue}</p>
            ) : (
                <div className="text-base text-gray-900 dark:text-gray-100">{resolvedValue}</div>
            )}
        </div>
    );
};

// Tabs component
interface Tab {
    id: string;
    label: string;
    icon?: string;
}

export const Tabs: React.FC<{ tabs: Tab[]; activeTab: string; onTabClick: (id: string) => void }> = ({ tabs, activeTab, onTabClick }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <motion.button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabClick(tab.id)}
                        className={`relative flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            isActive
                                ? 'border-transparent text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    >
                        {tab.icon && <span className="material-symbols-outlined !text-base">{tab.icon}</span>}
                        <span>{tab.label}</span>
                        {isActive && (
                            <motion.span
                                layoutId="tab-active-indicator"
                                className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-primary-500 dark:bg-primary-400"
                                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                            />
                        )}
                    </motion.button>
                );
            })}
        </nav>
    </div>
);


// ListItemCard component
interface ListItemCardProps {
  id: string;
  imageUrl?: string;
  imageShape?: 'round' | 'square';
  title?: React.ReactNode;
  details?: { icon?: string; text: React.ReactNode }[];
  statusBadge?: React.ReactNode;
  isSelected?: boolean;
  onCardClick?: (id: string) => void;
  selectionModeActive?: boolean;
  onLongPress?: (id: string) => void;
  onSelectToggle?: (e: React.MouseEvent | React.ChangeEvent) => void;
  actions?: Action[];
  isPopoverOpen?: boolean;
  onActionsClick?: (e: React.MouseEvent, id: string) => void;
  onMobileActionsClick?: (e: React.MouseEvent, id: string) => void;
  popoverRef?: React.RefObject<HTMLDivElement>;
  popoverPosition?: 'top' | 'bottom';
  footerActions?: React.ReactNode;
  fullHeight?: boolean;
}

export const ListItemCard: React.FC<ListItemCardProps> = ({
  id, imageUrl, imageShape = 'square', title, details, statusBadge, isSelected, onCardClick, selectionModeActive, onLongPress, onSelectToggle, actions, isPopoverOpen, onActionsClick, onMobileActionsClick, popoverRef, popoverPosition, footerActions, fullHeight,
}) => {
  const imageSizeClasses = imageShape === 'round' ? 'size-12' : 'size-14';
  const imageShapeClasses = imageShape === 'round' ? 'rounded-full' : 'rounded-[var(--radius-card)]';
  const cardClasses = `relative surface-card surface-card-gradient overflow-hidden border ${isSelected ? 'border-primary-400 ring-2 ring-primary-200 dark:ring-primary-500/30' : 'border-transparent dark:border-transparent'} hover:-translate-y-0.5 transition-all duration-200 ${fullHeight ? 'h-full' : ''}`;
  
  // FIX: Initialize useRef with null to provide a correct initial value.
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
      if ((e.pointerType === 'mouse' && e.button !== 0) || !onLongPress) return;
      longPressTriggered.current = false;
      longPressTimer.current = window.setTimeout(() => {
          onLongPress(id);
          longPressTriggered.current = true;
      }, 500);
  };
  
  const handlePointerUp = () => {
      // FIX: Add a check to ensure longPressTimer.current is not null before clearing.
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
      }
  };

  const handleClick = (e: React.MouseEvent) => {
      if (longPressTriggered.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
      }
      if (onCardClick && !selectionModeActive) {
        onCardClick(id);
      } else if (selectionModeActive && onSelectToggle) {
        onSelectToggle(e);
      }
  };

  const cardContent = (
    <div className="flex items-center gap-3 w-full h-full p-2.5">
      <div
        className={`flex-shrink-0 flex items-center justify-center transition-all duration-300 ease-in-out ${selectionModeActive ? 'w-10' : 'w-0'}`}
        aria-hidden={!selectionModeActive}
        onClick={e => e.stopPropagation()}
      >
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={(event) => onSelectToggle?.(event)}
            className={`h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 cursor-pointer transition-opacity duration-150 ${selectionModeActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            tabIndex={selectionModeActive ? 0 : -1}
            aria-label={`Sélectionner ${title}`}
          />
      </div>
      {imageUrl && (
        <div className={`flex-shrink-0 ${imageSizeClasses} ${imageShapeClasses} bg-gray-100 dark:bg-gray-700 overflow-hidden`}>
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</p>
        {details && details.length > 0 && (
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-sm text-gray-500 dark:text-gray-400 mt-1">
            {details.map((detail, index) => (
                detail.text ? (
                    <div key={index} className="flex items-center gap-1.5">
                        {detail.icon && <span className="material-symbols-outlined !text-base">{detail.icon}</span>}
                        <span className="truncate">{detail.text}</span>
                    </div>
                ) : null
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 pl-2 min-w-0">
        {statusBadge && (
          <div className="min-w-0">
            {statusBadge}
          </div>
        )}
        {actions && onActionsClick && (
            <div className="relative">
                 <button
                    onClick={(e) => onActionsClick(e, id)}
                    className="hidden lg:flex size-8 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-haspopup="true"
                    aria-expanded={isPopoverOpen}
                    aria-label="Actions"
                >
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
                 <button
                    onClick={(e) => onMobileActionsClick && onMobileActionsClick(e, id)}
                    className="flex lg:hidden size-8 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Actions"
                >
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
                <AnimatePresence>
                    {isPopoverOpen && popoverRef && (
                        <motion.div
                            ref={popoverRef}
                            className={`absolute top-full right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-10 ${popoverPosition === 'top' ? 'bottom-full top-auto mb-2' : ''}`}
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } }}
                            exit={{ opacity: 0, y: -6, scale: 0.96, transition: { duration: 0.18 } }}
                        >
                            <div className="py-1" role="menu" aria-orientation="vertical">
                                {actions.map(action => (
                                    <Tooltip key={action.label} content={action.disabledTooltip || ''} disabled={!action.disabled || !action.disabledTooltip}>
                                        <motion.button
                                            onClick={action.onClick}
                                            disabled={action.disabled}
                                            className={`w-full text-left flex items-center px-4 py-2 text-sm ${action.isDestructive ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                                            role="menuitem"
                                            whileTap={{ scale: action.disabled ? 1 : 0.97 }}
                                            whileHover={{ scale: action.disabled ? 1 : 1.02 }}
                                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                        >
                                            <span className="material-symbols-outlined mr-3">{action.icon}</span>
                                            {action.label}
                                        </motion.button>
                                    </Tooltip>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cardClasses}>
      <div 
        className={`${onCardClick ? 'cursor-pointer' : ''} ${footerActions ? '' : 'h-full'}`}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {cardContent}
      </div>
      {footerActions && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">{footerActions}</div>
      )}
    </div>
  );
};

// FloatingActionButton
export const FloatingActionButton: React.FC<{ actions: Action[]; id: string; mainIcon?: string; className?: string }> = ({ actions, id, mainIcon, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);
    
    if (!actions || actions.length === 0) return null;

    const hasMultipleActions = actions.length > 1;
    const mainAction = actions[0];
    
    return (
        <div ref={menuRef} className={`fixed bottom-24 right-4 z-20 flex flex-col items-end ${className}`}>
            <AnimatePresence>
                {isOpen && hasMultipleActions && (
                    <motion.div
                        key="fab-menu"
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
                        exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.15 } }}
                        className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 w-64 backdrop-blur"
                    >
                        <div className="p-2">
                            {actions.map((action) => (
                                <motion.button
                                    key={action.label}
                                    onClick={(e) => {action.onClick(e); setIsOpen(false);}}
                                    className="w-full flex items-center gap-4 text-left p-3 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    aria-label={action.label}
                                    whileTap={{ scale: 0.98 }}
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">{action.icon}</span>
                                    <span>{action.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                id={id}
                onClick={hasMultipleActions ? () => setIsOpen(p => !p) : mainAction.onClick}
                className={`flex items-center justify-center size-16 rounded-full shadow-lg transition-colors duration-200 ${isOpen ? 'bg-primary-600' : 'bg-primary-500 hover:bg-primary-600'}`}
                aria-haspopup={hasMultipleActions}
                aria-expanded={isOpen}
                whileTap={{ scale: 0.92 }}
                animate={{ rotate: isOpen ? 45 : 0, scale: isOpen ? 1.05 : 1, transition: { type: 'spring', stiffness: 260, damping: 18 } }}
            >
                <span className="material-symbols-outlined text-4xl text-gray-900">
                    {mainIcon || mainAction.icon}
                </span>
            </motion.button>
        </div>
    );
};