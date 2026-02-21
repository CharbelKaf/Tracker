import React from 'react';
import { cn } from '../../lib/utils';

interface BottomAppBarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MD3 Bottom App Bar container.
 * Height: 80dp, elevation level 2.
 */
const BottomAppBar: React.FC<BottomAppBarProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "h-20 w-full bg-surface-container border-t border-outline-variant shadow-elevation-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export default BottomAppBar;
