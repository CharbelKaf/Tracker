import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * MD3 Badge / Chip-like indicator.
 * Uses MD3 color container tokens for each variant.
 */
const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-container-highest text-on-surface border-outline-variant',
  success: 'bg-tertiary-container text-on-tertiary-container border-transparent',
  warning: 'bg-primary-container text-on-primary-container border-transparent',
  danger: 'bg-error-container text-on-error-container border-transparent',
  info: 'bg-secondary-container text-on-secondary-container border-transparent',
  neutral: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className
}) => {
  return (
    <span className={cn(
      "inline-flex items-center justify-center px-2.5 py-0.5 rounded-sm text-label-small border whitespace-nowrap",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};

export default Badge;

