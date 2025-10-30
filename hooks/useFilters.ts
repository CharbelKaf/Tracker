import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Filter configuration
 */
export interface FilterConfig {
  /** Default value */
  defaultValue?: any;
  /** Serialize value to URL string */
  serialize?: (value: any) => string;
  /** Deserialize value from URL string */
  deserialize?: (value: string) => any;
  /** Persist in localStorage */
  persist?: boolean;
}

/**
 * Filter state
 */
export interface FilterState {
  [key: string]: any;
}

/**
 * Hook for managing URL-synced filters with localStorage persistence
 * 
 * @example
 * const filters = useFilters({
 *   search: { defaultValue: '', persist: true },
 *   status: { defaultValue: 'all' },
 *   category: { defaultValue: '' },
 *   page: { 
 *     defaultValue: 1,
 *     serialize: (v) => String(v),
 *     deserialize: (v) => parseInt(v) || 1
 *   }
 * }, 'inventory-filters');
 * 
 * // Use filters
 * <input value={filters.values.search} onChange={(e) => filters.setFilter('search', e.target.value)} />
 * 
 * // Reset all
 * <button onClick={filters.reset}>Reset</button>
 */
export function useFilters(
  config: Record<string, FilterConfig>,
  storageKey?: string
) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL or localStorage or defaults
  const getInitialFilters = useCallback((): FilterState => {
    const filters: FilterState = {};
    
    Object.keys(config).forEach(key => {
      const filterConfig = config[key];
      
      // 1. Try to get from URL
      const urlValue = searchParams.get(key);
      if (urlValue !== null) {
        filters[key] = filterConfig.deserialize
          ? filterConfig.deserialize(urlValue)
          : urlValue;
        return;
      }
      
      // 2. Try to get from localStorage if persist is enabled
      if (storageKey && filterConfig.persist) {
        try {
          const stored = localStorage.getItem(`${storageKey}_${key}`);
          if (stored !== null) {
            filters[key] = JSON.parse(stored);
            return;
          }
        } catch (e) {
          console.warn(`Failed to load filter ${key} from localStorage:`, e);
        }
      }
      
      // 3. Use default value
      filters[key] = filterConfig.defaultValue;
    });
    
    return filters;
  }, [config, searchParams, storageKey]);

  const [filters, setFilters] = useState<FilterState>(getInitialFilters);

  // Sync to URL
  const syncToURL = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();
    
    Object.keys(newFilters).forEach(key => {
      const value = newFilters[key];
      const filterConfig = config[key];
      const defaultValue = filterConfig?.defaultValue;
      
      // Only add to URL if value is different from default
      if (value !== defaultValue && value !== '' && value !== null && value !== undefined) {
        const serialized = filterConfig?.serialize
          ? filterConfig.serialize(value)
          : String(value);
        params.set(key, serialized);
      }
    });
    
    setSearchParams(params, { replace: true });
  }, [config, setSearchParams]);

  // Sync to localStorage
  const syncToStorage = useCallback((newFilters: FilterState) => {
    if (!storageKey) return;
    
    Object.keys(newFilters).forEach(key => {
      const filterConfig = config[key];
      if (filterConfig?.persist) {
        try {
          localStorage.setItem(
            `${storageKey}_${key}`,
            JSON.stringify(newFilters[key])
          );
        } catch (e) {
          console.warn(`Failed to save filter ${key} to localStorage:`, e);
        }
      }
    });
  }, [config, storageKey]);

  // Set a single filter
  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      syncToURL(newFilters);
      syncToStorage(newFilters);
      return newFilters;
    });
  }, [syncToURL, syncToStorage]);

  // Set multiple filters at once
  const setFilters_Multi = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      syncToURL(newFilters);
      syncToStorage(newFilters);
      return newFilters;
    });
  }, [syncToURL, syncToStorage]);

  // Reset filters to defaults
  const reset = useCallback(() => {
    const defaults: FilterState = {};
    Object.keys(config).forEach(key => {
      defaults[key] = config[key].defaultValue;
    });
    
    setFilters(defaults);
    syncToURL(defaults);
    
    // Clear localStorage
    if (storageKey) {
      Object.keys(config).forEach(key => {
        if (config[key].persist) {
          localStorage.removeItem(`${storageKey}_${key}`);
        }
      });
    }
  }, [config, syncToURL, storageKey]);

  // Reset a single filter
  const resetFilter = useCallback((key: string) => {
    const defaultValue = config[key]?.defaultValue;
    setFilter(key, defaultValue);
  }, [config, setFilter]);

  // Check if filters are active (different from defaults)
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key];
      const defaultValue = config[key]?.defaultValue;
      return value !== defaultValue && value !== '' && value !== null;
    });
  }, [filters, config]);

  // Get count of active filters
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key];
      const defaultValue = config[key]?.defaultValue;
      return value !== defaultValue && value !== '' && value !== null;
    }).length;
  }, [filters, config]);

  // Sync from URL on mount
  useEffect(() => {
    const urlFilters = getInitialFilters();
    setFilters(urlFilters);
  }, []); // Run once on mount

  return {
    values: filters,
    setFilter,
    setFilters: setFilters_Multi,
    reset,
    resetFilter,
    hasActiveFilters,
    activeFilterCount,
  };
}

/**
 * Hook for search with history
 */
export function useSearchHistory(maxItems: number = 10, storageKey: string = 'search-history') {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    
    setHistory(prev => {
      const filtered = prev.filter(item => item !== term);
      const newHistory = [term, ...filtered].slice(0, maxItems);
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      } catch (e) {
        console.warn('Failed to save search history:', e);
      }
      
      return newHistory;
    });
  }, [maxItems, storageKey]);

  const removeFromHistory = useCallback((term: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== term);
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
      } catch (e) {
        console.warn('Failed to save search history:', e);
      }
      
      return newHistory;
    });
  }, [storageKey]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear search history:', e);
    }
  }, [storageKey]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
