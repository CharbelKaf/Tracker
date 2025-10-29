import React from 'react';

export function useFocusTrap(modalRef: React.RefObject<HTMLElement>, isOpen: boolean) {
  const triggerElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        setTimeout(() => firstElement.focus(), 50);

        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            return;
          }
          if (e.key !== 'Tab') return;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          triggerElementRef.current?.focus();
        };
      }
    }
  }, [isOpen, modalRef]);
}
