import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Tooltip from './Tooltip';
import { useFocusTrap } from './hooks/useFocusTrap';
import Button from './ui/Button';

export interface DropdownMenuAction {
  label: string;
  icon: string;
  onClick: () => void;
  isDestructive?: boolean;
  disabled?: boolean;
  disabledTooltip?: string;
}

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: DropdownMenuAction[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ isOpen, onClose, title = '', actions }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dropdown-menu-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={modalRef}
            className="bg-white dark:bg-gray-900 rounded-t-[var(--radius-modal)] w-full shadow-[var(--shadow-elev-2)]"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } }}
            exit={{ y: 40, opacity: 0, transition: { duration: 0.2 } }}
          >
            <div className="flex justify-center py-3">
              <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            </div>
            {title && (
              <div className="px-4 pb-2">
                <h2 id="dropdown-menu-title" className="text-sm font-semibold text-gray-500 dark:text-gray-400 text-center truncate">
                  {title}
                </h2>
              </div>
            )}
            <div className="p-2">
              <div className="bg-white/95 dark:bg-gray-800/90 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-elev-1)]">
                {actions.map((action, index) => {
                  const buttonClasses = `w-full text-left flex items-center gap-4 px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    action.isDestructive
                      ? 'text-status-danger-700 dark:text-status-danger-400'
                      : 'text-gray-800 dark:text-gray-200'
                  }`;

                  const button = (
                    <motion.button
                      onClick={() => {
                        if (!action.disabled) {
                          action.onClick();
                          onClose();
                        }
                      }}
                      disabled={action.disabled}
                      className={buttonClasses}
                      whileTap={{ scale: action.disabled ? 1 : 0.97 }}
                      whileHover={{ scale: action.disabled ? 1 : 1.02 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    >
                      <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">{action.icon}</span>
                      <span className="font-medium">{action.label}</span>
                    </motion.button>
                  );

                  const wrapperClasses = `w-full ${index > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}`;

                  if (action.disabled && action.disabledTooltip) {
                    return (
                      <div key={action.label} className={wrapperClasses}>
                        <Tooltip content={action.disabledTooltip} align="top">
                          <div className="cursor-not-allowed">{button}</div>
                        </Tooltip>
                      </div>
                    );
                  }
                  return (
                    <div key={action.label} className={wrapperClasses}>
                      {button}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-2">
              <Button variant="secondary" block onClick={onClose}>Annuler</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DropdownMenu;
