import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  secureStorage,
  savePreference,
  getPreference,
  saveSensitiveData,
  getSensitiveData,
  cacheData,
  getCachedData,
} from '../../../utils/secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setItem and getItem', () => {
    it('should store and retrieve a simple value', () => {
      const value = { name: 'Test', count: 42 };
      secureStorage.setItem('test', value);

      const retrieved = secureStorage.getItem('test');
      expect(retrieved).toEqual(value);
    });

    it('should handle null values', () => {
      const result = secureStorage.getItem('nonexistent');
      expect(result).toBeNull();
    });

    it('should store secure values with obfuscation', () => {
      const sensitiveValue = { password: '1234', token: 'abc' };
      secureStorage.setItem('secure-test', sensitiveValue, { secure: true });

      // Check that stored value is not plain text
      const rawStored = localStorage.getItem('neemba_secure-test');
      expect(rawStored).not.toContain('1234');
      expect(rawStored).not.toContain('abc');

      // But can be retrieved correctly
      const retrieved = secureStorage.getItem('secure-test', true);
      expect(retrieved).toEqual(sensitiveValue);
    });

    it('should handle expiration', async () => {
      vi.useFakeTimers();

      secureStorage.setItem('expiring', { data: 'test' }, { expiresIn: 1000 });

      // Should exist immediately
      expect(secureStorage.getItem('expiring')).toEqual({ data: 'test' });

      // Fast forward past expiration
      vi.advanceTimersByTime(1001);

      // Should be expired
      expect(secureStorage.getItem('expiring')).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('removeItem', () => {
    it('should remove an item', () => {
      secureStorage.setItem('test', { value: 'data' });
      expect(secureStorage.getItem('test')).not.toBeNull();

      secureStorage.removeItem('test');
      expect(secureStorage.getItem('test')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all items with app prefix', () => {
      secureStorage.setItem('item1', { data: 1 });
      secureStorage.setItem('item2', { data: 2 });
      localStorage.setItem('other_item', 'should remain');

      secureStorage.clear();

      expect(secureStorage.getItem('item1')).toBeNull();
      expect(secureStorage.getItem('item2')).toBeNull();
      expect(localStorage.getItem('other_item')).toBe('should remain');
    });
  });

  describe('clearExpired', () => {
    it('should remove only expired items', async () => {
      vi.useFakeTimers();

      secureStorage.setItem('short', { data: 'expires' }, { expiresIn: 100 });
      secureStorage.setItem('long', { data: 'stays' }, { expiresIn: 10000 });
      secureStorage.setItem('forever', { data: 'permanent' });

      vi.advanceTimersByTime(150);

      secureStorage.clearExpired();

      expect(secureStorage.getItem('short')).toBeNull();
      expect(secureStorage.getItem('long')).toEqual({ data: 'stays' });
      expect(secureStorage.getItem('forever')).toEqual({ data: 'permanent' });

      vi.useRealTimers();
    });
  });

  describe('getStorageSize', () => {
    it('should calculate approximate storage size', () => {
      const sizeBefore = secureStorage.getStorageSize();

      secureStorage.setItem('large-data', {
        data: 'x'.repeat(1000),
      });

      const sizeAfter = secureStorage.getStorageSize();
      expect(sizeAfter).toBeGreaterThan(sizeBefore);
    });
  });

  describe('helper functions', () => {
    it('savePreference and getPreference should work', () => {
      savePreference('theme', 'dark');
      expect(getPreference('theme', 'light')).toBe('dark');
    });

    it('getPreference should return default if not found', () => {
      expect(getPreference('nonexistent', 'default')).toBe('default');
    });

    it('saveSensitiveData and getSensitiveData should work', () => {
      saveSensitiveData('pin', '1234');
      
      // Should be obfuscated in storage
      const rawStored = localStorage.getItem('neemba_sensitive_pin');
      expect(rawStored).not.toContain('1234');

      // But retrievable
      expect(getSensitiveData('pin')).toBe('1234');
    });

    it('cacheData and getCachedData should work', () => {
      const data = { user: 'test', id: 123 };
      cacheData('user-data', data, 5000);

      expect(getCachedData('user-data')).toEqual(data);
    });

    it('cached data should expire', async () => {
      vi.useFakeTimers();

      cacheData('temp', { value: 'test' }, 1000);
      expect(getCachedData('temp')).toEqual({ value: 'test' });

      vi.advanceTimersByTime(1001);
      expect(getCachedData('temp')).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should handle corrupted data gracefully', () => {
      // Manually corrupt data
      localStorage.setItem('neemba_corrupted', 'invalid-json{{{');

      expect(secureStorage.getItem('corrupted')).toBeNull();
      // Corrupted data should be removed
      expect(localStorage.getItem('neemba_corrupted')).toBeNull();
    });

    it('should handle quota exceeded', () => {
      const originalSetItem = localStorage.setItem;
      let callCount = 0;

      // Mock quota exceeded on first call, succeed on second
      localStorage.setItem = vi.fn((key, value) => {
        callCount++;
        if (callCount === 1) {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        return originalSetItem.call(localStorage, key, value);
      });

      // Should handle gracefully
      const result = secureStorage.setItem('test', { data: 'value' });
      expect(result).toBe(true);

      localStorage.setItem = originalSetItem;
    });
  });
});
