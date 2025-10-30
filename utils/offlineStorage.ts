/**
 * Offline storage using IndexedDB
 * Manages pending operations and offline data
 */

const DB_NAME = 'neemba-offline';
const DB_VERSION = 1;
const STORES = {
  PENDING_OPERATIONS: 'pendingOperations',
  OFFLINE_DATA: 'offlineData',
  SYNC_QUEUE: 'syncQueue',
};

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Pending operations store
      if (!db.objectStoreNames.contains(STORES.PENDING_OPERATIONS)) {
        const store = db.createObjectStore(STORES.PENDING_OPERATIONS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }

      // Offline data cache
      if (!db.objectStoreNames.contains(STORES.OFFLINE_DATA)) {
        const store = db.createObjectStore(STORES.OFFLINE_DATA, {
          keyPath: 'key',
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Sync queue
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
      }
    };
  });
}

/**
 * Pending operation
 */
export interface PendingOperation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
  retryCount?: number;
}

/**
 * Add pending operation
 */
export async function addPendingOperation(
  operation: Omit<PendingOperation, 'id' | 'timestamp'>
): Promise<number> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    
    const request = store.add({
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
    });

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending operations
 */
export async function getPendingOperations(): Promise<PendingOperation[]> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove pending operation
 */
export async function removePendingOperation(id: number): Promise<void> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update retry count
 */
export async function updateRetryCount(id: number): Promise<void> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const operation = getRequest.result;
      if (operation) {
        operation.retryCount = (operation.retryCount || 0) + 1;
        const putRequest = store.put(operation);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Cache data offline
 */
export async function cacheOfflineData(key: string, data: any): Promise<void> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.OFFLINE_DATA], 'readwrite');
    const store = transaction.objectStore(STORES.OFFLINE_DATA);
    
    const request = store.put({
      key,
      data,
      timestamp: Date.now(),
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached data
 */
export async function getCachedData<T = any>(key: string): Promise<T | null> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.OFFLINE_DATA], 'readonly');
    const store = transaction.objectStore(STORES.OFFLINE_DATA);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.data : null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PENDING_OPERATIONS, STORES.OFFLINE_DATA, STORES.SYNC_QUEUE],
      'readwrite'
    );

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    transaction.objectStore(STORES.PENDING_OPERATIONS).clear();
    transaction.objectStore(STORES.OFFLINE_DATA).clear();
    transaction.objectStore(STORES.SYNC_QUEUE).clear();
  });
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string = 'sync-data'): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('sync' in (navigator as any).serviceWorker)) {
    console.warn('[Sync] Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
    console.log('[Sync] Registered:', tag);
    return true;
  } catch (error) {
    console.error('[Sync] Registration failed:', error);
    return false;
  }
}

/**
 * Sync pending operations
 */
export async function syncPendingOperations(
  apiEndpoint: string = '/api/sync'
): Promise<{ success: number; failed: number }> {
  const operations = await getPendingOperations();
  
  let success = 0;
  let failed = 0;

  for (const operation of operations) {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      });

      if (response.ok) {
        await removePendingOperation(operation.id!);
        success++;
      } else {
        await updateRetryCount(operation.id!);
        failed++;
      }
    } catch (error) {
      console.error('[Sync] Operation failed:', error);
      await updateRetryCount(operation.id!);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  pendingCount: number;
  oldestTimestamp: number | null;
}> {
  const operations = await getPendingOperations();
  
  return {
    pendingCount: operations.length,
    oldestTimestamp: operations.length > 0
      ? Math.min(...operations.map(op => op.timestamp))
      : null,
  };
}
