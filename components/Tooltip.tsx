import React, { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  align?: 'top' | 'right';
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, align = 'top', disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = useId();

  if (disabled) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'top-1/2 -translate-y-1/2 left-full ml-3'
  } as const;

  const arrowClasses = {
    top: 'absolute top-full left-1/2 -translate-x-1/2 h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-secondary-900 dark:border-t-secondary-100',
    right: 'absolute top-1/2 -translate-y-1/2 -left-1 h-0 w-0 border-y-4 border-y-transparent border-r-4 border-r-secondary-900 dark:border-r-secondary-100'
  } as const;

  const show = () => setIsVisible(true);
  const hide = () => setIsVisible(false);

  const clonedChild = React.isValidElement(children)
    ? React.cloneElement(children, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      } as React.AriaAttributes)
    : children;

  const springTransition = { type: 'spring' as const, stiffness: 260, damping: 22 };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
      onTouchStart={show}
      onTouchEnd={hide}
      onTouchCancel={hide}
      onKeyDown={(event) => {
        if (event.key === 'Escape') hide();
      }}
      role="presentation"
    >
      {clonedChild}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="tooltip"
            id={tooltipId}
            initial={{ opacity: 0, scale: 0.95, y: align === 'top' ? 6 : 0, x: align === 'right' ? -6 : 0 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, transition: springTransition }}
            exit={{ opacity: 0, scale: 0.95, y: align === 'top' ? 6 : 0, x: align === 'right' ? -6 : 0, transition: { duration: 0.15 } }}
            className={`pointer-events-none absolute w-auto whitespace-nowrap rounded-[var(--radius-card)] bg-gradient-to-br from-secondary-900 via-gray-900 to-secondary-800/95 dark:from-secondary-200 dark:via-secondary-100 dark:to-white px-3 py-1.5 text-center text-sm font-semibold text-white dark:text-secondary-900 shadow-[var(--shadow-elev-3)] backdrop-blur-sm border border-secondary-700/60 dark:border-secondary-200/50 z-50 ${positionClasses[align]}`}
          >
            {content}
            <div className={arrowClasses[align]}></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;