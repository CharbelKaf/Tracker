import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './usePWA';
import {
  addPendingOperation,
  getPendingOperations,
  syncPendingOperations,
  getSyncStatus,
  registerBackgroundSync,
  PendingOperation,
} from '../utils/offlineStorage';

/**
 * Hook to manage offline operations and sync
 */
export function useOfflineSync(options: {
  /** API endpoint for sync */
  syncEndpoint?: string;
  /** Auto-sync when back online */
  autoSync?: boolean;
  /** Sync interval (ms) */
  syncInterval?: number;
} = {}) {
  const {
    syncEndpoint = '/api/sync',
    autoSync = true,
    syncInterval = 30000, // 30 seconds
  } = options;

  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      setPendingCount(status.pendingCount);
    } catch (error) {
      console.error('[Sync] Failed to get status:', error);
    }
  }, []);

  // Perform sync
  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await syncPendingOperations(syncEndpoint);
      console.log('[Sync] Completed:', result);
      
      setLastSyncTime(Date.now());
      await updatePendingCount();

      if (result.failed > 0) {
        setSyncError(`${result.failed} opération(s) ont échoué`);
      }

      return result;
    } catch (error) {
      console.error('[Sync] Failed:', error);
      setSyncError('Échec de la synchronisation');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, syncEndpoint, updatePendingCount]);

  // Add operation to queue
  const queueOperation = useCallback(
    async (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => {
      try {
        await addPendingOperation(operation);
        await updatePendingCount();

        // Register background sync
        if ('serviceWorker' in navigator) {
          await registerBackgroundSync();
        }

        // Try immediate sync if online
        if (isOnline && autoSync) {
          sync();
        }
      } catch (error) {
        console.error('[Sync] Failed to queue operation:', error);
        throw error;
      }
    },
    [isOnline, autoSync, sync, updatePendingCount]
  );

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && autoSync && pendingCount > 0) {
      console.log('[Sync] Back online, syncing...');
      sync();
    }
  }, [isOnline, autoSync, pendingCount, sync]);

  // Periodic sync
  useEffect(() => {
    if (!isOnline || !autoSync || syncInterval <= 0) return;

    const interval = setInterval(() => {
      if (pendingCount > 0) {
        sync();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [isOnline, autoSync, syncInterval, pendingCount, sync]);

  // Initialize pending count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  return {
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,
    sync,
    queueOperation,
    refresh: updatePendingCount,
  };
}

/**
 * Hook to detect sync events
 */
export function useSyncEvents(callback: (event: { type: string; data?: any }) => void) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type && event.data.type.startsWith('sync-')) {
        callback(event.data);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [callback]);
}
