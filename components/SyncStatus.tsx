import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useOnlineStatus } from '../hooks/usePWA';

/**
 * Sync status indicator component
 */
export const SyncStatus: React.FC<{
  /** Show when no pending operations */
  showWhenEmpty?: boolean;
  /** Compact mode */
  compact?: boolean;
}> = ({ showWhenEmpty = false, compact = false }) => {
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingCount, lastSyncTime, syncError, sync } = useOfflineSync();

  const hasPending = pendingCount > 0;

  if (!showWhenEmpty && !hasPending && !isSyncing) {
    return null;
  }

  const getTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return null;
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    return `Il y a ${Math.floor(seconds / 86400)} j`;
  };

  if (compact) {
    return (
      <button
        onClick={sync}
        disabled={!isOnline || isSyncing || pendingCount === 0}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          isSyncing
            ? 'Synchronisation...'
            : pendingCount > 0
            ? `${pendingCount} opération(s) en attente`
            : 'Synchronisé'
        }
      >
        <AnimatePresence mode="wait">
          {isSyncing ? (
            <motion.svg
              key="syncing"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`w-5 h-5 ${
                syncError
                  ? 'text-red-500'
                  : pendingCount > 0
                  ? 'text-orange-500'
                  : 'text-green-500'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  syncError
                    ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    : pendingCount > 0
                    ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                }
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Badge */}
        {pendingCount > 0 && !isSyncing && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full"
          >
            {pendingCount > 99 ? '99+' : pendingCount}
          </motion.span>
        )}
      </button>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isSyncing ? (
              <motion.svg
                key="syncing"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </motion.svg>
            ) : (
              <motion.svg
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`w-5 h-5 ${
                  syncError
                    ? 'text-red-500'
                    : pendingCount > 0
                    ? 'text-orange-500'
                    : 'text-green-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    syncError
                      ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      : pendingCount > 0
                      ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  }
                />
              </motion.svg>
            )}
          </AnimatePresence>

          <span className="font-medium text-gray-900 dark:text-gray-100">
            {isSyncing
              ? 'Synchronisation...'
              : syncError
              ? 'Erreur de sync'
              : pendingCount > 0
              ? `${pendingCount} en attente`
              : 'Synchronisé'}
          </span>
        </div>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={sync}
            className="px-3 py-1 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            Synchroniser
          </button>
        )}
      </div>

      {syncError && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
          {syncError}
        </p>
      )}

      {lastSyncTime && !isSyncing && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Dernière sync : {getTimeAgo(lastSyncTime)}
        </p>
      )}

      {!isOnline && pendingCount > 0 && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
          Sera synchronisé à la reconnexion
        </p>
      )}
    </div>
  );
};
