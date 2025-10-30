/**
 * Performance utilities for optimizing React applications
 * Includes lazy loading, memoization helpers, and performance monitoring
 */

import { lazy, ComponentType, createElement } from 'react';

/**
 * Lazy load a component with optional preload function
 * Usage: const Dashboard = lazyWithPreload(() => import('./Dashboard'))
 */
export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const Component = lazy(factory);
  
  // Add preload method
  (Component as any).preload = factory;
  
  return Component as typeof Component & { preload: () => Promise<{ default: T }> };
}

/**
 * Preload a route component when hovering over a link
 */
export function preloadRoute(routeLoader: () => Promise<any>) {
  return () => {
    routeLoader();
  };
}

/**
 * Deep comparison for React.memo or useMemo
 * Useful when comparing complex objects
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Shallow comparison for React.memo
 * More performant than deep comparison
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => a[key] === b[key]);
}

/**
 * Performance monitor to track component render times
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();
  
  /**
   * Start measuring a component render
   */
  start(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      
      if (!this.measurements.has(componentName)) {
        this.measurements.set(componentName, []);
      }
      
      this.measurements.get(componentName)!.push(duration);
      
      // Log slow renders (>16ms for 60fps)
      if (duration > 16) {
        console.warn(`Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  /**
   * Get average render time for a component
   */
  getAverage(componentName: string): number {
    const times = this.measurements.get(componentName);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  /**
   * Get all measurements
   */
  getReport(): Record<string, { count: number; average: number; max: number }> {
    const report: Record<string, { count: number; average: number; max: number }> = {};
    
    this.measurements.forEach((times, name) => {
      report[name] = {
        count: times.length,
        average: times.reduce((sum, t) => sum + t, 0) / times.length,
        max: Math.max(...times),
      };
    });
    
    return report;
  }
  
  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
  }
  
  /**
   * Log report to console
   */
  logReport(): void {
    console.table(this.getReport());
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * HOC to monitor component performance
 * Note: For JSX support, this should be used in .tsx files
 */
export function withPerformanceMonitor<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
): ComponentType<P> {
  const name = componentName || Component.displayName || Component.name || 'Unknown';
  
  const WrappedComponent = (props: P) => {
    const endMeasure = performanceMonitor.start(name);
    
    // Schedule measurement end after render
    setTimeout(endMeasure, 0);
    
    // Use createElement for TypeScript compatibility
    return createElement(Component, props);
  };
  
  WrappedComponent.displayName = `withPerformanceMonitor(${name})`;
  
  return WrappedComponent as ComponentType<P>;
}

/**
 * Batch state updates to reduce re-renders
 * Useful when updating multiple states at once
 */
export function batchUpdates<T>(updates: Array<() => void>): void {
  // React 18+ automatically batches updates
  // This is a compatibility layer for older versions
  if (typeof (window as any).queueMicrotask === 'function') {
    (window as any).queueMicrotask(() => {
      updates.forEach(update => update());
    });
  } else {
    Promise.resolve().then(() => {
      updates.forEach(update => update());
    });
  }
}

/**
 * Optimize large list rendering by virtualization helpers
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { startIndex: number; endIndex: number; offsetY: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(totalItems, startIndex + visibleCount);
  const offsetY = startIndex * itemHeight;
  
  return { startIndex, endIndex, offsetY };
}

/**
 * Debounce for performance-critical operations
 */
export function performanceDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 16 // One frame at 60fps
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let rafId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    if (rafId) cancelAnimationFrame(rafId);
    
    rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => fn(...args), delay);
    });
  };
}

/**
 * Throttle for scroll/resize handlers
 */
export function performanceThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 16
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let rafId: number | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (Date.now() - lastCall >= delay) {
          lastCall = Date.now();
          fn(...args);
        }
      });
    }
  };
}

/**
 * Check if code is running in production
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if code is running in development
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Measure and log component mount time
 */
export function logComponentMount(componentName: string, startTime: number): void {
  if (isDevelopment) {
    const mountTime = performance.now() - startTime;
    console.log(`⚡ ${componentName} mounted in ${mountTime.toFixed(2)}ms`);
  }
}
