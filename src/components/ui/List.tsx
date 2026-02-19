import React from 'react';
import { cn } from '../../lib/utils';

export interface ListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * MD3 List container.
 */
const List: React.FC<ListProps> = ({ children, className }) => {
  return (
    <ul className={cn('w-full bg-surface', className)} role="list">
      {children}
    </ul>
  );
};

export default List;

