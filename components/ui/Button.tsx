import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  icon?: string; // material icon name
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-primary-500 via-primary-500/95 to-primary-600 text-gray-900 hover:brightness-105 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700',
  secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700',
  danger: 'bg-status-danger-600 text-white hover:bg-status-danger-500 focus-visible:outline-status-danger-400 disabled:bg-gray-300 dark:disabled:bg-gray-700',
  ghost: 'bg-transparent text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100/60 dark:hover:bg-secondary-800/60',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-12 px-4 text-base',
  lg: 'h-14 px-6 text-base',
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  block,
  loading,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center rounded-[var(--radius-button)] font-semibold transition-all duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 shadow-[var(--shadow-elev-1)] hover:shadow-[var(--shadow-elev-2)] hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 disabled:shadow-none';
  const classes = [
    base,
    variantClasses[variant],
    sizeClasses[size],
    block ? 'w-full' : '',
    loading ? 'opacity-80' : '',
    disabled ? 'cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ');

  const iconEl = icon ? (
    <span className={`material-symbols-outlined ${size === 'sm' ? '!text-base' : '!text-xl'} ${children ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : ''}`}>
      {loading ? 'autorenew' : icon}
    </span>
  ) : null;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {icon && iconPosition === 'left' && iconEl}
      <span className="truncate">{children}</span>
      {icon && iconPosition === 'right' && iconEl}
    </button>
  );
};

export default Button;
