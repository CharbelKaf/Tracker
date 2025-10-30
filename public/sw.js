/**
 * Service Worker for Neemba Tracker PWA
 * Implements caching strategies and offline support
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `neemba-tracker-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, fallback to network
  CACHE_FIRST: 'cache-first',
  // Network first, fallback to cache
  NETWORK_FIRST: 'network-first',
  // Network only
  NETWORK_ONLY: 'network-only',
  // Cache only
  CACHE_ONLY: 'cache-only',
  // Stale while revalidate
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Route patterns
const ROUTE_PATTERNS = {
  // Static assets (CSS, JS, images) - Cache first
  static: /\.(css|js|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$/,
  // API calls - Network first
  api: /\/api\//,
  // Pages - Network first
  pages: /\/(inventory|users|assignments|models|categories)/,
};

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - Clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - Handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Determine strategy based on URL pattern
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;

  if (ROUTE_PATTERNS.static.test(url.pathname)) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  } else if (ROUTE_PATTERNS.api.test(url.pathname)) {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  } else if (ROUTE_PATTERNS.pages.test(url.pathname)) {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  }

  event.respondWith(handleRequest(request, strategy));
});

/**
 * Handle request based on strategy
 */
async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request, cache);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);
    
    default:
      return networkFirst(request, cache);
  }
}

/**
 * Cache First strategy
 */
async function cacheFirst(request, cache) {
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return createErrorResponse();
  }
}

/**
 * Network First strategy
 */
async function networkFirst(request, cache) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache');
    
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match(OFFLINE_URL);
      if (offlinePage) {
        return offlinePage;
      }
    }

    return createErrorResponse();
  }
}

/**
 * Stale While Revalidate strategy
 */
async function staleWhileRevalidate(request, cache) {
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

/**
 * Cache Only strategy
 */
async function cacheOnly(request, cache) {
  const cached = await cache.match(request);
  return cached || createErrorResponse();
}

/**
 * Network Only strategy
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return createErrorResponse();
  }
}

/**
 * Create error response
 */
function createErrorResponse() {
  return new Response('Network error', {
    status: 408,
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

/**
 * Sync data with server
 */
async function syncData() {
  try {
    // Get pending sync data from IndexedDB or localStorage
    // This is a placeholder - implement based on your data structure
    console.log('[SW] Syncing data with server...');
    
    // Example: Sync pending equipment updates
    const pendingUpdates = await getPendingUpdates();
    
    for (const update of pendingUpdates) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        
        // Remove from pending list after successful sync
        await removePendingUpdate(update.id);
      } catch (error) {
        console.error('[SW] Failed to sync update:', error);
      }
    }
    
    console.log('[SW] Data sync completed');
  } catch (error) {
    console.error('[SW] Data sync failed:', error);
    throw error;
  }
}

/**
 * Get pending updates (placeholder)
 */
async function getPendingUpdates() {
  // Implement based on your storage solution
  return [];
}

/**
 * Remove pending update (placeholder)
 */
async function removePendingUpdate(id) {
  // Implement based on your storage solution
  console.log('[SW] Removed pending update:', id);
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Neemba Tracker';
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[SW] Service Worker loaded');
