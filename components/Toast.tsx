import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
  actionLabel?: string;
  onAction?: () => void;
}

const TOAST_DURATION = 3000;

const Toast: React.FC<ToastProps> = ({ id, message, type, onDismiss, actionLabel, onAction }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) return;
    const fallback = setTimeout(() => onDismiss(id), 400);
    return () => clearTimeout(fallback);
  }, [isVisible, id, onDismiss]);

  const styles = {
    success: {
      icon: 'check_circle',
      container: 'bg-status-success-50 dark:bg-status-success-900/30',
      iconColor: 'text-status-success-500 dark:text-status-success-300',
      progress: 'bg-status-success-400',
    },
    error: {
      icon: 'error',
      container: 'bg-status-danger-50 dark:bg-status-danger-900/30',
      iconColor: 'text-status-danger-500 dark:text-status-danger-300',
      progress: 'bg-status-danger-400',
    },
    info: {
      icon: 'info',
      container: 'bg-status-info-50 dark:bg-status-info-900/30',
      iconColor: 'text-status-info-500 dark:text-status-info-300',
      progress: 'bg-status-info-400',
    },
  };

  const config = styles[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } }}
          exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
          className={`relative flex w-full max-w-sm items-center gap-4 overflow-hidden rounded-lg p-4 shadow-lg ring-1 ring-black/5 dark:ring-white/10 ${config.container}`}
          onAnimationComplete={(definition) => {
            if (definition === 'exit') {
              onDismiss(id);
            }
          }}
        >
          <span className={`material-symbols-outlined text-2xl ${config.iconColor}`}>{config.icon}</span>
          <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{message}</p>
          {actionLabel && (
            <motion.button
              onClick={() => {
                try { onAction && onAction(); } finally { setIsVisible(false); }
              }}
              className="rounded-md px-2 py-1 text-xs font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-400"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            >
              {actionLabel}
            </motion.button>
          )}
          <motion.button
            onClick={() => setIsVisible(false)}
            className="flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Fermer"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <span className="material-symbols-outlined">close</span>
          </motion.button>
          <motion.div
            className={`absolute bottom-0 left-0 h-1 ${config.progress}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%', transition: { duration: TOAST_DURATION / 1000, ease: 'linear' } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;