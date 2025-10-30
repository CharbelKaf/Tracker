import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to manage PWA installation
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`[PWA] User response: ${outcome}`);
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    setIsInstallable(false);
    setDeferredPrompt(null);
  }, []);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
  };
}

/**
 * Hook to register service worker
 */
export function useServiceWorker(swUrl: string = '/sw.js') {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service Workers not supported');
      return;
    }

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register(swUrl);
        console.log('[SW] Registered successfully');
        
        setRegistration(reg);
        setIsRegistered(true);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Update available');
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        });

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Controller changed, reloading...');
          window.location.reload();
        });

        // Check for updates every hour
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error('[SW] Registration failed:', error);
      }
    };

    registerSW();
  }, [swUrl]);

  const updateServiceWorker = useCallback(() => {
    if (!waitingWorker) return;

    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingWorker]);

  const unregister = useCallback(async () => {
    if (!registration) return false;

    try {
      const success = await registration.unregister();
      if (success) {
        console.log('[SW] Unregistered successfully');
        setIsRegistered(false);
        setRegistration(null);
      }
      return success;
    } catch (error) {
      console.error('[SW] Unregister failed:', error);
      return false;
    }
  }, [registration]);

  return {
    registration,
    isRegistered,
    updateAvailable,
    updateServiceWorker,
    unregister,
  };
}

/**
 * Hook to detect if app is running in standalone mode
 */
export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      // Check display-mode media query
      const displayMode = window.matchMedia('(display-mode: standalone)');
      
      // Check iOS standalone
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      setIsStandalone(displayMode.matches || isIOSStandalone);
    };

    checkStandalone();

    // Listen for display mode changes
    const displayMode = window.matchMedia('(display-mode: standalone)');
    displayMode.addEventListener('change', checkStandalone);

    return () => {
      displayMode.removeEventListener('change', checkStandalone);
    };
  }, []);

  return isStandalone;
}

/**
 * Hook to request persistent storage
 */
export function usePersistentStorage() {
  const [isPersisted, setIsPersisted] = useState(false);
  const [canPersist, setCanPersist] = useState(false);

  useEffect(() => {
    if (!navigator.storage || !navigator.storage.persist) {
      return;
    }

    const checkPersistence = async () => {
      const persisted = await navigator.storage.persisted();
      setIsPersisted(persisted);
      setCanPersist(true);
    };

    checkPersistence();
  }, []);

  const requestPersistence = useCallback(async () => {
    if (!navigator.storage || !navigator.storage.persist) {
      return false;
    }

    try {
      const persisted = await navigator.storage.persist();
      setIsPersisted(persisted);
      return persisted;
    } catch (error) {
      console.error('[Storage] Persistence request failed:', error);
      return false;
    }
  }, []);

  return {
    isPersisted,
    canPersist,
    requestPersistence,
  };
}

/**
 * Hook to get storage estimate
 */
export function useStorageEstimate() {
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    if (!navigator.storage || !navigator.storage.estimate) {
      return;
    }

    const getEstimate = async () => {
      try {
        const est = await navigator.storage.estimate();
        setEstimate({
          usage: est.usage || 0,
          quota: est.quota || 0,
        });
      } catch (error) {
        console.error('[Storage] Estimate failed:', error);
      }
    };

    getEstimate();
  }, []);

  const refresh = useCallback(async () => {
    if (!navigator.storage || !navigator.storage.estimate) {
      return;
    }

    try {
      const est = await navigator.storage.estimate();
      setEstimate({
        usage: est.usage || 0,
        quota: est.quota || 0,
      });
    } catch (error) {
      console.error('[Storage] Estimate refresh failed:', error);
    }
  }, []);

  const usagePercentage = estimate 
    ? (estimate.usage / estimate.quota) * 100 
    : 0;

  return {
    ...estimate,
    usagePercentage,
    refresh,
  };
}
