import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  logError,
  getErrorLogs,
  clearErrorLogs,
  logMessage,
  withErrorLogging,
  getRecentErrors,
} from '../../../utils/errorTracking';

describe('errorTracking', () => {
  beforeEach(() => {
    clearErrorLogs();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('logError', () => {
    it('should log an error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };

      logError(error, context, 'medium');

      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test error');
      expect(logs[0].context).toEqual(context);
      expect(logs[0].severity).toBe('medium');
    });

    it('should store errors in localStorage', () => {
      const error = new Error('Storage test');

      logError(error, {}, 'low');

      const stored = getRecentErrors();
      expect(stored).toHaveLength(1);
      expect(stored[0].message).toBe('Storage test');
    });

    it('should limit stored errors to 10', () => {
      // Log 15 errors
      for (let i = 0; i < 15; i++) {
        logError(new Error(`Error ${i}`), {}, 'low');
      }

      const stored = getRecentErrors();
      expect(stored).toHaveLength(10);
      // Should keep most recent
      expect(stored[0].message).toBe('Error 5');
    });

    it('should handle different severity levels', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      logError(new Error('Critical'), {}, 'critical');
      expect(consoleSpy).toHaveBeenCalled();

      logError(new Error('Low'), {}, 'low');
      expect(warnSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe('logMessage', () => {
    it('should log a custom message', () => {
      logMessage('Custom message', { test: true }, 'low');

      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Custom message');
      expect(logs[0].context).toEqual({ test: true });
    });
  });

  describe('withErrorLogging', () => {
    it('should wrap a synchronous function', () => {
      const fn = vi.fn((x: number) => x * 2);
      const wrapped = withErrorLogging(fn, { source: 'test' });

      const result = wrapped(5);
      expect(result).toBe(10);
      expect(fn).toHaveBeenCalledWith(5);
    });

    it('should catch and log synchronous errors', () => {
      const fn = vi.fn(() => {
        throw new Error('Sync error');
      });
      const wrapped = withErrorLogging(fn, { source: 'test' });

      expect(() => wrapped()).toThrow('Sync error');

      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Sync error');
    });

    it('should wrap an async function', async () => {
      const fn = vi.fn(async (x: number) => x * 2);
      const wrapped = withErrorLogging(fn, { source: 'test' });

      const result = await wrapped(5);
      expect(result).toBe(10);
      expect(fn).toHaveBeenCalledWith(5);
    });

    it('should catch and log async errors', async () => {
      const fn = vi.fn(async () => {
        throw new Error('Async error');
      });
      const wrapped = withErrorLogging(fn, { source: 'test' });

      await expect(wrapped()).rejects.toThrow('Async error');

      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Async error');
    });
  });

  describe('clearErrorLogs', () => {
    it('should clear all error logs', () => {
      logError(new Error('Test 1'), {}, 'low');
      logError(new Error('Test 2'), {}, 'low');

      expect(getErrorLogs()).toHaveLength(2);

      clearErrorLogs();

      expect(getErrorLogs()).toHaveLength(0);
      expect(getRecentErrors()).toHaveLength(0);
    });
  });
});
