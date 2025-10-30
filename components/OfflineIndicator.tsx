import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '../hooks/usePWA';

/**
 * Offline indicator component
 * Shows a banner when the app is offline
 */
export const OfflineIndicator: React.FC<{
  /** Position */
  position?: 'top' | 'bottom';
  /** Show reconnecting state */
  showReconnecting?: boolean;
}> = ({ position = 'top', showReconnecting = true }) => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline) {
      // Show "reconnected" message briefly
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const positionClasses = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          initial={{ y: position === 'top' ? -100 : 100 }}
          animate={{ y: 0 }}
          exit={{ y: position === 'top' ? -100 : 100 }}
          className={`fixed ${positionClasses} left-0 right-0 z-50`}
        >
          <div
            className={`${
              showReconnected
                ? 'bg-green-500'
                : 'bg-orange-500'
            } text-white px-4 py-3 text-center shadow-lg`}
          >
            <div className="flex items-center justify-center gap-2">
              {showReconnected ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Reconnecté ! Synchronisation en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                  <span className="font-medium">Mode hors ligne</span>
                  <span className="text-sm opacity-90">• Les modifications seront synchronisées à la reconnexion</span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Simple online/offline status badge
 */
export const OnlineStatusBadge: React.FC<{
  showWhenOnline?: boolean;
}> = ({ showWhenOnline = false }) => {
  const isOnline = useOnlineStatus();

  if (isOnline && !showWhenOnline) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      isOnline 
        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
        : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
    }`}>
      <span className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-orange-500'
      }`} />
      <span className="font-medium">
        {isOnline ? 'En ligne' : 'Hors ligne'}
      </span>
    </div>
  );
};
