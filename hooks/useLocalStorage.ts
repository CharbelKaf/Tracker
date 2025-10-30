import { useState, useEffect, useCallback } from 'react';
import { secureStorage } from '../utils/secureStorage';
import { logError } from '../utils/errorTracking';

/**
 * React hook for using localStorage with automatic synchronization
 * Similar to useState but persists to localStorage
 * 
 * @param key - Storage key
 * @param initialValue - Initial value if not in storage
 * @param options - Storage options (secure, expiresIn)
 * @returns [value, setValue, removeValue]
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * const [token, setToken, removeToken] = useLocalStorage('auth_token', null, { secure: true });
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: { secure?: boolean; expiresIn?: number } = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from secure storage
      const item = secureStorage.getItem<T>(key, options.secure);
      return item !== null ? item : initialValue;
    } catch (error) {
      logError(error as Error, { key, context: 'useLocalStorage init' }, 'low');
      return initialValue;
    }
  });

  // Return a wrapped version of setValue that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to secure storage
        secureStorage.setItem(key, valueToStore, options);
      } catch (error) {
        logError(error as Error, { key, context: 'useLocalStorage setValue' }, 'medium');
      }
    },
    [key, options, storedValue]
  );

  // Remove value from storage
  const removeValue = useCallback(() => {
    try {
      secureStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logError(error as Error, { key, context: 'useLocalStorage removeValue' }, 'low');
    }
  }, [key, initialValue]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `neemba_${key}` && e.newValue !== null) {
        try {
          const newValue = secureStorage.getItem<T>(key, options.secure);
          if (newValue !== null) {
            setStoredValue(newValue);
          }
        } catch (error) {
          logError(error as Error, { key, context: 'useLocalStorage storageChange' }, 'low');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, options.secure]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for storing user preferences
 */
export function usePreference<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useLocalStorage(`pref_${key}`, defaultValue);
}

/**
 * Hook for session data (expires after 1 hour)
 */
export function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useLocalStorage(`session_${key}`, initialValue, { expiresIn: 3600000 });
}

/**
 * Hook for cached data with custom expiration
 */
export function useCachedData<T>(
  key: string,
  initialValue: T,
  expiresInMs: number = 3600000
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  return useLocalStorage(`cache_${key}`, initialValue, { expiresIn: expiresInMs });
}
