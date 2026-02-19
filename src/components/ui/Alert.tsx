import React from 'react';
import { cn } from '../../lib/utils';

interface AlertProps {
  variant?: 'info' | 'warning' | 'success' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', children, className }) => {
  const variants = {
    info: 'bg-secondary-container text-on-secondary-container border-outline-variant',
    warning: 'bg-primary-container text-on-primary-container border-outline-variant',
    success: 'bg-tertiary-container text-on-tertiary-container border-outline-variant',
    danger: 'bg-error-container text-on-error-container border-outline-variant',
  };

  return (
    <div role="alert" className={cn("p-4 rounded-md border flex items-start gap-3 text-body-medium", variants[variant], className)}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-body-small leading-relaxed">{children}</div>
);