/**
 * Secure storage utility for localStorage with encryption and validation
 * Protects sensitive data and handles storage errors gracefully
 */

import { logError } from './errorTracking';

// Simple obfuscation key (in production, use proper encryption library)
const OBFUSCATION_KEY = 'neemba-tracker-2024';

/**
 * Simple XOR-based obfuscation (NOT cryptographically secure)
 * For production, use a proper encryption library like crypto-js
 */
function obfuscate(text: string): string {
  return btoa(
    text
      .split('')
      .map((char, i) => 
        String.fromCharCode(
          char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
        )
      )
      .join('')
  );
}

function deobfuscate(encoded: string): string {
  try {
    const decoded = atob(encoded);
    return decoded
      .split('')
      .map((char, i) => 
        String.fromCharCode(
          char.charCodeAt(0) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
        )
      )
      .join('');
  } catch (error) {
    logError(error as Error, { context: 'deobfuscate' }, 'low');
    throw new Error('Failed to deobfuscate data');
  }
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Storage options
 */
interface StorageOptions {
  /** Whether to obfuscate the value (for sensitive data) */
  secure?: boolean;
  /** Expiration time in milliseconds */
  expiresIn?: number;
}

interface StoredData<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Secure storage wrapper for localStorage
 */
class SecureStorage {
  private prefix = 'neemba_';

  /**
   * Set an item in storage
   */
  setItem<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    if (!isStorageAvailable()) {
      logError(new Error('localStorage not available'), { key }, 'medium');
      return false;
    }

    try {
      const data: StoredData<T> = {
        value,
        timestamp: Date.now(),
        expiresAt: options.expiresIn ? Date.now() + options.expiresIn : undefined,
      };

      let serialized = JSON.stringify(data);
      
      if (options.secure) {
        serialized = obfuscate(serialized);
      }

      localStorage.setItem(this.prefix + key, serialized);
      return true;
    } catch (error) {
      logError(error as Error, { key, context: 'setItem' }, 'medium');
      
      // Handle quota exceeded error
      if ((error as Error).name === 'QuotaExceededError') {
        this.clearExpired();
        // Try again after clearing
        try {
          const data: StoredData<T> = {
            value,
            timestamp: Date.now(),
            expiresAt: options.expiresIn ? Date.now() + options.expiresIn : undefined,
          };
          let serialized = JSON.stringify(data);
          if (options.secure) {
            serialized = obfuscate(serialized);
          }
          localStorage.setItem(this.prefix + key, serialized);
          return true;
        } catch (retryError) {
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Get an item from storage
   */
  getItem<T>(key: string, secure: boolean = false): T | null {
    if (!isStorageAvailable()) {
      return null;
    }

    try {
      const item = localStorage.getItem(this.prefix + key);
      
      if (item === null) {
        return null;
      }

      let parsed: string = item;
      
      if (secure) {
        parsed = deobfuscate(item);
      }

      const data: StoredData<T> = JSON.parse(parsed);

      // Check expiration
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      logError(error as Error, { key, context: 'getItem' }, 'low');
      // Remove corrupted data
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remove an item from storage
   */
  removeItem(key: string): void {
    if (!isStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      logError(error as Error, { key, context: 'removeItem' }, 'low');
    }
  }

  /**
   * Clear all items with the app prefix
   */
  clear(): void {
    if (!isStorageAvailable()) {
      return;
    }

    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logError(error as Error, { context: 'clear' }, 'medium');
    }
  }

  /**
   * Clear expired items
   */
  clearExpired(): void {
    if (!isStorageAvailable()) {
      return;
    }

    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      const now = Date.now();

      keys.forEach(fullKey => {
        try {
          const item = localStorage.getItem(fullKey);
          if (!item) return;

          const data: StoredData<any> = JSON.parse(item);
          if (data.expiresAt && now > data.expiresAt) {
            localStorage.removeItem(fullKey);
          }
        } catch (e) {
          // Remove corrupted items
          localStorage.removeItem(fullKey);
        }
      });
    } catch (error) {
      logError(error as Error, { context: 'clearExpired' }, 'low');
    }
  }

  /**
   * Get storage size in bytes (approximate)
   */
  getStorageSize(): number {
    if (!isStorageAvailable()) {
      return 0;
    }

    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      return keys.reduce((total, key) => {
        const item = localStorage.getItem(key);
        return total + (item ? item.length : 0);
      }, 0) * 2; // Approximate: 2 bytes per character
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if storage is nearly full (>80% of 5MB typical limit)
   */
  isStorageNearlyFull(): boolean {
    const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB
    const THRESHOLD = 0.8;
    
    return this.getStorageSize() > STORAGE_LIMIT * THRESHOLD;
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

/**
 * Helper functions for common storage patterns
 */

// Store user preferences (not sensitive)
export function savePreference(key: string, value: any): void {
  secureStorage.setItem(`pref_${key}`, value);
}

export function getPreference<T>(key: string, defaultValue: T): T {
  const value = secureStorage.getItem<T>(`pref_${key}`);
  return value !== null ? value : defaultValue;
}

// Store sensitive data (obfuscated)
export function saveSensitiveData(key: string, value: any, expiresIn?: number): void {
  secureStorage.setItem(`sensitive_${key}`, value, { secure: true, expiresIn });
}

export function getSensitiveData<T>(key: string): T | null {
  return secureStorage.getItem<T>(`sensitive_${key}`, true);
}

// Cache data with expiration
export function cacheData<T>(key: string, value: T, expiresInMs: number = 3600000): void {
  secureStorage.setItem(`cache_${key}`, value, { expiresIn: expiresInMs });
}

export function getCachedData<T>(key: string): T | null {
  return secureStorage.getItem<T>(`cache_${key}`);
}

// Session data (expires when tab closes - using sessionStorage would be better)
export function saveSessionData(key: string, value: any): void {
  // For now, use short expiration (1 hour)
  secureStorage.setItem(`session_${key}`, value, { expiresIn: 3600000 });
}

export function getSessionData<T>(key: string): T | null {
  return secureStorage.getItem<T>(`session_${key}`);
}
