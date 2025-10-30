import React from 'react';

/**
 * Skip to main content link for keyboard navigation
 * Allows users to bypass navigation and jump directly to content
 */
export const SkipLink: React.FC = () => {
  const skipToMain = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  return (
    <a
      href="#main-content"
      onClick={skipToMain}
      className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
    >
      Aller au contenu principal
    </a>
  );
};

/**
 * Screen reader only text utility
 * Visually hidden but accessible to screen readers
 */
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="sr-only">{children}</span>;
};

/**
 * Announce live region changes to screen readers
 */
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  level?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}> = ({ children, level = 'polite', atomic = false }) => {
  return (
    <div
      role="status"
      aria-live={level}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
};
