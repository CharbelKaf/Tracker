import { useEffect, useCallback, RefObject } from 'react';

/**
 * Hook for keyboard navigation within a container
 * Supports arrow keys, Home, End, and Enter/Space
 */
export function useKeyboardNav<T extends HTMLElement>(
  containerRef: RefObject<T>,
  options: {
    itemSelector: string;
    onSelect?: (element: Element) => void;
    orientation?: 'vertical' | 'horizontal' | 'both';
    loop?: boolean;
  }
) {
  const { itemSelector, onSelect, orientation = 'both', loop = true } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const items = Array.from(
        containerRef.current.querySelectorAll(itemSelector)
      ) as HTMLElement[];

      if (items.length === 0) return;

      const activeElement = document.activeElement as HTMLElement;
      const currentIndex = items.indexOf(activeElement);

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = loop ? 0 : items.length - 1;
            }
          }
          break;

        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? items.length - 1 : 0;
            }
          }
          break;

        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= items.length) {
              nextIndex = loop ? 0 : items.length - 1;
            }
          }
          break;

        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? items.length - 1 : 0;
            }
          }
          break;

        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          nextIndex = items.length - 1;
          break;

        case 'Enter':
        case ' ':
          if (currentIndex >= 0 && onSelect) {
            e.preventDefault();
            onSelect(items[currentIndex]);
          }
          return;

        default:
          return;
      }

      if (nextIndex !== currentIndex && items[nextIndex]) {
        items[nextIndex].focus();
      }
    },
    [containerRef, itemSelector, onSelect, orientation, loop]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      container.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [containerRef, handleKeyDown]);
}

/**
 * Hook for escape key handling
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onEscape, enabled]);
}

/**
 * Hook for focus trap (useful for modals)
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    // Focus first element on mount
    firstFocusable?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab as EventListener);

    return () => {
      container.removeEventListener('keydown', handleTab as EventListener);
    };
  }, [containerRef, isActive]);
}

/**
 * Hook for roving tabindex pattern
 * Only one item in a group is tabbable at a time
 */
export function useRovingTabIndex<T extends HTMLElement>(
  containerRef: RefObject<T>,
  itemSelector: string
) {
  useEffect(() => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll(itemSelector)
    ) as HTMLElement[];

    if (items.length === 0) return;

    // Set first item as tabbable
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target.matches(itemSelector)) return;

      // Make focused item tabbable, others not
      items.forEach(item => {
        item.setAttribute('tabindex', item === target ? '0' : '-1');
      });
    };

    containerRef.current.addEventListener('focus', handleFocus, true);

    return () => {
      containerRef.current?.removeEventListener('focus', handleFocus, true);
    };
  }, [containerRef, itemSelector]);
}
