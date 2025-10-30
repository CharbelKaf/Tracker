import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '../../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    );

    expect(result.current).toBe('first');

    // Change value
    rerender({ value: 'second', delay: 300 });
    expect(result.current).toBe('first'); // Still old value

    // Wait for debounce
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(result.current).toBe('second');
    });
  });

  it('should reset timer on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } }
    );

    // Rapid changes
    rerender({ value: 'second' });
    vi.advanceTimersByTime(100);
    
    rerender({ value: 'third' });
    vi.advanceTimersByTime(100);
    
    rerender({ value: 'fourth' });
    vi.advanceTimersByTime(100);

    // Should still be first value (timers keep resetting)
    expect(result.current).toBe('first');

    // Wait full duration
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(result.current).toBe('fourth');
    });
  });

  it('should handle different delay values', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    rerender({ value: 'second', delay: 500 });

    vi.advanceTimersByTime(300);
    expect(result.current).toBe('first'); // Still waiting

    vi.advanceTimersByTime(200);
    await waitFor(() => {
      expect(result.current).toBe('second');
    });
  });

  it('should handle objects and arrays', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: { name: 'first' } } }
    );

    expect(result.current).toEqual({ name: 'first' });

    rerender({ value: { name: 'second' } });
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toEqual({ name: 'second' });
    });
  });

  it('should use default delay of 300ms', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    vi.advanceTimersByTime(299);
    expect(result.current).toBe('first');

    vi.advanceTimersByTime(1);
    await waitFor(() => {
      expect(result.current).toBe('second');
    });
  });
});
