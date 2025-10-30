import { useRef, useCallback } from 'react';

/**
 * Throttles a function to run at most once per specified interval
 * Useful for scroll handlers, resize handlers, and other high-frequency events
 * 
 * @param callback - Function to throttle
 * @param delay - Minimum time between calls in milliseconds (default: 300ms)
 * @returns Throttled function
 * 
 * @example
 * const handleScroll = useThrottle((event) => {
 *   console.log('Scrolled', event);
 * }, 100);
 * 
 * <div onScroll={handleScroll}>...</div>
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRan = now - lastRan.current;

      if (timeSinceLastRan >= delay) {
        // Execute immediately if enough time has passed
        callback(...args);
        lastRan.current = now;
      } else {
        // Schedule execution for the remaining time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - timeSinceLastRan);
      }
    },
    [callback, delay]
  );
}
